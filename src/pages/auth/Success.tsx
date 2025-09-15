import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Rediriger automatiquement vers la page d'accueil après 3 secondes
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl border border-border/50 p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Connexion réussie !
          </h1>
          <p className="text-muted-foreground">
            Bienvenue {user?.email ? `${user.email}` : 'sur GameWin'} !
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Compte authentifié avec succès</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Redirection automatique dans 3 secondes...
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Aller à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;