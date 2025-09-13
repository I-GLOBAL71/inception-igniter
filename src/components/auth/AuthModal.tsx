import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Chrome, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await signInWithEmail(email);
    
    if (result.success) {
      setEmailSent(true);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    
    if (result.success) {
      onClose();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setEmailSent(false);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="gaming-card max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center gaming-text-gradient text-xl font-bold">
            {emailSent ? '📧 Email envoyé !' : '🔐 Connexion sécurisée'}
         </DialogTitle>
         <DialogDescription className="text-center text-muted-foreground text-sm mt-2">
           {emailSent
             ? `Vérifiez votre boîte email pour le lien de connexion.`
             : 'Connectez-vous ou créez un compte pour jouer.'
           }
         </DialogDescription>
       </DialogHeader>

        <div className="space-y-6 p-4">
          {emailSent ? (
            <Card className="gaming-card p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-success mb-2">Lien magique envoyé !</h3>
                <p className="text-sm text-muted-foreground">
                  Vérifiez votre boîte email <strong>{email}</strong> et cliquez sur le lien pour vous connecter.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="w-full"
              >
                Essayer avec un autre email
              </Button>
            </Card>
          ) : (
            <>
              {/* Google Login */}
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 gaming-button-primary"
              >
                <Chrome className="w-5 h-5 mr-2" />
                Continuer avec Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              {/* Email Magic Link */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 gaming-button-secondary"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  {loading ? 'Envoi...' : 'Recevoir un lien magique'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <Card className="gaming-card p-4 border-success/20">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-success mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-success mb-1">100% Sécurisé</p>
                    <p>
                      Aucun mot de passe requis. Connexion instantanée par email ou Google.
                      Vos données sont protégées et cryptées.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}