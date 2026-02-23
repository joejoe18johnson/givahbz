"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmail,
  signInWithGoogle,
  getGoogleRedirectResult,
  signUpWithEmail,
  signOutUser,
  updateUserProfile,
  firebaseUserToProfile,
  UserProfile,
} from "@/lib/firebase/auth";

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  role?: "user" | "admin";
  status?: "active" | "on_hold" | "deleted";
  birthday?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phonePending?: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idPending?: boolean;
  addressDocument?: string;
  addressPending?: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, phoneNumber?: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToUser(profile: UserProfile): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    verified: profile.verified,
    idVerified: profile.idVerified,
    addressVerified: profile.addressVerified,
    role: profile.role,
    status: profile.status,
    birthday: profile.birthday,
    phoneNumber: profile.phoneNumber,
    phoneVerified: profile.phoneVerified,
    phonePending: profile.phonePending,
    idDocument: profile.idDocument,
    idDocumentType: profile.idDocumentType,
    idPending: profile.idPending,
    addressDocument: profile.addressDocument,
    addressPending: profile.addressPending,
    profilePhoto: profile.profilePhoto,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Handle return from Google sign-in redirect (getRedirectResult must be called on load)
      const redirectProfile = await getGoogleRedirectResult();
      if (mounted && redirectProfile) {
        setUser(profileToUser(redirectProfile));
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const profile = await firebaseUserToProfile(firebaseUser);
          if (mounted && profile) {
            setUser(profileToUser(profile));
          } else if (mounted) {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (mounted) setUser(null);
        }
      } else if (mounted) {
        setUser(null);
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const profile = await signInWithEmail(email, password);
      setUser(profileToUser(profile));
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    const profile = await signInWithGoogle();
    setUser(profileToUser(profile));
    // Redirect is handled by the login/signup page (callbackUrl) or by the component that called this
  };

  const signup = async (email: string, password: string, name: string, phoneNumber?: string): Promise<boolean> => {
    try {
      const profile = await signUpWithEmail(email, password, name, phoneNumber);
      setUser(profileToUser(profile));
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      await updateUserProfile(user.id, updates as Partial<UserProfile>);
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }, [user]);

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
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
