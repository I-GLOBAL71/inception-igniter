/// <reference types="https://deno.land/x/deno/cli/types/dts/lib.deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MYCOOLPAY_API_KEY = Deno.env.get('MYCOOLPAY_API_KEY')
const MYCOOLPAY_PRIVATE_KEY = Deno.env.get('MYCOOLPAY_PRIVATE_KEY')
const MYCOOLPAY_API_URL = 'https://api.my-coolpay.com/v2'

serve(async (req) => {
  const { method } = req
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const body = await req.json()
  const { action } = body

  if (action === 'process_withdrawal') {
    const { operator, amount, reason, customerIdentifier, userId } = body

    // Server-side validation
    if (amount < 1000) {
      return new Response(JSON.stringify({ success: false, message: 'Le montant minimum est de 1000 XAF' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Check user balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ success: false, message: 'Portefeuille non trouvé' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    const feeRate = { 'CM_MOMO': 0.02, 'CM_OM': 0.025, 'MCP': 0.01 }[operator] || 0
    const fees = amount * feeRate
    const totalDebit = amount + fees

    if (wallet.balance < totalDebit) {
      return new Response(JSON.stringify({ success: false, message: 'Solde insuffisant' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const transaction_ref = `WDL-${Date.now()}`

    const payload = {
      private_key: MYCOOLPAY_PRIVATE_KEY,
      transaction_amount: amount,
      transaction_currency: 'XAF',
      transaction_reason: reason,
      transaction_operator: operator,
      app_transaction_ref: transaction_ref,
      customer_name: user.email,
      customer_phone_number: operator !== 'MCP' ? customerIdentifier : undefined,
      customer_email: user.email,
      ...(operator === 'MCP' && { customer_account_identifier: customerIdentifier }),
    }

    try {
      const response = await fetch(`${MYCOOLPAY_API_URL}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': MYCOOLPAY_API_KEY,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        // OPTIMISTIC: Deduct from balance immediately. A better approach would be to use webhooks.
        const { error: updateError } = await supabaseClient
          .from('wallets')
          .update({ balance: wallet.balance - totalDebit })
          .eq('user_id', userId)

        if (updateError) throw new Error(updateError.message)

        // Log transaction
        await supabaseClient.from('transactions').insert({
          user_id: userId,
          type: 'withdrawal',
          amount: amount,
          fees: fees,
          total: totalDebit,
          provider: 'mycoolpay',
          provider_ref: result.transaction_ref, // Use provider's ref
          app_ref: transaction_ref, // Our internal ref
          status: 'pending',
          metadata: result,
        })

        return new Response(JSON.stringify({ success: true, transactionRef: result.transaction_ref }), { headers: { 'Content-Type': 'application/json' } })
      } else {
        return new Response(JSON.stringify({ success: false, message: result.message || 'Erreur inconnue' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  if (action === 'check_status') {
    const { transactionRef } = body
    if (!transactionRef) {
      return new Response(JSON.stringify({ error: 'Référence de transaction manquante' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    try {
      const response = await fetch(`${MYCOOLPAY_API_URL}/transaction/status?transaction_ref=${transactionRef}`, {
        headers: { 'api_key': MYCOOLPAY_API_KEY },
      })
      const result = await response.json()

      // Update our internal transaction status
      if (result.success) {
        const newStatus = result.transaction_status.toLowerCase();
        const { data: txn, error } = await supabaseClient
          .from('transactions')
          .update({ status: newStatus })
          .eq('provider_ref', transactionRef)
          .select()
          .single();
        
        // If transaction failed, and we debited optimistically, we should refund.
        if (newStatus === 'failed' && txn && txn.status !== 'failed') {
            const { data: wallet, error: walletError } = await supabaseClient.from('wallets').select('balance').eq('user_id', txn.user_id).single();
            if (wallet) {
                await supabaseClient.from('wallets').update({ balance: wallet.balance + txn.total }).eq('user_id', txn.user_id);
            }
        }
      }

      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ message: 'Action non valide' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
})