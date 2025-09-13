import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Wallet = Tables<'wallets'>;

export const useWithdrawal = (userId?: string, wallet?: Wallet | null, onWithdrawalSuccess?: () => void) => {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | string>('');
  const [identifier, setIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'polling' | 'success' | 'failed'>('idle');
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const feeRates: { [key: string]: number } = {
    'CM_MOMO': 0.02, // 2%
    'CM_OM': 0.025,  // 2.5%
    'MCP': 0.01      // 1%
  };

  const fees = (typeof amount === 'number' && selectedOperator) ? amount * feeRates[selectedOperator] : 0;
  const totalDebit = (typeof amount === 'number') ? amount + fees : 0;
  const isFormComplete = selectedOperator && amount && (selectedOperator === 'MCP' ? identifier : identifier.length > 8);
  const canWithdraw = isFormComplete && wallet && wallet.balance >= totalDebit && typeof amount === 'number' && amount >= 1000;

  const resetForm = () => {
    setSelectedOperator(null);
    setAmount('');
    setIdentifier('');
    setReason('');
    setProcessing(false);
    setStatus('idle');
    setTransactionRef(null);
    if (pollInterval) clearInterval(pollInterval);
  };

  const processWithdrawal = async () => {
    if (!canWithdraw || !userId || !selectedOperator || typeof amount !== 'number') return;

    setProcessing(true);
    setStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-withdrawal', {
        body: {
          action: 'process_withdrawal',
          userId,
          operator: selectedOperator,
          amount,
          reason: reason || 'Retrait de gains',
          customerIdentifier: identifier,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast.success('Retrait initié. En attente de confirmation.');
      setTransactionRef(data.transactionRef);
      setStatus('polling');
      
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      toast.error(err.message || 'Une erreur est survenue lors du retrait.');
      setStatus('failed');
      setProcessing(false);
    }
  };

  const checkStatus = useCallback(async (ref: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mycoolpay-withdrawal', {
        body: {
          action: 'check_status',
          transactionRef: ref,
        },
      });

      if (error) throw error;

      if (data.transaction_status === 'SUCCESS') {
        toast.success('Retrait effectué avec succès!');
        setStatus('success');
        onWithdrawalSuccess?.();
        resetForm();
      } else if (['FAILED', 'CANCELED'].includes(data.transaction_status)) {
        toast.error(`Le retrait a échoué: ${data.message || 'Raison inconnue'}`);
        setStatus('failed');
        onWithdrawalSuccess?.(); // To refetch wallet and see if balance was refunded
        resetForm();
      }
    } catch (err) {
      console.error('Status check error:', err);
      // Don't toast here, it's a background poll
    }
  }, [onWithdrawalSuccess]);

  useEffect(() => {
    if (status === 'polling' && transactionRef) {
      const interval = setInterval(() => checkStatus(transactionRef), 5000);
      setPollInterval(interval);

      // Stop polling after 2 minutes
      const timeout = setTimeout(() => {
        if (status === 'polling') {
            toast.warning("Le statut du retrait est inconnu. Veuillez vérifier votre historique.");
            resetForm();
        }
      }, 120000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [status, transactionRef, checkStatus]);

  return {
    selectedOperator,
    setSelectedOperator,
    amount,
    setAmount,
    identifier,
    setIdentifier,
    reason,
    setReason,
    processing,
    status,
    fees,
    totalDebit,
    canWithdraw,
    processWithdrawal,
    resetForm,
    transactionRef,
  };
};