import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Gauge, Volume2, Database, TrendingUp, Target, CreditCard, Trophy, Eye } from 'lucide-react';
import { useGameEconomics } from '@/hooks/useGameEconomics';
import { useGameSettings, GameSettings } from '@/hooks/useGameSettings';
import { useCurrency } from '@/hooks/useCurrency.tsx';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BatchPreview from './BatchPreview';

interface AdminPanelProps {
  onClose: () => void;
}

interface BatchGenerationForm {
  batchName: string;
  totalGames: number;
  averageBetAmount: number;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { settings: initialSettings } = useGameSettings();
  const { formatAmount } = useCurrency();
  
  const [settings, setSettings] = useState<Partial<GameSettings>>(() => initialSettings || {});
  const [apiKeys, setApiKeys] = useState({ lygos: '', mycoolpay_private: '' });
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [batchForm, setBatchForm] = useState<BatchGenerationForm>({
    batchName: '',
    totalGames: 1000,
    averageBetAmount: 1000
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [selectedBatchForPreview, setSelectedBatchForPreview] = useState<any | null>(null);
  
  const {
    economicConfig,
    setEconomicConfig,
    activeBatch,
    jackpotPool,
    fetchEconomicConfig,
    updateEconomicConfig,
    fetchActiveBatch,
    fetchAllBatches,
    fetchJackpotPool,
    generateGameBatch,
    activateBatch
  } = useGameEconomics();

  useEffect(() => {
    const fetchApiKeys = async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['lygos_api_key', 'mycoolpay_private_key']);

      if (data) {
        const keys = data.reduce((acc, item) => {
          if (item.key === 'lygos_api_key') acc.lygos = item.value;
          if (item.key === 'mycoolpay_private_key') acc.mycoolpay_private = item.value;
          return acc;
        }, { lygos: '', mycoolpay_private: '' });
        setApiKeys(keys);
      } else if (error) {
        console.error('Error fetching API keys:', error);
      }
    };

    if (isAuthenticated) {
      fetchEconomicConfig();
      fetchActiveBatch();
      fetchJackpotPool();
      loadAllBatches();
      fetchApiKeys();
    }
  }, [isAuthenticated, fetchEconomicConfig, fetchActiveBatch, fetchJackpotPool]);

  const loadAllBatches = async () => {
    const batches = await fetchAllBatches();
    setAllBatches(batches);
  };

