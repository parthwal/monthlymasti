// Supabase Auth Integration using supabase-js v2 for Next.js with OAuth

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Email/password signup
  const signUp = async (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  // Email/password sign in
  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  // OAuth sign in (e.g., Google, GitHub)
  const signInWithProvider = async (provider) => {
    return supabase.auth.signInWithOAuth({ provider });
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signInWithProvider, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
