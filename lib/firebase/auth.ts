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

export type UserStatus = "active" | "on_hold" | "deleted";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  role?: "user" | "admin";
  status?: UserStatus;
  birthday?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phonePending?: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idPending?: boolean;
  profilePhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin emails from env (client has NEXT_PUBLIC_*, server could have ADMIN_EMAILS)
function getAdminEmails(): string[] {
  const raw =
    typeof process.env.NEXT_PUBLIC_ADMIN_EMAILS !== "undefined"
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS
      : typeof process.env.ADMIN_EMAILS !== "undefined"
        ? process.env.ADMIN_EMAILS
        : "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Convert Firebase user to app user profile
export async function firebaseUserToProfile(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
  if (!firebaseUser) return null;

  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  const userData = userDoc.data();
  const storedRole = userData?.role || "user";
  const emailLower = (firebaseUser.email || "").toLowerCase();
  const adminEmails = getAdminEmails();
  const isAdminByEmail = adminEmails.length > 0 && adminEmails.includes(emailLower);
  const role = isAdminByEmail ? "admin" : storedRole;

  // Persist admin role in Firestore when email is in admin list (so email sign-in users get admin too)
  if (isAdminByEmail && storedRole !== "admin") {
    updateDoc(doc(db, "users", firebaseUser.uid), {
      role: "admin",
      updatedAt: serverTimestamp(),
    }).catch((err) => console.warn("Could not update admin role:", err));
  }

  const status = (userData?.status as UserProfile["status"]) || "active";
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: userData?.name || firebaseUser.displayName || "User",
    verified: userData?.verified || false,
    idVerified: userData?.idVerified || false,
    addressVerified: userData?.addressVerified || false,
    role: role as "user" | "admin",
    status,
    birthday: userData?.birthday,
    phoneNumber: userData?.phoneNumber,
    phoneVerified: userData?.phoneVerified || false,
    phonePending: userData?.phonePending || false,
    idDocument: userData?.idDocument,
    idDocumentType: userData?.idDocumentType,
    idPending: userData?.idPending || false,
    profilePhoto: userData?.profilePhoto || firebaseUser.photoURL,
    createdAt: userData?.createdAt?.toDate(),
    updatedAt: userData?.updatedAt?.toDate(),
  };
}

// Sign up with email and password. Phone number is required for onboarding; it must be approved before creating campaigns.
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  phoneNumber?: string
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  const userProfile: Partial<UserProfile> = {
    id: user.uid,
    email: user.email || email,
    name,
    verified: false,
    idVerified: false,
    addressVerified: false,
    role: "user",
    phoneNumber: phoneNumber?.trim() || undefined,
    phoneVerified: false,
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
  
  const adminEmails = (typeof process.env.NEXT_PUBLIC_ADMIN_EMAILS !== "undefined"
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS
    : process.env.ADMIN_EMAILS ?? ""
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emailLower = (user.email || "").toLowerCase();
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(emailLower);

  if (!userDoc.exists()) {
    const userProfile: Partial<UserProfile> = {
      id: user.uid,
      email: user.email || "",
      name: user.displayName || "User",
      verified: true, // Google accounts are pre-verified
      idVerified: true,
      addressVerified: false,
      role: isAdmin ? "admin" : "user",
      profilePhoto: user.photoURL ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else if (isAdmin) {
    // Existing user: ensure admin role if email is in admin list
    await updateDoc(doc(db, "users", user.uid), {
      role: "admin",
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
