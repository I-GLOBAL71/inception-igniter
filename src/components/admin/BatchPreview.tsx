import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Search, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  GamepadIcon,
  Filter,
  Eye,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency.tsx';
import { toast } from 'sonner';

interface BatchPreviewProps {
  batch: any;
  onClose: () => void;
}

interface GameData {
  id: string;
  batch_id: string;
  game_index: number;
  bet_amount: number;
  max_achievable_score: number;
  result_type: 'win' | 'loss' | 'jackpot';
  win_multiplier?: number;
  expected_payout: number;
  skill_requirement: number;
  is_played: boolean;
  played_at?: string;
  actual_score?: number;
  actual_payout?: number;
}

export default function BatchPreview({ batch, onClose }: BatchPreviewProps) {
  const { formatAmount } = useCurrency();
  const [games, setGames] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'played' | 'unplayed'>('all');
  const [sortBy, setSortBy] = useState<'target_score' | 'max_payout' | 'played_at'>('target_score');

  useEffect(() => {
    fetchBatchGames();
  }, [batch.id]);

  useEffect(() => {
    filterAndSortGames();
  }, [games, searchTerm, filterStatus, sortBy]);

  const fetchBatchGames = async () => {
  const fetchBatchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pre_generated_games')
        .select('*')
        .eq('batch_id', batch.id)
        .order('expected_payout', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching batch games:', error);
      toast.error('Erreur lors du chargement des parties');
    } finally {
      setLoading(false);
    }
  };
  };

  const filterAndSortGames = () => {
    let filtered = [...games];

  const filterAndSortGames = () => {
    let filtered = [...games];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.max_achievable_score.toString().includes(searchTerm) ||
        game.bet_amount.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus === 'played') {
      filtered = filtered.filter(game => game.is_played);
    } else if (filterStatus === 'unplayed') {
      filtered = filtered.filter(game => !game.is_played);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'target_score':
          return b.max_achievable_score - a.max_achievable_score;
        case 'max_payout':
          return b.expected_payout - a.expected_payout;
        case 'played_at':
          if (!a.played_at) return 1;
          if (!b.played_at) return -1;
          return new Date(b.played_at).getTime() - new Date(a.played_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredGames(filtered);
  };
  };

  const getStatusBadge = (game: GameData) => {
    if (game.is_played) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Jouée</Badge>;
    }
    return <Badge variant="secondary">Non jouée</Badge>;
  };

  const playedGames = games.filter(g => g.is_played);
  const unplayedGames = games.filter(g => !g.is_played);
  const totalPayout = playedGames.reduce((sum, g) => sum + (g.actual_payout || 0), 0);
  const averageScore = playedGames.length > 0 ? 
    playedGames.reduce((sum, g) => sum + (g.actual_score || 0), 0) / playedGames.length : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Chargement des parties...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Prévisualisation du lot: {batch.batch_name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="games">Parties ({games.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analyses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <GamepadIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Total parties</span>
                    </div>
                    <p className="text-2xl font-bold">{games.length.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Parties jouées</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{playedGames.length.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">En attente</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{unplayedGames.length.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">Progression</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">
                      {Math.round((playedGames.length / games.length) * 100)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Statistiques financières</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total gains distribués:</span>
                      <span className="font-bold">{formatAmount(totalPayout / 655.96)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gain maximal possible:</span>
                      <span className="font-bold">
                        {formatAmount(games.reduce((sum, g) => sum + g.expected_payout, 0) / 655.96)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de redistribution:</span>
                      <span className="font-bold">
                        {games.length > 0 ? 
                          ((totalPayout / games.reduce((sum, g) => sum + g.expected_payout, 0)) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Statistiques de jeu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Score moyen obtenu:</span>
                      <span className="font-bold">{Math.round(averageScore).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Score maximal atteint:</span>
                      <span className="font-bold">
                        {Math.max(...playedGames.map(g => g.actual_score || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Score cible moyen:</span>
                      <span className="font-bold">
                        {Math.round(games.reduce((sum, g) => sum + g.max_achievable_score, 0) / games.length).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="games" className="flex-1 flex flex-col space-y-4">
              <div className="flex-shrink-0 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Rechercher par ID, score ou joueur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">Toutes</option>
                    <option value="played">Jouées</option>
                    <option value="unplayed">Non jouées</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="target_score">Score cible</option>
                    <option value="max_payout">Gain maximal</option>
                    <option value="played_at">Date de jeu</option>
                  </select>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {filteredGames.map((game) => (
                    <Card key={game.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">ID Partie</p>
                            <p className="font-mono text-sm">{game.id.slice(0, 8)}...</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Score Cible</p>
                            <p className="font-bold">{game.max_achievable_score.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gain Maximal</p>
                            <p className="font-bold text-green-600">
                              {formatAmount(game.expected_payout / 655.96)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Score Réel</p>
                            <p className="font-bold">
                              {game.actual_score ? game.actual_score.toLocaleString() : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gain Réel</p>
                            <p className="font-bold text-primary">
                              {game.actual_payout ? 
                                formatAmount(game.actual_payout / 655.96) : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(game)}
                          {game.played_at && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(game.played_at).toLocaleDateString('fr-FR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribution des scores cibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { range: '0-10K', count: games.filter(g => g.max_achievable_score < 10000).length },
                        { range: '10K-50K', count: games.filter(g => g.max_achievable_score >= 10000 && g.max_achievable_score < 50000).length },
                        { range: '50K-100K', count: games.filter(g => g.max_achievable_score >= 50000 && g.max_achievable_score < 100000).length },
                        { range: '100K+', count: games.filter(g => g.max_achievable_score >= 100000).length }
                      ].map(item => (
                        <div key={item.range} className="flex justify-between items-center">
                          <span className="text-sm">{item.range}:</span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-primary rounded"
                              style={{ width: `${(item.count / games.length) * 100}px` }}
                            />
                            <span className="text-sm font-bold">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance du lot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Taux de complétion</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(playedGames.length / games.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {playedGames.length} / {games.length} parties
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Efficacité des gains</p>
                      <p className="text-lg font-bold text-green-600">
                        {playedGames.length > 0 ? 
                          (playedGames.filter(g => (g.actual_score || 0) >= g.max_achievable_score).length / playedGames.length * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parties ayant atteint le score cible
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}