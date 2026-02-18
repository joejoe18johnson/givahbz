import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updateEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export interface UserProfile {
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
  createdAt?: Date;
  updatedAt?: Date;
}

// Convert Firebase user to app user profile
export async function firebaseUserToProfile(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
  if (!firebaseUser) return null;

  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  const userData = userDoc.data();

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: userData?.name || firebaseUser.displayName || "User",
    verified: userData?.verified || false,
    idVerified: userData?.idVerified || false,
    addressVerified: userData?.addressVerified || false,
    role: userData?.role || "user",
    birthday: userData?.birthday,
    phoneNumber: userData?.phoneNumber,
    phoneVerified: userData?.phoneVerified || false,
    profilePhoto: userData?.profilePhoto || firebaseUser.photoURL,
    createdAt: userData?.createdAt?.toDate(),
    updatedAt: userData?.updatedAt?.toDate(),
  };
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, name: string): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName: name });

  // Create user profile in Firestore
  const userProfile: Partial<UserProfile> = {
    id: user.uid,
    email: user.email || email,
    name,
    verified: false,
    idVerified: false,
    addressVerified: false,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, "users", user.uid), {
    ...userProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return userProfile as UserProfile;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return await firebaseUserToProfile(userCredential.user) as UserProfile;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  
  const user = userCredential.user;
  
  // Check if user document exists, create if not
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) {
    const userProfile: Partial<UserProfile> = {
      id: user.uid,
      email: user.email || "",
      name: user.displayName || "User",
      verified: true, // Google accounts are pre-verified
      idVerified: true,
      addressVerified: false,
      role: "user",
      profilePhoto: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return await firebaseUserToProfile(user) as UserProfile;
}

// Sign out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Update email
export async function updateUserEmail(userId: string, newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await updateEmail(user, newEmail);
    await updateDoc(doc(db, "users", userId), {
      email: newEmail,
      updatedAt: serverTimestamp(),
    });
  }
}
