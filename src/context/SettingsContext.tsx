import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CategoryItem, DEFAULT_CATEGORIES, SiteSettings } from '../types';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  categories: CategoryItem[];
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  addCategory: (category: Omit<CategoryItem, 'id'>) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
}

const defaultInitialSettings: SiteSettings = {
  siteName: 'คลังปัญญา (KlangPanya)',
  siteDescription: 'ศูนย์กลางรวบรวมและแบ่งปันสื่อการเรียนรู้ เอกสาร วิดีโอ และโค้ดสำหรับนักเรียน นักศึกษา และครูอาจารย์ไทย',
  announcement: 'ยินดีต้อนรับสู่ KlangPanya แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย ร่วมแบ่งปันสื่อการสอนวันนี้!',
  announcementActive: true,
  categories: DEFAULT_CATEGORIES,
  updatedAt: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultInitialSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'general');

    const unsubscribe = onSnapshot(
      settingsDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          setSettings({
            ...defaultInitialSettings,
            ...data,
            categories: data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES
          });
        } else {
          // Initialize if document doesn't exist yet
          try {
            await setDoc(settingsDocRef, defaultInitialSettings);
            setSettings(defaultInitialSettings);
          } catch (e) {
            console.warn('Settings init note:', e);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Settings listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const settingsDocRef = doc(db, 'settings', 'general');
    const payload = {
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'Admin'
    };

    try {
      await updateDoc(settingsDocRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/general');
    }
  };

  const addCategory = async (category: Omit<CategoryItem, 'id'>) => {
    const newId = 'cat_' + Date.now();
    const updatedCategories = [...settings.categories, { ...category, id: newId }];
    await updateSettings({ categories: updatedCategories });
  };

  const removeCategory = async (categoryId: string) => {
    const updatedCategories = settings.categories.filter(c => c.id !== categoryId);
    await updateSettings({ categories: updatedCategories });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        categories: settings.categories,
        updateSettings,
        addCategory,
        removeCategory
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
