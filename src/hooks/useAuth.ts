import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la configuration Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Configuration Supabase manquante:', { 
        url: !!supabaseUrl, 
        key: !!supabaseKey 
      });
      toast.error('Configuration d\'authentification manquante');
      setLoading(false);
      return;
    }
    
    console.log('Configuration Supabase:', { url: supabaseUrl });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      }
      console.log('Session existante:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      console.log('Attempting email login for:', email);
      const redirectUrl = `${window.location.origin}/`;
      console.log('Redirect URL:', redirectUrl);
      
      const { error, data } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      console.log('Supabase response:', { error, data });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Lien de connexion envoyé ! Vérifiez votre email.');
      return { success: true };
    } catch (error: any) {
      console.error('Email login error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du lien');
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google login');
      const redirectUrl = `${window.location.origin}/`;
      console.log('Redirect URL:', redirectUrl);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      console.log('Google auth response:', { error, data });

      if (error) {
        console.error('Google auth error:', error);
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Erreur lors de la connexion Google');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      toast.success('Déconnexion réussiе');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Erreur lors de la déconnexion');
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut
  };
};