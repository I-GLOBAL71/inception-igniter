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
      toast.error('Utilisateur non connecté');
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
        toast.success('Dépôt initié avec succès');
        fetchWallet();
        fetchTransactions();
        return { success: true, paymentUrl: data.payment_url, transactionId: data.transaction_id };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Erreur lors du dépôt');
      return { success: false, error: error.message };
    }
  };

  // Process deposit with MyCoolPay
  const depositWithMyCoolPay = async (amount: number, phoneNumber: string) => {
    if (!userId) {
      toast.error('Utilisateur non connecté');
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-payment', {
        body: {
          action: 'process_payin',
          amount,
          currency: 'XOF',
          user_id: userId,
          phone_number: phoneNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Dépôt initié avec succès');
        fetchWallet();
        fetchTransactions();
        return { success: true, transactionId: data.transaction_id };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Erreur lors du dépôt');
      return { success: false, error: error.message };
    }
  };

  // Process withdrawal
  const withdraw = async (amount: number, paymentMethod: string, gateway: 'lygos' | 'mycoolpay', details: any) => {
    if (!userId || !wallet || wallet.balance < amount) {
      toast.error('Solde insuffisant');
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
        toast.success('Retrait initié avec succès');
        fetchWallet();
        fetchTransactions();
        return { success: true, transactionId: data.transaction_id };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Erreur lors du retrait');
      return { success: false, error: error.message };
    }
  };

  // Process game bet (deduct from wallet)
  const processBet = async (betAmount: number, gameId: string) => {
    if (!userId || !wallet || wallet.balance < betAmount) {
      toast.error('Solde insuffisant pour cette mise');
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
      toast.error('Erreur lors du traitement de la mise');
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

      toast.success(`Gain de ${winAmount} FCFA ajouté à votre solde !`);
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
    depositWithMyCoolPay,
    withdraw,
    processBet,
    processWin
  };
};