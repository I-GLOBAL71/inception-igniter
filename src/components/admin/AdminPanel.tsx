import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Gauge, Volume2 } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

interface GameSettings {
  initialSpeed: number;
  speedIncrease: number;
  fastDropMultiplier: number;
  softDropMultiplier: number;
  baseEarningsRate: number; // EUR per 1000 points
  volumeLevel: number;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [settings, setSettings] = useState<GameSettings>({
    initialSpeed: 1000,
    speedIncrease: 100,
    fastDropMultiplier: 20,
    softDropMultiplier: 3,
    baseEarningsRate: 0.01,
    volumeLevel: 0.5
  });

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = () => {
    if (password === 'admin123') { // In a real app, this would be properly secured
      setIsAuthenticated(true);
    }
  };

  const handleSave = () => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    // In a real app, this would save to a backend
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Panneau d'Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gameplay" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
              <TabsTrigger value="economics">Économie</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>

            <TabsContent value="gameplay" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4" />
                      Vitesse initiale (ms)
                    </Label>
                    <Slider
                      value={[settings.initialSpeed]}
                      onValueChange={([value]) => setSettings({...settings, initialSpeed: value})}
                      max={2000}
                      min={200}
                      step={50}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {settings.initialSpeed}ms
                    </div>
                  </div>

                  <div>
                    <Label>Accélération par niveau (ms)</Label>
                    <Slider
                      value={[settings.speedIncrease]}
                      onValueChange={([value]) => setSettings({...settings, speedIncrease: value})}
                      max={200}
                      min={10}
                      step={10}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      -{settings.speedIncrease}ms par niveau
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Multiplicateur chute rapide</Label>
                    <Slider
                      value={[settings.fastDropMultiplier]}
                      onValueChange={([value]) => setSettings({...settings, fastDropMultiplier: value})}
                      max={50}
                      min={5}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      x{settings.fastDropMultiplier}
                    </div>
                  </div>

                  <div>
                    <Label>Multiplicateur descente douce</Label>
                    <Slider
                      value={[settings.softDropMultiplier]}
                      onValueChange={([value]) => setSettings({...settings, softDropMultiplier: value})}
                      max={10}
                      min={1}
                      step={0.5}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      x{settings.softDropMultiplier}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="economics" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Taux de gain de base (EUR pour 1000 points)
                  </Label>
                  <Slider
                    value={[settings.baseEarningsRate * 1000]}
                    onValueChange={([value]) => setSettings({...settings, baseEarningsRate: value / 1000})}
                    max={100}
                    min={1}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {settings.baseEarningsRate.toFixed(3)} EUR pour 1000 points
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Exemple de calcul:</h4>
                  <p className="text-sm">
                    Score: 10 000 points = {(10 * settings.baseEarningsRate).toFixed(2)} EUR de base
                  </p>
                  <p className="text-sm">
                    Avec multiplicateur x2.5 = {(10 * settings.baseEarningsRate * 2.5).toFixed(2)} EUR
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4" />
                    Volume principal
                  </Label>
                  <Slider
                    value={[settings.volumeLevel * 100]}
                    onValueChange={([value]) => setSettings({...settings, volumeLevel: value / 100})}
                    max={100}
                    min={0}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {Math.round(settings.volumeLevel * 100)}%
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleSave} className="gaming-button-primary">
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}