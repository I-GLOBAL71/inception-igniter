import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LygosPaymentRequest {
  action: 'create_gateway' | 'process_payin' | 'process_payout' | 'check_status';
  amount?: number;
  currency?: string;
  user_id?: string;
  transaction_id?: string;
  payment_method?: string;
  gateway_data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, amount, currency = 'XOF', user_id, transaction_id, payment_method, gateway_data } = await req.json() as LygosPaymentRequest;

    // Get Lygos API key from admin settings
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'lygos_api_key')
      .single();

    if (!adminSettings?.value) {
      throw new Error('Lygos API key not configured');
    }

    const lygosApiKey = adminSettings.value;
    const lygosBaseUrl = 'https://api.lygosapp.com/v1';

    console.log(`Processing Lygos ${action} request for user ${user_id}`);

    switch (action) {
      case 'create_gateway':
        // Create payment gateway
        const gatewayResponse = await fetch(`${lygosBaseUrl}/gateway`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lygosApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Tetris Game Gateway',
            currency: currency,
            webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lygos-webhook`,
            ...gateway_data
          }),
        });

        if (!gatewayResponse.ok) {
          throw new Error(`Gateway creation failed: ${await gatewayResponse.text()}`);
        }

        const gatewayData = await gatewayResponse.json();
        console.log('Gateway created:', gatewayData);

        return new Response(JSON.stringify({ success: true, data: gatewayData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'process_payin':
        if (!user_id || !amount) {
          throw new Error('Missing required fields for payin');
        }

        // Create transaction record
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id,
            wallet_id: (await supabase.from('wallets').select('id').eq('user_id', user_id).single()).data?.id,
            type: 'deposit',
            amount,
            currency,
            payment_method,
            payment_gateway: 'lygos',
            status: 'pending'
          })
          .select()
          .single();

        if (transactionError) {
          throw new Error(`Transaction creation failed: ${transactionError.message}`);
        }

        // Initiate payin with Lygos
        const payinResponse = await fetch(`${lygosBaseUrl}/payin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lygosApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount * 100, // Convert to cents
            currency,
            reference: transaction.id,
            customer: {
              id: user_id,
              email: (await supabase.from('profiles').select('email').eq('user_id', user_id).single()).data?.email
            },
            payment_method,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lygos-webhook`
          }),
        });

        if (!payinResponse.ok) {
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transaction.id);
          
          throw new Error(`Payin failed: ${await payinResponse.text()}`);
        }

        const payinData = await payinResponse.json();

        // Update transaction with external ID
        await supabase
          .from('transactions')
          .update({ 
            external_transaction_id: payinData.id,
            metadata: payinData 
          })
          .eq('id', transaction.id);

        console.log('Payin initiated:', payinData);

        return new Response(JSON.stringify({ 
          success: true, 
          transaction_id: transaction.id,
          payment_url: payinData.payment_url,
          data: payinData 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'process_payout':
        if (!user_id || !amount) {
          throw new Error('Missing required fields for payout');
        }

        // Check user balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (!wallet || wallet.balance < amount) {
          throw new Error('Insufficient balance');
        }

        // Create withdrawal transaction
        const { data: withdrawalTransaction, error: withdrawalError } = await supabase
          .from('transactions')
          .insert({
            user_id,
            wallet_id: wallet.id,
            type: 'withdrawal',
            amount: -amount,
            currency,
            payment_method,
            payment_gateway: 'lygos',
            status: 'pending'
          })
          .select()
          .single();

        if (withdrawalError) {
          throw new Error(`Withdrawal transaction creation failed: ${withdrawalError.message}`);
        }

        // Process payout with Lygos
        const payoutResponse = await fetch(`${lygosBaseUrl}/payout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lygosApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount * 100,
            currency,
            reference: withdrawalTransaction.id,
            recipient: gateway_data,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lygos-webhook`
          }),
        });

        if (!payoutResponse.ok) {
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', withdrawalTransaction.id);
          
          throw new Error(`Payout failed: ${await payoutResponse.text()}`);
        }

        const payoutData = await payoutResponse.json();

        // Update transaction and deduct from wallet
        await supabase
          .from('transactions')
          .update({ 
            external_transaction_id: payoutData.id,
            metadata: payoutData 
          })
          .eq('id', withdrawalTransaction.id);

        // Deduct from wallet
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance - amount })
          .eq('id', wallet.id);

        console.log('Payout initiated:', payoutData);

        return new Response(JSON.stringify({ 
          success: true, 
          transaction_id: withdrawalTransaction.id,
          data: payoutData 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'check_status':
        if (!transaction_id) {
          throw new Error('Transaction ID required');
        }

        const { data: statusTransaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transaction_id)
          .single();

        if (!statusTransaction?.external_transaction_id) {
          throw new Error('External transaction ID not found');
        }

        const statusResponse = await fetch(`${lygosBaseUrl}/payin/${statusTransaction.external_transaction_id}/status`, {
          headers: {
            'Authorization': `Bearer ${lygosApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${await statusResponse.text()}`);
        }

        const statusData = await statusResponse.json();
        console.log('Transaction status:', statusData);

        return new Response(JSON.stringify({ success: true, data: statusData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Lygos payment error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});