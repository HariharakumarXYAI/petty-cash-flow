import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { AppUser, AppRole } from "@/lib/roles";
import { mockUsers } from "@/lib/roles";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  switchRole: (role: AppRole) => void; // demo helper
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const login = () => {
    // Default to HO Finance for demo
    setUser(mockUsers[0]);
  };

  const logout = () => setUser(null);

  const switchRole = (role: AppRole) => {
    const found = mockUsers.find((u) => u.role === role);
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
