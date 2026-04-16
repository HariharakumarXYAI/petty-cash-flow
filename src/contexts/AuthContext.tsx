import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppUser, AppRole } from "@/lib/roles";
import { mockUsers } from "@/lib/roles";
import type { MockCredential } from "@/lib/mock-credentials";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  firstLoginCredential: MockCredential | null;
  login: () => void;
  logout: () => void;
  switchRole: (role: AppRole) => void;
  setFirstLoginCredential: (cred: MockCredential | null) => void;
  clearFirstLogin: () => void;
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  firstLoginCredential: null,
  login: () => undefined,
  logout: () => undefined,
  switchRole: () => undefined,
  setFirstLoginCredential: () => undefined,
  clearFirstLogin: () => undefined,
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firstLoginCredential, setFirstLoginCredential] = useState<MockCredential | null>(null);

  const login = () => {
    setUser(mockUsers[0]);
  };

  const logout = () => {
    setUser(null);
    setFirstLoginCredential(null);
  };

  const switchRole = (role: AppRole) => {
    const found = mockUsers.find((candidate) => candidate.role === role);
    if (found) {
      setUser(found);
    }
  };

  const clearFirstLogin = () => {
    setFirstLoginCredential(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        firstLoginCredential,
        login,
        logout,
        switchRole,
        setFirstLoginCredential,
        clearFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
