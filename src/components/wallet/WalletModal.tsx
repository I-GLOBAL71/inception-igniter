import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Minus, History, CreditCard, Smartphone, ArrowUpDown } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const DEPOSIT_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];
const PAYMENT_METHODS = [
  { id: 'orange_money', name: 'Orange Money', icon: '🟠' },
  { id: 'mtn_momo', name: 'MTN MoMo', icon: '🟡' },
  { id: 'moov_money', name: 'Moov Money', icon: '🔵' },
  { id: 'wave', name: 'Wave', icon: '🌊' }
];

export default function WalletModal({ isOpen, onClose, userId }: WalletModalProps) {
  const { wallet, transactions, loading, depositWithMyCoolPay, withdraw } = useWallet(userId);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState(5000);
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('orange_money');
  const [processing, setProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!phoneNumber || depositAmount < 500) return;

    setProcessing(true);
    const result = await depositWithMyCoolPay(depositAmount, phoneNumber);
    
    if (result.success) {
      setActiveTab('overview');
      setPhoneNumber('');
    }
    setProcessing(false);
  };

  const handleWithdraw = async () => {
    if (!phoneNumber || withdrawAmount < 500) return;

    setProcessing(true);
    const result = await withdraw(withdrawAmount, selectedPaymentMethod, 'mycoolpay', { phone_number: phoneNumber });
    
    if (result.success) {
      setActiveTab('overview');
      setPhoneNumber('');
    }
    setProcessing(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Plus className="w-4 h-4 text-success" />;
      case 'withdrawal': return <Minus className="w-4 h-4 text-destructive" />;
      case 'game_bet': return <ArrowUpDown className="w-4 h-4 text-warning" />;
      case 'game_win': return <Plus className="w-4 h-4 text-success" />;
      default: return <ArrowUpDown className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Dépôt';
      case 'withdrawal': return 'Retrait';
      case 'game_bet': return 'Mise de jeu';
      case 'game_win': return 'Gain de jeu';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline'
    } as const;

    const labels = {
      completed: 'Terminé',
      pending: 'En cours',
      failed: 'Échoué',
      cancelled: 'Annulé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gaming-card max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gaming-text-gradient text-xl font-bold">
            <Wallet className="w-6 h-6" />
            Mon Portefeuille
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="deposit">Recharger</TabsTrigger>
            <TabsTrigger value="withdraw">Retirer</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="gaming-card p-6 text-center">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Solde disponible</div>
                <div className="text-4xl font-bold gaming-text-gradient">
                  {loading ? '...' : `${wallet?.balance?.toLocaleString() || 0} FCFA`}
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => setActiveTab('deposit')}
                  className="gaming-button-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Recharger
                </Button>
                <Button 
                  onClick={() => setActiveTab('withdraw')}
                  variant="outline"
                  disabled={!wallet || wallet.balance < 500}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Retirer
                </Button>
              </div>
            </Card>

            {/* Recent transactions */}
            <div>
              <h3 className="font-semibold mb-3">Transactions récentes</h3>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <Card key={transaction.id} className="gaming-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-sm">
                            {getTransactionLabel(transaction.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </Card>
                ))}
                {transactions.length === 0 && (
                  <Card className="gaming-card p-6 text-center text-muted-foreground">
                    Aucune transaction pour le moment
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deposit" className="space-y-6 mt-6">
            <Card className="gaming-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recharger votre compte
              </h3>
              
              {/* Amount Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Montant à recharger</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {DEPOSIT_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={depositAmount === amount ? "default" : "outline"}
                        className="h-12"
                        onClick={() => setDepositAmount(amount)}
                      >
                        {amount.toLocaleString()} FCFA
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Montant personnalisé"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    min={500}
                    max={100000}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Méthode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method.id}
                        variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                        className="h-12 justify-start"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <span className="mr-2">{method.icon}</span>
                        {method.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Numéro de téléphone
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ex: +225 07 XX XX XX XX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={processing || !phoneNumber || depositAmount < 500}
                  className="w-full h-12 gaming-button-primary"
                >
                  {processing ? 'Traitement...' : `Recharger ${depositAmount.toLocaleString()} FCFA`}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6 mt-6">
            <Card className="gaming-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Minus className="w-5 h-5" />
                Retirer vos gains
              </h3>
              
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Solde disponible</div>
                  <div className="text-xl font-bold text-success">
                    {wallet?.balance?.toLocaleString() || 0} FCFA
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Montant à retirer</label>
                  <Input
                    type="number"
                    placeholder="Montant minimum: 500 FCFA"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    min={500}
                    max={wallet?.balance || 0}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Méthode de retrait</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method.id}
                        variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                        className="h-12 justify-start"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <span className="mr-2">{method.icon}</span>
                        {method.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Numéro de téléphone
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ex: +225 07 XX XX XX XX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={processing || !phoneNumber || withdrawAmount < 500 || (wallet && withdrawAmount > wallet.balance)}
                  className="w-full h-12 gaming-button-secondary"
                >
                  {processing ? 'Traitement...' : `Retirer ${withdrawAmount.toLocaleString()} FCFA`}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5" />
              <h3 className="font-semibold">Historique des transactions</h3>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="gaming-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium">
                          {getTransactionLabel(transaction.type)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {transaction.payment_method && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.payment_method}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </Card>
              ))}
              {transactions.length === 0 && (
                <Card className="gaming-card p-6 text-center text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Aucune transaction trouvée
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}