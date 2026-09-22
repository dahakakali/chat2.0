"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const SESSION_KEY = "chat2_session";
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  // Check session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const elapsed = Date.now() - session.loginTime;
      if (elapsed > SESSION_DURATION) {
        setUser(session);
        setLocked(true);
      } else {
        setUser(session);
        setLocked(false);
      }
    }
    setLoading(false);
  }, []);

  // Periodically check session expiry
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const session = getSession();
      if (session) {
        const elapsed = Date.now() - session.loginTime;
        if (elapsed > SESSION_DURATION && !locked) {
          setLocked(true);
        }
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [user, locked]);

  const login = useCallback((userData) => {
    const session = { ...userData, loginTime: Date.now() };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
    }
    setUser(session);
    setLocked(false);
  }, []);

  const unlock = useCallback(() => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const session = { ...prevUser, loginTime: Date.now() };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
      }
      setLocked(false);
      return session;
    });
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setUser(null);
    setLocked(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, locked, login, unlock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function getSession() {
  if (typeof window === "undefined") return null;
  try {
    let data;
    try { data = localStorage.getItem(SESSION_KEY); } catch {}
    if (!data) {
      try { data = sessionStorage.getItem(SESSION_KEY); } catch {}
    }
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
