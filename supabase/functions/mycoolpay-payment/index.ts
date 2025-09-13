import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  action: 'initiate_payment' | 'authorize_payment' | 'check_status';
  paymentData: {
    amount: number;
    reason: string;
    reference: string;
    customerName?: string;
    customerEmail?: string;
  };
  method: 'orange' | 'mtn' | 'card';
  phoneNumber?: string;
  otpCode?: string;
  transaction_ref?: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: PaymentRequest = await req.json();
    const { action, user_id } = body;

    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['mycoolpay_private_key', 'mycoolpay_public_key']);

    if (settingsError) {
      throw new Error(`Failed to fetch MyCoolPay settings: ${settingsError.message}`);
    }

    const privateKey = adminSettings?.find(s => s.key === 'mycoolpay_private_key')?.value;
    const publicKey = adminSettings?.find(s => s.key === 'mycoolpay_public_key')?.value;

    if (!privateKey || !publicKey) {
      throw new Error('MyCoolPay API keys are not configured');
    }

    console.log(`Verifying updated MyCoolPay Keys:`, { publicKey, privateKey: privateKey ? '********' : 'Not Found' });

    const baseUrl = `https://my-coolpay.com/api/${publicKey}`;

    switch (action) {
      case 'initiate_payment': {
        const { paymentData, method, phoneNumber } = body;

        const apiPayload = {
          transaction_amount: paymentData.amount,
          transaction_currency: 'XAF',
          transaction_reason: paymentData.reason,
          app_transaction_ref: paymentData.reference,
          customer_name: paymentData.customerName,
          customer_email: paymentData.customerEmail,
          customer_lang: 'fr',
          ...(phoneNumber && { customer_phone_number: phoneNumber }),
        };

        const endpoint = method === 'card' ? 'paylink' : 'payin';
        const url = `${baseUrl}/${endpoint}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${privateKey}`,
            'X-App-Key': publicKey
          },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`MyCoolPay API error: ${errorBody}`);
        }

        const result = await response.json();
        
        // Store transaction in DB
        const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', user_id).single();
        if (!wallet) throw new Error('User wallet not found');

        await supabase.from('transactions').insert({
            user_id,
            wallet_id: wallet.id,
            type: 'deposit',
            amount: paymentData.amount,
            currency: 'XAF',
            payment_method: method,
            payment_gateway: 'mycoolpay',
            status: 'pending',
            external_transaction_id: result.transaction_ref,
            metadata: result,
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authorize_payment': {
        const { transaction_ref, otpCode } = body;
        if (!transaction_ref || !otpCode) {
          throw new Error('Missing transaction reference or OTP code');
        }

        const response = await fetch(`${baseUrl}/payin/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${privateKey}`,
            'X-App-Key': publicKey
          },
          body: JSON.stringify({ transaction_ref, code: otpCode }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`OTP verification failed: ${errorBody}`);
        }

        const result = await response.json();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_status': {
        const { transaction_ref } = body;
        if (!transaction_ref) {
          throw new Error('Transaction reference is required');
        }

        const response = await fetch(`${baseUrl}/checkStatus/${transaction_ref}`, {
          headers: {
            'Authorization': `Bearer ${privateKey}`,
            'X-App-Key': publicKey
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Status check failed: ${errorBody}`);
        }

        const result = await response.json();

        // Update transaction status in DB
        if (result.status === 'success') {
            const dbStatus = result.transaction_status === 'SUCCESS' ? 'completed' : 
                             result.transaction_status === 'FAILED' ? 'failed' :
                             result.transaction_status === 'CANCELED' ? 'cancelled' : 'pending';

            if (dbStatus !== 'pending') {
                await supabase
                    .from('transactions')
                    .update({ status: dbStatus })
                    .eq('external_transaction_id', transaction_ref);
            }
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('MyCoolPay integration error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});