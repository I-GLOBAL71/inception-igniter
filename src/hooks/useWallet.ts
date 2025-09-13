import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Wallet = Tables<'wallets'>;
type Transaction = Tables<'transactions'>;

export const useWallet = (userId?: string) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch wallet information
  const fetchWallet = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error('Wallet fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data as Transaction[] || []);
    } catch (error) {
      console.error('Transactions fetch error:', error);
    }
  }, [userId]);

  // Process deposit with Lygos
  const depositWithLygos = async (amount: number, paymentMethod: string) => {
    if (!userId) {
      setTimeout(() => toast.error('Utilisateur non connecté'), 0);
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('lygos-payment', {
        body: {
          action: 'process_payin',
          amount,
          currency: 'XOF',
          user_id: userId,
          payment_method: paymentMethod
        }
      });

      if (error) throw error;

      if (data.success) {
        setTimeout(() => toast.success('Dépôt initié avec succès'), 0);
        fetchWallet();
        fetchTransactions();
        return { success: true, paymentUrl: data.payment_url, transactionId: data.transaction_id };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Full Lygos deposit error object:', JSON.stringify(error, null, 2));
      console.error('Deposit error:', error);
      const errorMessage = error.context?.error || error.message || 'Erreur lors du dépôt';
      setTimeout(() => toast.error(errorMessage), 0);
      return { success: false, error: errorMessage };
    }
  };

  // Initiate a payment with MyCoolPay
  const initiateMyCoolPayPayment = async (paymentData: any, method: 'orange' | 'mtn' | 'card', phoneNumber?: string) => {
    if (!userId) {
      setTimeout(() => toast.error('Utilisateur non connecté'), 0);
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-payment', {
        body: {
          action: 'initiate_payment',
          paymentData,
          method,
          phoneNumber,
          user_id: userId,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setTimeout(() => toast.success('Paiement initié, veuillez suivre les instructions.'), 0);
      return { success: true, ...data };
    } catch (err: any) {
      console.error('MyCoolPay initiation error:', err);
      setTimeout(() => toast.error(err.message || 'Erreur lors de l\'initiation du paiement.'), 0);
      return { success: false, error: err.message };
    }
  };

  // Verify OTP for a MyCoolPay transaction
  const verifyMyCoolPayOtp = async (transaction_ref: string, otpCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-payment', {
        body: {
          action: 'authorize_payment',
          transaction_ref,
          otpCode,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTimeout(() => toast.success('Code OTP vérifié.'), 0);
      return { success: true, ...data };
    } catch (err: any) {
      console.error('MyCoolPay OTP error:', err);
      setTimeout(() => toast.error(err.message || 'Erreur lors de la vérification OTP.'), 0);
      return { success: false, error: err.message };
    }
  };

  // Check status of a MyCoolPay transaction
  const checkMyCoolPayStatus = async (transaction_ref: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-payment', {
        body: {
          action: 'check_status',
          transaction_ref,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Potentially refresh wallet/transactions if status is final
      if (data.transaction_status === 'SUCCESS' || data.transaction_status === 'FAILED') {
        fetchWallet();
        fetchTransactions();
      }

      return { success: true, ...data };
    } catch (err: any) {
      console.error('MyCoolPay status check error:', err);
      // Do not toast here as this is a background check
      return { success: false, error: err.message };
    }
  };

  // Process withdrawal
  const withdraw = async (amount: number, paymentMethod: string, gateway: 'lygos' | 'mycoolpay', details: any) => {
    if (!userId || !wallet || wallet.balance < amount) {
      setTimeout(() => toast.error('Solde insuffisant'), 0);
      return { success: false };
    }

    try {
      const functionName = gateway === 'lygos' ? 'lygos-payment' : 'mycoolpay-payment';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'process_payout',
          amount,
          currency: 'XOF',
          user_id: userId,
          payment_method: paymentMethod,
          ...(gateway === 'lygos' ? { gateway_data: details } : { phone_number: details.phone_number })
        }
      });

      if (error) throw error;

      if (data.success) {
        setTimeout(() => toast.success('Retrait initié avec succès'), 0);
        fetchWallet();
        fetchTransactions();
        return { success: true, transactionId: data.transaction_id };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Full withdrawal error object:', JSON.stringify(error, null, 2));
      console.error('Withdrawal error:', error);
      const errorMessage = error.context?.error || error.message || 'Erreur lors du retrait';
      setTimeout(() => toast.error(errorMessage), 0);
      return { success: false, error: errorMessage };
    }
  };

  // Process game bet (deduct from wallet)
  const processBet = async (betAmount: number, gameId: string) => {
    if (!userId || !wallet || wallet.balance < betAmount) {
      setTimeout(() => toast.error('Solde insuffisant pour cette mise'), 0);
      return { success: false };
    }

    try {
      // Create game bet transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: wallet.id,
          type: 'game_bet',
          amount: -betAmount,
          currency: 'XOF',
          status: 'completed',
          game_id: gameId
        })
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - betAmount })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Refresh data
      fetchWallet();
      fetchTransactions();

      return { success: true, transactionId: data.id };
    } catch (error: any) {
      console.error('Bet processing error:', error);
      setTimeout(() => toast.error('Erreur lors du traitement de la mise'), 0);
      return { success: false, error: error.message };
    }
  };

  // Process game win (add to wallet)
  const processWin = async (winAmount: number, gameId: string) => {
    if (!userId || !wallet) {
      return { success: false };
    }

    try {
      // Create game win transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: wallet.id,
          type: 'game_win',
          amount: winAmount,
          currency: 'XOF',
          status: 'completed',
          game_id: gameId
        })
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance + winAmount })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Refresh data
      fetchWallet();
      fetchTransactions();

      setTimeout(() => toast.success(`Gain de ${winAmount} FCFA ajouté à votre solde !`), 0);
      return { success: true, transactionId: data.id };
    } catch (error: any) {
      console.error('Win processing error:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWallet();
      fetchTransactions();
    }
  }, [userId, fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    loading,
    fetchWallet,
    fetchTransactions,
    depositWithLygos,
    initiateMyCoolPayPayment,
    verifyMyCoolPayOtp,
    checkMyCoolPayStatus,
    withdraw,
    processBet,
    processWin
  };
};