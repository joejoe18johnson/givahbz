"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmail,
  signInWithGoogle,
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
    profilePhoto: profile.profilePhoto,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const profile = await firebaseUserToProfile(firebaseUser);
          if (profile) {
            setUser(profileToUser(profile));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      await updateUserProfile(user.id, updates as Partial<UserProfile>);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

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
