import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Traitement de votre connexion...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Vérifier s'il y a des paramètres d'erreur dans l'URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Auth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Erreur lors de l\'authentification');
          setTimeout(() => {
            navigate('/auth/error?' + searchParams.toString());
          }, 2000);
          return;
        }

        // Récupérer la session depuis l'URL
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Impossible de récupérer la session');
          setTimeout(() => {
            navigate('/auth/error');
          }, 2000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Connexion réussie ! Redirection...');
          setTimeout(() => {
            navigate('/auth/success');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Aucune session trouvée');
          setTimeout(() => {
            navigate('/auth/error');
          }, 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('Une erreur inattendue s\'est produite');
        setTimeout(() => {
          navigate('/auth/error');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-primary/20';
      case 'success':
        return 'bg-green-500/20';
      case 'error':
        return 'bg-red-500/20';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl border border-border/50 p-8 text-center">
        <div className="mb-6">
          <div className={`w-20 h-20 mx-auto mb-4 ${getBackgroundColor()} rounded-full flex items-center justify-center`}>
            {getIcon()}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {status === 'loading' && 'Authentification en cours...'}
            {status === 'success' && 'Authentification réussie !'}
            {status === 'error' && 'Erreur d\'authentification'}
          </h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        {status === 'loading' && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Veuillez patienter quelques instants...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;