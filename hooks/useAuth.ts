
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseConfig';

export const useAuth = (isDemo: boolean, setIsDemo: (v: boolean) => void) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setUser({ id: 'demo-user', email: 'demo@investor.pro' });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  return { user, loading, login, logout };
};
