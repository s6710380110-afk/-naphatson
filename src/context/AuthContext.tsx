import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

// Admin email configured for this system
const BOOTSTRAP_ADMIN_EMAIL = 's6710380110@pkru.ac.th';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  isSuspended: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, institution?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync or fetch profile from Firestore
  const syncUserProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let profileData: UserProfile;

    try {
      const snap = await getDoc(userRef);
      const isConfiguredAdmin = firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        profileData = snap.data() as UserProfile;
        
        // Auto-elevate bootstrap admin if role is not admin yet
        if (isConfiguredAdmin && profileData.role !== 'admin') {
          await updateDoc(userRef, {
            role: 'admin',
            updatedAt: new Date().toISOString()
          });
          profileData.role = 'admin';
        }
      } else {
        // Create initial profile
        const initialRole: UserRole = isConfiguredAdmin ? 'admin' : 'member';
        const initialStatus: UserStatus = 'active';

        profileData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'สมาชิกคลังปัญญา'),
          photoURL: firebaseUser.photoURL || '',
          role: initialRole,
          status: initialStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(userRef, profileData);
      }
      return profileData;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
        } catch (e) {
          console.error('Failed to sync profile:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await syncUserProfile(cred.user);
    setUserProfile(profile);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string, institution?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateAuthProfile(cred.user, { displayName });
    }
    
    // Auto send verification email
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send verification email immediately:', e);
    }

    const isConfiguredAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || email.split('@')[0],
      role: isConfiguredAdmin ? 'admin' : 'member',
      status: 'active',
      institution: institution || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
    }
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(cred.user);
    setUserProfile(profile);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('ไม่พบข้อมูลผู้ใช้เพื่อส่งอีเมลยืนยัน');
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!auth.currentUser) throw new Error('กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูล');
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    const sanitizedData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (data.displayName !== undefined) sanitizedData.displayName = data.displayName;
    if (data.photoURL !== undefined) sanitizedData.photoURL = data.photoURL;
    if (data.bio !== undefined) sanitizedData.bio = data.bio;
    if (data.institution !== undefined) sanitizedData.institution = data.institution;

    try {
      await updateDoc(userRef, sanitizedData);
      setUserProfile(prev => prev ? { ...prev, ...sanitizedData } : null);
      if (data.displayName && auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { displayName: data.displayName });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const isAdmin = userProfile?.role === 'admin' || user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const isModerator = isAdmin || userProfile?.role === 'moderator';
  const isMember = Boolean(userProfile && userProfile.role !== 'guest');
  const isSuspended = userProfile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isMember,
        isSuspended,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        sendVerificationEmail,
        updateProfileData,
        refreshUserProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
