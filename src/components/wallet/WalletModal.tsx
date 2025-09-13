import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, Minus, History, CreditCard } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import './payment-popup.css';
import type { Tables } from '@/integrations/supabase/types';

type WalletType = Tables<'wallets'>;

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentStep = 'form' | 'ussd_display' | 'otp_verification' | 'card_iframe' | 'status_polling' | 'completed' | 'failed';

const WithdrawalContent = ({
  wallet,
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
}: ReturnType<typeof useWithdrawal> & { wallet: WalletType | null }) => {

  if (status === 'polling' || status === 'processing') {
    return (
      <div className="status-section text-center">
        <div className="status-icon">
          <div className="loading-spinner"></div>
        </div>
        <h4>Retrait en cours de traitement...</h4>
        <p>Veuillez patienter quelques instants.</p>
        {transactionRef && (
          <div className="transaction-ref">
            <small>Référence: {transactionRef}</small>
          </div>
        )}
      </div>
    );
  }
  
  if (status === 'success') {
      return (
          <div className="final-status text-center">
              <h4>Retrait Réussi!</h4>
              <p>Votre solde sera mis à jour dans quelques instants.</p>
              <Button onClick={resetForm}>Effectuer un autre retrait</Button>
          </div>
      )
  }

  if (status === 'failed') {
      return (
          <div className="final-status text-center">
              <h4>Échec du Retrait</h4>
              <p>Le retrait n'a pas pu être complété.</p>
              <Button onClick={resetForm}>Réessayer</Button>
          </div>
      )
  }

  return (
    <div className="popup-content">
      <div className="user-balance">
        <div className="balance-card">
          <span className="balance-label">Solde disponible</span>
          <span className="balance-amount">{wallet?.balance?.toLocaleString() || 0} FCFA</span>
        </div>
      </div>

      <div className="withdrawal-operators">
        <h4>Choisir le moyen de retrait</h4>
        <div className="operator-grid">
          <button className={`operator-method ${selectedOperator === 'CM_MOMO' ? 'selected' : ''}`} onClick={() => setSelectedOperator('CM_MOMO')}>
            <span>MTN Mobile Money</span>
          </button>
          <button className={`operator-method ${selectedOperator === 'CM_OM' ? 'selected' : ''}`} onClick={() => setSelectedOperator('CM_OM')}>
            <span>Orange Money</span>
          </button>
          <button className={`operator-method ${selectedOperator === 'MCP' ? 'selected' : ''}`} onClick={() => setSelectedOperator('MCP')}>
            <span>My-CoolPay Wallet</span>
          </button>
        </div>
      </div>

      {selectedOperator && (
        <div className="withdrawal-form">
          <div className="form-group">
            <label htmlFor="withdrawal-amount">Montant à retirer (XAF)</label>
            <Input type="number" id="withdrawal-amount" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')} min="1000" step="500" placeholder="Minimum 1000 XAF" />
            <small className="form-hint">Montant minimum : 1000 XAF</small>
          </div>

          <div className={`form-group ${selectedOperator === 'MCP' ? 'hidden' : ''}`}>
            <label htmlFor="withdrawal-phone">Numéro de téléphone</label>
            <Input type="tel" id="withdrawal-phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="237xxxxxxxxx" />
          </div>

          <div className={`form-group ${selectedOperator !== 'MCP' ? 'hidden' : ''}`}>
            <label htmlFor="mycoolpay-identifier">Identifiant My-CoolPay</label>
            <Input type="text" id="mycoolpay-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Nom d'utilisateur ou email" />
            <small className="form-hint">Nom d'utilisateur, email ou numéro</small>
          </div>

          <div className="form-group">
            <label htmlFor="withdrawal-reason">Motif du retrait (optionnel)</label>
            <Input type="text" id="withdrawal-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Retrait personnel" />
          </div>

          <div className="withdrawal-fees">
            <div className="fee-breakdown">
              <span>Montant demandé: <strong>{typeof amount === 'number' ? amount.toLocaleString() : 0} FCFA</strong></span>
              <span>Frais estimés: <strong>{fees.toLocaleString()} FCFA</strong></span>
              <span className="total">Total à débiter: <strong>{totalDebit.toLocaleString()} FCFA</strong></span>
            </div>
          </div>

          <Button onClick={processWithdrawal} className="w-full h-12 gaming-button-primary" disabled={!canWithdraw || processing}>
            {processing ? 'Traitement...' : 'Confirmer le retrait'}
          </Button>
        </div>
      )}
    </div>
  );
};


