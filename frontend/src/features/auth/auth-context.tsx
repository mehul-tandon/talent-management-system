import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { api, setAccessToken } from "../../lib/api";
import type { AuthUser } from "../../types/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const data = await api.post<{ accessToken: string; user: AuthUser }>("/auth/refresh");
        if (!isMounted) {
          return;
        }

        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        if (!isMounted) {
          return;
        }

        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isBootstrapping,
    async login(email: string, password: string) {
      const data = await api.post<{ accessToken: string; user: AuthUser }>("/auth/login", {
        email,
        password
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    async logout() {
      try {
        await api.delete("/auth/logout");
      } finally {
        setAccessToken(null);
        setUser(null);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
