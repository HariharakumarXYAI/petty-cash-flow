import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppUser, AppRole } from "@/lib/roles";
import { mockUsers } from "@/lib/roles";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  switchRole: (role: AppRole) => void;
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  login: () => undefined,
  logout: () => undefined,
  switchRole: () => undefined,
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const login = () => {
    setUser(mockUsers[0]);
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: AppRole) => {
    const found = mockUsers.find((candidate) => candidate.role === role);
    if (found) {
      setUser(found);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