export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { user } = useAuth();
  const { wallet, transactions, loading, initiateMyCoolPayPayment, verifyMyCoolPayOtp, checkMyCoolPayStatus, fetchWallet, fetchTransactions } = useWallet(user?.id);
  
  const withdrawal = useWithdrawal(user?.id, wallet, () => {
    fetchWallet();
    fetchTransactions();
  });

  const [activeTab, setActiveTab] = useState('overview');
  
  // Payment State
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('form');
  const [depositAmount, setDepositAmount] = useState(5000);
  const [selectedMethod, setSelectedMethod] = useState<'orange' | 'mtn' | 'card'>('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [processing, setProcessing] = useState(false);

  const DEPOSIT_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];
  const PAYMENT_METHODS = [
    { id: 'orange', name: 'Orange Money', icon: '🟠' },
    { id: 'mtn', name: 'MTN MoMo', icon: '🟡' },
    { id: 'card', name: 'Carte (Visa/Mastercard)', icon: <CreditCard/> },
  ];

  const resetPaymentState = () => {
    setPaymentStep('form');
    setPhoneNumber('');
    setOtpCode('');
    setCurrentTransaction(null);
    if (pollInterval) clearInterval(pollInterval);
    setPollInterval(null);
    setProcessing(false);
  };

  const handleModalClose = () => {
    resetPaymentState();
    withdrawal.resetForm();
    onClose();
  };

  const initiatePayment = async () => {
    if (!user || (selectedMethod !== 'card' && !phoneNumber)) {
        alert("Veuillez saisir un numéro de téléphone pour ce mode de paiement.");
        return;
    }
    setProcessing(true);

    const paymentData = {
      amount: depositAmount,
      reason: `Deposit for ${user.email}`,
      reference: `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      customerName: user.email,
      customerEmail: user.email,
    };

    const result = await initiateMyCoolPayPayment(paymentData, selectedMethod, phoneNumber);
    
    if (result.success) {
      setCurrentTransaction(result);
      if (selectedMethod === 'card') {
        setPaymentStep('card_iframe');
      } else if (result.action === 'REQUIRE_OTP') {
        setPaymentStep('otp_verification');
      } else if (result.action === 'PENDING' && result.ussd) {
        setPaymentStep('ussd_display');
        startPolling(result.transaction_ref);
      }
    } else {
      setPaymentStep('failed');
    }
    setProcessing(false);
  };

  const handleVerifyOtp = async () => {
    if (!currentTransaction?.transaction_ref || !otpCode) return;
    setProcessing(true);
    const result = await verifyMyCoolPayOtp(currentTransaction.transaction_ref, otpCode);
    if (result.success && result.action === 'PENDING') {
      setCurrentTransaction(prev => ({ ...prev, ussd: result.ussd }));
      setPaymentStep('ussd_display');
      startPolling(result.transaction_ref);
    } else {
      alert('Code OTP invalide ou expiré.');
    }
    setProcessing(false);
  };

  const startPolling = (transactionRef: string) => {
    const interval = setInterval(async () => {
      const statusResult = await checkMyCoolPayStatus(transactionRef);
      if (statusResult.success) {
        if (statusResult.transaction_status === 'SUCCESS') {
          setPaymentStep('completed');
          fetchWallet();
          fetchTransactions();
          clearInterval(interval);
        } else if (['FAILED', 'CANCELED'].includes(statusResult.transaction_status)) {
          setPaymentStep('failed');
          clearInterval(interval);
        }
      }
    }, 5000);
    setPollInterval(interval);
  };
  
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const renderDepositContent = () => {
    switch (paymentStep) {
      case 'form':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Montant à recharger</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {DEPOSIT_AMOUNTS.map((amount) => (
                  <Button key={amount} variant={depositAmount === amount ? "default" : "outline"} onClick={() => setDepositAmount(amount)}>
                    {amount.toLocaleString()} FCFA
                  </Button>
                ))}
              </div>
              <Input type="number" placeholder="Montant personnalisé" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} min={500} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Méthode de paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <Button key={method.id} variant={selectedMethod === method.id ? "default" : "outline"} onClick={() => setSelectedMethod(method.id as any)}>
                    {method.icon} {method.name}
                  </Button>
                ))}
              </div>
            </div>
            {selectedMethod !== 'card' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Numéro de téléphone</label>
                <Input type="tel" placeholder="Ex: 237xxxxxxxxx" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
              </div>
            )}
            <Button onClick={initiatePayment} disabled={processing} className="w-full h-12 gaming-button-primary">
              {processing ? 'Traitement...' : `Recharger ${depositAmount.toLocaleString()} FCFA`}
            </Button>
          </div>
        );
      case 'otp_verification':
        return (
          <div className="payment-form text-center">
            <p>Un code de vérification a été envoyé à votre téléphone.</p>
            <Input type="text" placeholder="Code de vérification" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
            <Button onClick={handleVerifyOtp} disabled={processing}>{processing ? 'Vérification...' : 'Vérifier'}</Button>
            <Button variant="link" onClick={resetPaymentState}>Annuler</Button>
          </div>
        );
      case 'ussd_display':
        return (
          <div className="ussd-section text-center">
            <h4>Composez ce code sur votre téléphone :</h4>
            <div className="ussd-code">{currentTransaction?.ussd}</div>
            <div className="payment-status"><div className="loading-spinner"></div><span>Vérification du paiement...</span></div>
            <Button variant="link" onClick={resetPaymentState}>Annuler</Button>
          </div>
        );
      case 'card_iframe':
        return (
          <div className="card-frame">
            <iframe src={currentTransaction?.payment_url} frameBorder="0" title="payment"></iframe>
            <Button variant="link" onClick={resetPaymentState} className="mt-2">Annuler</Button>
          </div>
        );
      case 'completed':
        return (
          <div className="final-status text-center">
            <h4>Paiement Réussi!</h4>
            <p>Votre solde a été mis à jour.</p>
            <Button onClick={resetPaymentState}>Effectuer un autre dépôt</Button>
          </div>
        );
      case 'failed':
        return (
          <div className="final-status text-center">
            <h4>Échec du Paiement</h4>
            <p>Le paiement n'a pas pu être complété.</p>
            <Button onClick={resetPaymentState}>Réessayer</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="gaming-card max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gaming-text-gradient text-xl font-bold">
            <Wallet className="w-6 h-6" /> Mon Portefeuille
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="deposit">Recharger</TabsTrigger>
            <TabsTrigger value="withdraw">Retrait</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="gaming-card p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Solde disponible</div>
              <div className="text-4xl font-bold gaming-text-gradient">
                {loading ? '...' : `${wallet?.balance?.toLocaleString() || 0} FCFA`}
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <Button onClick={() => setActiveTab('deposit')} className="gaming-button-primary">
                 <Plus className="w-4 h-4 mr-2" /> Recharger
               </Button>
               <Button onClick={() => setActiveTab('withdraw')} className="gaming-button-secondary">
                 <Minus className="w-4 h-4 mr-2" /> Retrait
               </Button>
             </div>
           </Card>
         </TabsContent>

          <TabsContent value="deposit" className="space-y-6 mt-6">
            <Card className="gaming-card p-6">
              {renderDepositContent()}
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-6">
            {/* History content will be added here */}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6 mt-6">
            <Card className="gaming-card p-6">
              <WithdrawalContent {...withdrawal} wallet={wallet} />
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}