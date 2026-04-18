import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface ChildProfile {
  name: string;
  age: string;
}

interface AppContextData {
  score: number;
  incrementScore: () => void;
  resetScore: () => void;
  
  isAuthenticated: boolean;
  login: (profile?: ChildProfile) => void;
  logout: () => void;
  childProfile: ChildProfile | null;
}

export const AppContext = createContext<AppContextData>({
  score: 0,
  incrementScore: () => {},
  resetScore: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  childProfile: null,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [score, setScore] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);

  useEffect(() => {
    loadData();

    // Listen for auth changes to keep context in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setChildProfile(null);
      } else if (session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      // Check actual Supabase session first
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // If the token is invalid or expired, clear everything locally
        console.warn('Session restoration failed:', error.message);
        await logout();
        return;
      }

      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      const storedScore = await AsyncStorage.getItem('@score');
      if (storedScore !== null) {
        setScore(parseInt(storedScore, 10));
      }
      
      const authStatus = await AsyncStorage.getItem('@isAuthenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
      
      const storedProfile = await AsyncStorage.getItem('@childProfile');
      if (storedProfile !== null) {
        setChildProfile(JSON.parse(storedProfile));
      }
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  const login = async (profile?: ChildProfile) => {
    try {
      setIsAuthenticated(true);
      await AsyncStorage.setItem('@isAuthenticated', 'true');
      if (profile) {
        setChildProfile(profile);
        await AsyncStorage.setItem('@childProfile', JSON.stringify(profile));
      }
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setChildProfile(null);
      await AsyncStorage.setItem('@isAuthenticated', 'false');
      await AsyncStorage.removeItem('@childProfile');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const incrementScore = async () => {
    try {
      const newScore = score + 1;
      setScore(newScore);
      await AsyncStorage.setItem('@score', newScore.toString());
    } catch (e) {
      console.error('Failed to save score', e);
    }
  };

  const resetScore = async () => {
    try {
      setScore(0);
      await AsyncStorage.setItem('@score', '0');
    } catch (e) {
      console.error('Failed to reset score', e);
    }
  };

  return (
    <AppContext.Provider value={{ score, incrementScore, resetScore, isAuthenticated, login, logout, childProfile }}>
      {children}
    </AppContext.Provider>
  );
};
