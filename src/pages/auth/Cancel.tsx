import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw } from 'lucide-react';

const AuthCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl border border-border/50 p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Connexion annulée
          </h1>
          <p className="text-muted-foreground">
            Vous avez annulé le processus de connexion.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Aucune donnée n'a été collectée ou stockée.
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/">
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer la connexion
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthCancel;