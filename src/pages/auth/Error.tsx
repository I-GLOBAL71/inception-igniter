import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw, MessageCircle } from 'lucide-react';

const AuthError = () => {
  const [searchParams] = useSearchParams();
  const errorDescription = searchParams.get('error_description') || 'Une erreur inconnue s\'est produite';
  const errorCode = searchParams.get('error') || 'unknown_error';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl border border-border/50 p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Erreur de connexion
          </h1>
          <p className="text-muted-foreground">
            Un problème est survenu lors de l'authentification.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-left">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
              Détails de l'erreur :
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">
              {errorCode}: {errorDescription}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Si le problème persiste, veuillez contacter le support technique.
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
          <Button asChild variant="ghost" className="w-full">
            <Link to="mailto:support@gamewin.com">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contacter le support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthError;