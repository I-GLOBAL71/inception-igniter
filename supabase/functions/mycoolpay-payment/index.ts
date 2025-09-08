import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MyCoolPayRequest {
  action: 'process_payin' | 'process_payout' | 'check_status';
  amount?: number;
  currency?: string;
  user_id?: string;
  transaction_id?: string;
  payment_method?: string;
  phone_number?: string;
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

    const { action, amount, currency = 'XOF', user_id, transaction_id, payment_method, phone_number } = await req.json() as MyCoolPayRequest;

    // Get MyCoolPay API key from admin settings
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'mycoolpay_api_key')
      .single();

    if (!adminSettings?.value) {
      throw new Error('MyCoolPay API key not configured');
    }

    const apiKey = adminSettings.value;
    const baseUrl = 'https://my-coolpay.com/api/v1';

    console.log(`Processing MyCoolPay ${action} request for user ${user_id}`);

    switch (action) {
      case 'process_payin':
        if (!user_id || !amount || !phone_number) {
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
            payment_gateway: 'mycoolpay',
            status: 'pending'
          })
          .select()
          .single();

        if (transactionError) {
          throw new Error(`Transaction creation failed: ${transactionError.message}`);
        }

        // Initiate payment with MyCoolPay
        const payinResponse = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            phone_number,
            reference: transaction.id,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mycoolpay-webhook`,
            description: 'Tetris Game Deposit'
          }),
        });

        if (!payinResponse.ok) {
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transaction.id);
          
          throw new Error(`Payment failed: ${await payinResponse.text()}`);
        }

        const payinData = await payinResponse.json();

        // Update transaction with external ID
        await supabase
          .from('transactions')
          .update({ 
            external_transaction_id: payinData.transaction_id,
            metadata: payinData 
          })
          .eq('id', transaction.id);

        console.log('Payment initiated:', payinData);

        return new Response(JSON.stringify({ 
          success: true, 
          transaction_id: transaction.id,
          data: payinData 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'process_payout':
        if (!user_id || !amount || !phone_number) {
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
            payment_gateway: 'mycoolpay',
            status: 'pending'
          })
          .select()
          .single();

        if (withdrawalError) {
          throw new Error(`Withdrawal transaction creation failed: ${withdrawalError.message}`);
        }

        // Process payout with MyCoolPay
        const payoutResponse = await fetch(`${baseUrl}/payouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            phone_number,
            reference: withdrawalTransaction.id,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mycoolpay-webhook`,
            description: 'Tetris Game Withdrawal'
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
            external_transaction_id: payoutData.transaction_id,
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

        const statusResponse = await fetch(`${baseUrl}/payments/${statusTransaction.external_transaction_id}/status`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
    console.error('MyCoolPay payment error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});