  const handleAuth = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    }
  };

  const handleUpdateEconomicConfig = async (field: string, value: number) => {
    if (!economicConfig) return;
    
    // Update local state immediately for responsiveness
    setEconomicConfig(prev => prev ? { ...prev, [field]: value } : null);
    
    const updatedConfig = await updateEconomicConfig({ [field]: value });
    if (updatedConfig) {
      // Sync with server response
      setEconomicConfig(updatedConfig);
      toast.success('Configuration économique mise à jour');
    } else {
      // Revert local change on error
      await fetchEconomicConfig();
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleGenerateBatch = async () => {
    if (!batchForm.batchName.trim()) {
      toast.error('Veuillez entrer un nom de lot');
      return;
    }

    setIsGenerating(true);
    try {
      const batch = await generateGameBatch(
        batchForm.batchName,
        batchForm.totalGames,
        batchForm.averageBetAmount
      );
      
      if (batch) {
        toast.success(`Lot "${batch.batch_name}" généré avec succès!`);
        setBatchForm({ batchName: '', totalGames: 1000, averageBetAmount: 1000 });
        loadAllBatches();
      } else {
        toast.error('Erreur lors de la génération du lot');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKeys = async () => {
    try {
      const upserts = [];
      if (apiKeys.lygos) {
        upserts.push({ key: 'lygos_api_key', value: apiKeys.lygos });
      }
      if (apiKeys.mycoolpay_private) {
        upserts.push({ key: 'mycoolpay_private_key', value: apiKeys.mycoolpay_private });
      }

      if (upserts.length > 0) {
        const { error } = await supabase.from('admin_settings').upsert(upserts, { onConflict: 'key' });
        if (error) throw error;
      }
      
      toast.success('Clés API sauvegardées avec succès');
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error('Erreur lors de la sauvegarde des clés API.');
    }
  };

  const handleSave = () => {
    const {
      initialSpeed,
      speedIncrease,
      fastDropMultiplier,
      softDropMultiplier,
      volumeLevel
    } = settings;

    const gameplaySettings = {
      initialSpeed,
      speedIncrease,
      fastDropMultiplier,
      softDropMultiplier,
      volumeLevel
    };

    localStorage.setItem('gameSettings', JSON.stringify(gameplaySettings));
    toast.success('Paramètres de gameplay et audio sauvegardés');
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Mot de passe admin</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAuth} className="gaming-button-primary flex-1">
                Se connecter
              </Button>
              <Button onClick={onClose} variant="outline">
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Panneau d'Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="economics" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="economics">Économie</TabsTrigger>
              <TabsTrigger value="gains">Gains</TabsTrigger>
              <TabsTrigger value="batches">Lots</TabsTrigger>
              <TabsTrigger value="jackpot">Jackpot</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>

            <TabsContent value="economics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {economicConfig ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Distribution des Gains (%)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Part joueurs: {economicConfig.player_share_percentage}%</Label>
                          <Slider
                            value={[economicConfig.player_share_percentage]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('player_share_percentage', value)}
                            max={80} min={60} step={1}
                          />
                        </div>
                        <div>
                          <Label>Part plateforme: {economicConfig.platform_share_percentage}%</Label>
                          <Slider
                            value={[economicConfig.platform_share_percentage]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('platform_share_percentage', value)}
                            max={30} min={10} step={1}
                          />
                        </div>
                        <div>
                          <Label>Part jackpot: {economicConfig.jackpot_share_percentage}%</Label>
                          <Slider
                            value={[economicConfig.jackpot_share_percentage]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('jackpot_share_percentage', value)}
                            max={20} min={5} step={1}
                          />
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            Total: {economicConfig.player_share_percentage + economicConfig.platform_share_percentage + economicConfig.jackpot_share_percentage}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Paramètres de Gains
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Taux de retour de base: {economicConfig.base_return_rate}</Label>
                          <Slider
                            value={[economicConfig.base_return_rate * 1000]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('base_return_rate', value / 1000)}
                            max={50} min={1} step={1}
                          />
                          <div className="text-xs text-muted-foreground">
                            {economicConfig.base_return_rate.toFixed(4)} EUR pour 1000 points
                          </div>
                        </div>
                        <div>
                          <Label>Multiplicateur maximum: {economicConfig.max_win_multiplier}x</Label>
                          <Slider
                            value={[economicConfig.max_win_multiplier]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('max_win_multiplier', value)}
                            max={50} min={5} step={0.5}
                          />
                        </div>
                        <div>
                          <Label>Taux de déclenchement jackpot: {(economicConfig.jackpot_trigger_rate * 100).toFixed(3)}%</Label>
                          <Slider
                            value={[economicConfig.jackpot_trigger_rate * 100000]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('jackpot_trigger_rate', value / 100000)}
                            max={500} min={10} step={1}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="col-span-2"><p>Chargement de la configuration économique...</p></div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gains" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Paramètres des Gains Estimés
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {economicConfig && (
                      <>
                        <div>
                          <Label>Score de référence: {economicConfig.reference_score || 1000}</Label>
                          <Slider
                            value={[economicConfig.reference_score || 1000]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('reference_score', value)}
                            max={5000} min={500} step={100}
                          />
                          <div className="text-xs text-muted-foreground">
                            Score utilisé pour calculer les gains estimés
                          </div>
                        </div>
                        <div>
                          <Label>Taux gains démo (%): {((economicConfig.demo_gain_rate || 0.5) * 100).toFixed(1)}%</Label>
                          <Slider
                            value={[(economicConfig.demo_gain_rate || 0.5) * 100]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('demo_gain_rate', value / 100)}
                            max={100} min={10} step={5}
                          />
                          <div className="text-xs text-muted-foreground">
                            Pourcentage de la mise retourné en mode démo
                          </div>
                        </div>
                        <div>
                          <Label>Taux gains réel (%): {((economicConfig.real_gain_rate || 0.1) * 100).toFixed(1)}%</Label>
                          <Slider
                            value={[(economicConfig.real_gain_rate || 0.1) * 100]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('real_gain_rate', value / 100)}
                            max={50} min={5} step={1}
                          />
                          <div className="text-xs text-muted-foreground">
                            Pourcentage de la mise retourné en mode réel
                          </div>
                        </div>
                        <div>
                          <Label>Multiplicateur démo: {(economicConfig.demo_multiplier || 2.5).toFixed(1)}x</Label>
                          <Slider
                            value={[(economicConfig.demo_multiplier || 2.5) * 10]}
                            onValueChange={([value]) => handleUpdateEconomicConfig('demo_multiplier', value / 10)}
                            max={50} min={10} step={1}
                          />
                          <div className="text-xs text-muted-foreground">
                            Multiplicateur de base pour le mode démo
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Aperçu des Gains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {economicConfig && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Simulation pour différentes mises:</h4>
                        {[500, 1000, 2500, 5000].map(bet => {
                          const referenceScore = economicConfig.reference_score || 1000;
                          const demoRate = economicConfig.demo_gain_rate || 0.5;
                          const realRate = economicConfig.real_gain_rate || 0.1;
                          const demoMultiplier = economicConfig.demo_multiplier || 2.5;
                          const realMultiplier = 1.0 + (bet / 10000);
                          
                          const demoGain = Math.floor(referenceScore * demoMultiplier * demoRate);
                          const realGain = Math.floor(referenceScore * realMultiplier * realRate);
                          
                          return (
                            <div key={bet} className="p-2 bg-muted rounded text-sm">
                              <div className="font-medium">{formatAmount(bet / 655.96)}</div>
                              <div className="text-xs text-muted-foreground">
                                Démo: {formatAmount(demoGain / 655.96)} | 
                                Réel: {formatAmount(realGain / 655.96)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="batches" className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Database className="w-5 h-5" />
                       Générer un Nouveau Lot
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div>
                       <Label htmlFor="batchName">Nom du lot</Label>
                       <Input
                         id="batchName"
                         value={batchForm.batchName}
                         onChange={(e) => setBatchForm({...batchForm, batchName: e.target.value})}
                         placeholder="Ex: Lot_2024_001"
                       />
                     </div>
                     <div>
                       <Label>Nombre total de parties: {batchForm.totalGames.toLocaleString()}</Label>
                       <Slider
                         value={[batchForm.totalGames]}
                         onValueChange={([value]) => setBatchForm({...batchForm, totalGames: value})}
                         max={10000} min={100} step={100}
                       />
                     </div>
                     <div>
                       <Label>Mise moyenne: {formatAmount(batchForm.averageBetAmount / 655.96)}</Label>
                       <Slider
                         value={[batchForm.averageBetAmount]}
                         onValueChange={([value]) => setBatchForm({...batchForm, averageBetAmount: value})}
                         max={10000} min={100} step={100}
                       />
                     </div>
                     <div className="p-4 bg-muted rounded-lg space-y-2">
                       <h4 className="font-medium">Prévisions du lot:</h4>
                        <p className="text-sm">Investment total: {formatAmount((batchForm.totalGames * batchForm.averageBetAmount) / 655.96)}</p>
                        {economicConfig && (
                          <>
                            <p className="text-sm text-success">
                              Gains joueurs: {formatAmount(Math.floor((batchForm.totalGames * batchForm.averageBetAmount * economicConfig.player_share_percentage / 100)) / 655.96)}
                            </p>
                            <p className="text-sm text-primary">
                              Revenus plateforme: {formatAmount(Math.floor((batchForm.totalGames * batchForm.averageBetAmount * economicConfig.platform_share_percentage / 100)) / 655.96)}
                            </p>
                            <p className="text-sm text-accent">
                              Contribution jackpot: {formatAmount(Math.floor((batchForm.totalGames * batchForm.averageBetAmount * economicConfig.jackpot_share_percentage / 100)) / 655.96)}
                            </p>
                          </>
                        )}
                     </div>
                     <Button 
                       onClick={handleGenerateBatch}
                       disabled={isGenerating}
                       className="w-full"
                     >
                       {isGenerating ? 'Génération...' : 'Générer le Lot'}
                     </Button>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Target className="w-5 h-5" />
                       Lot Actif
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {activeBatch ? (
                       <div className="space-y-3">
                         <div>
                           <h4 className="font-medium">{activeBatch.batch_name}</h4>
                           <p className="text-sm text-muted-foreground">
                             {activeBatch.games_played} / {activeBatch.total_games} parties jouées
                           </p>
                         </div>
                         <div className="space-y-1">
                           <div className="flex justify-between text-sm">
                             <span>Progression:</span>
                             <span>{Math.round((activeBatch.games_played / activeBatch.total_games) * 100)}%</span>
                           </div>
                           <div className="w-full bg-muted rounded-full h-2">
                             <div 
                               className="bg-primary rounded-full h-2 transition-all"
                               style={{ width: `${Math.round((activeBatch.games_played / activeBatch.total_games) * 100)}%` }}
                             />
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div className="p-2 bg-muted rounded">
                             <p className="font-medium">Cible gains</p>
                             <p>{activeBatch.player_payout_target.toLocaleString()}</p>
                           </div>
                           <div className="p-2 bg-muted rounded">
                             <p className="font-medium">Gains réels</p>
                             <p>{activeBatch.actual_player_payout.toLocaleString()}</p>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <p className="text-muted-foreground">Aucun lot actif</p>
                     )}
                   </CardContent>
                 </Card>
               </div>
               <Card>
                 <CardHeader>
                   <CardTitle>Tous les Lots Générés</CardTitle>
                 </CardHeader>
                 <CardContent>
                   {allBatches.length > 0 ? (
                     <div className="space-y-3">
                       {allBatches.map((batch) => (
                         <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <h4 className="font-medium">{batch.batch_name}</h4>
                               {batch.is_active && (
                                 <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                                   Actif
                                 </span>
                               )}
                             </div>
                             <p className="text-sm text-muted-foreground">
                               {batch.total_games.toLocaleString()} parties • {batch.total_investment.toLocaleString()} FCFA
                             </p>
                             <p className="text-xs text-muted-foreground">
                               Créé le {new Date(batch.created_at).toLocaleDateString('fr-FR')}
                             </p>
                           </div>
                            <div className="flex gap-2">
                              {!batch.is_active && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    activateBatch(batch.id).then(() => {
                                      toast.success('Lot activé');
                                      fetchActiveBatch();
                                      loadAllBatches();
                                    });
                                  }}
                                >
                                  Activer
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBatchForPreview(batch)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Prévisualiser
                              </Button>
                            </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-muted-foreground">Aucun lot généré</p>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>

            <TabsContent value="jackpot" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Gestion du Jackpot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jackpotPool ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
                        <h4 className="font-medium">Montant Actuel</h4>
                        <p className="text-2xl font-bold text-primary">
                          {jackpotPool.current_amount.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium">Total Contributions</h4>
                        <p className="text-xl font-semibold">
                          {jackpotPool.total_contributions.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium">Total Gains Distribués</h4>
                        <p className="text-xl font-semibold">
                          {jackpotPool.total_payouts.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p>Chargement des données du jackpot...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary" />
                    Configuration des Agrégateurs de Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="lygos-api">Clé API Lygos</Label>
                    <Input
                      id="lygos-api"
                      type="password"
                      value={apiKeys.lygos}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, lygos: e.target.value }))}
                      placeholder="Entrez votre clé API Lygos"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="mycoolpay-private-api">Clé API MyCoolPay (Privée)</Label>
                    <Input
                      id="mycoolpay-private-api"
                      type="password"
                      value={apiKeys.mycoolpay_private}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, mycoolpay_private: e.target.value }))}
                      placeholder="Entrez la clé privée MyCoolPay"
                    />
                  </div>
                  <Button onClick={handleSaveApiKeys}>Sauvegarder les Clés API</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gameplay" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Vitesse initiale (ms)</Label>
                    <Slider
                      value={[settings.initialSpeed || 0]}
                      onValueChange={([value]) => setSettings({...settings, initialSpeed: value})}
                      max={2000} min={200} step={50}
                    />
                    <div className="text-sm text-muted-foreground mt-1">{settings.initialSpeed || 0}ms</div>
                  </div>
                  <div>
                    <Label>Accélération par niveau (ms)</Label>
                    <Slider
                      value={[settings.speedIncrease || 0]}
                      onValueChange={([value]) => setSettings({...settings, speedIncrease: value})}
                      max={200} min={10} step={10}
                    />
                    <div className="text-sm text-muted-foreground mt-1">-{settings.speedIncrease || 0}ms par niveau</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Multiplicateur chute rapide</Label>
                    <Slider
                      value={[settings.fastDropMultiplier || 0]}
                      onValueChange={([value]) => setSettings({...settings, fastDropMultiplier: value})}
                      max={50} min={5} step={1}
                    />
                    <div className="text-sm text-muted-foreground mt-1">x{settings.fastDropMultiplier || 0}</div>
                  </div>
                  <div>
                    <Label>Multiplicateur descente douce</Label>
                    <Slider
                      value={[settings.softDropMultiplier || 0]}
                      onValueChange={([value]) => setSettings({...settings, softDropMultiplier: value})}
                      max={10} min={1} step={0.5}
                    />
                    <div className="text-sm text-muted-foreground mt-1">x{settings.softDropMultiplier || 0}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Volume principal</Label>
                  <Slider
                    value={[(settings.volumeLevel || 0) * 100]}
                    onValueChange={([value]) => setSettings({...settings, volumeLevel: value / 100})}
                    max={100} min={0} step={5}
                  />
                  <div className="text-sm text-muted-foreground mt-1">{Math.round((settings.volumeLevel || 0) * 100)}%</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleSave} className="gaming-button-primary">
              Sauvegarder les Paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {selectedBatchForPreview && (
        <BatchPreview
          batch={selectedBatchForPreview}
          onClose={() => setSelectedBatchForPreview(null)}
        />
      )}
    </div>
  );
}