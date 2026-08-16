import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44, isMockMode } from '@/api/base44Client';

const AuthContext = createContext();

function mapLoadingDone(setters) {
  setters.setIsLoadingAuth(false);
  setters.setAuthChecked(true);
  setters.setIsLoadingPublicSettings(false);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setIsAuthenticated(!!nextUser);
    setAuthError(null);
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      applyUser(currentUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      applyUser(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      if (error.status === 401 || error.status === 403) {
        // Public app: unauthenticated is normal, not a blocking error
        setAuthError(null);
      }
    }
  }, [applyUser]);

  const checkAppState = useCallback(async () => {
    setAuthError(null);
    setAppPublicSettings({
      id: isMockMode ? 'mock' : 'supabase',
      public_settings: {},
    });
    setIsLoadingPublicSettings(false);

    if (isMockMode) {
      if (base44.auth.isAuthenticated?.()) {
        await checkUserAuth();
      } else {
        applyUser(null);
        mapLoadingDone({ setIsLoadingAuth, setAuthChecked, setIsLoadingPublicSettings });
      }
      return;
    }

    // Supabase: session + listener
    try {
      const session = await base44.auth.getSession?.();
      if (session?.user) {
        await checkUserAuth();
      } else {
        applyUser(null);
        mapLoadingDone({ setIsLoadingAuth, setAuthChecked, setIsLoadingPublicSettings });
      }
    } catch (error) {
      console.error('App state check failed:', error);
      applyUser(null);
      mapLoadingDone({ setIsLoadingAuth, setAuthChecked, setIsLoadingPublicSettings });
    }
  }, [applyUser, checkUserAuth]);

  useEffect(() => {
    checkAppState();

    if (!isMockMode && base44.auth.onAuthStateChange) {
      const unsub = base44.auth.onAuthStateChange((nextUser) => {
        applyUser(nextUser);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        setIsLoadingPublicSettings(false);
      });
      return unsub;
    }
    return undefined;
  }, [checkAppState, applyUser]);

  const logout = (shouldRedirect = true) => {
    applyUser(null);
    if (shouldRedirect) {
      base44.auth.logout('/');
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
