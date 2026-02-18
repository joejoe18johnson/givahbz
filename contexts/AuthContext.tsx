"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  role?: "user" | "admin";
  birthday?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionToUser(session: { user?: { id?: string; email?: string | null; name?: string | null; role?: string } }): User {
  return {
    id: (session.user?.id as string) || (session.user?.email as string) || "google",
    email: session.user?.email ?? "",
    name: session.user?.name ?? "User",
    verified: true,
    idVerified: true,
    addressVerified: false,
    role: (session.user?.role as "user" | "admin") ?? "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (session?.user) {
      setUser(sessionToUser(session));
    } else {
      const storedUser = localStorage.getItem("belizeFund_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem("belizeFund_user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [session, status]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const storedUser = localStorage.getItem("belizeFund_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.email === email) {
        setUser(userData);
        return true;
      }
    }
    return false;
  };

  const loginWithGoogle = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      verified: false,
      idVerified: false,
      addressVerified: false,
      role: "user",
    };
    localStorage.setItem("belizeFund_user", JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Update localStorage if user is stored there
    const storedUser = localStorage.getItem("belizeFund_user");
    if (storedUser) {
      localStorage.setItem("belizeFund_user", JSON.stringify(updatedUser));
    }
    
    // TODO: Update backend/database with user changes
  };

  const logout = () => {
    localStorage.removeItem("belizeFund_user");
    setUser(null);
    signOut({ callbackUrl: "/" });
    router.push("/");
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, loginWithGoogle, signup, updateUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
