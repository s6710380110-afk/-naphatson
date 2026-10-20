import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  PlusCircle,
  Bookmark,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPostModal: () => void;
  onOpenProfileModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuthModal,
  onOpenPostModal,
  onOpenProfileModal,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, userProfile, isAdmin, isModerator, logout } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Name */}
          <div
            onClick={() => {
              setCurrentView('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  {settings.siteName || 'คลังปัญญา'}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm">
                  KlangPanya
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                แหล่งรวบรวมสื่อการเรียนรู้สำหรับคนไทย
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'home'
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => setCurrentView('explore')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'explore'
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              คลังความรู้
            </button>

            {user && (
              <button
                onClick={() => setCurrentView('favorites')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'favorites'
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                รายการโปรด
              </button>
            )}

            {isModerator && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                ผู้ดูแลระบบ
                {isAdmin && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                    Admin
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Quick Actions & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Share Knowledge Button */}
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuthModal('login');
                } else {
                  onOpenPostModal();
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl shadow-xs shadow-blue-600/30 transition-all duration-150 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันสื่อความรู้</span>
            </button>

            {/* User Profile or Login/Register */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden text-sm">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {userProfile?.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {isAdmin ? 'ผู้ดูแลสูงสุด' : isModerator ? 'ผู้ดูแลเนื้อหา' : 'สมาชิก'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {userProfile?.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.emailVerified ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ยืนยันอีเมลแล้ว</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ยังไม่ยืนยันอีเมล</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenProfileModal();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        โปรไฟล์ของฉัน
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setCurrentView('my-resources');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4 text-slate-400" />
                        สื่อที่ฉันแบ่งปัน
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setCurrentView('favorites');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        รายการโปรด
                      </button>

                      {isModerator && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setCurrentView('admin');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          หน้าจัดการ Admin
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <button
            onClick={() => {
              setCurrentView('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-base font-medium ${
              currentView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            หน้าแรก
          </button>
          <button
            onClick={() => {
              setCurrentView('explore');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-base font-medium flex items-center gap-2 ${
              currentView === 'explore' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-5 h-5 text-blue-600" />
            คลังความรู้
          </button>
          {user && (
            <button
              onClick={() => {
                setCurrentView('favorites');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-base font-medium flex items-center gap-2 ${
                currentView === 'favorites' ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-5 h-5 text-amber-500" />
              รายการโปรด
            </button>
          )}
          {isModerator && (
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-base font-medium flex items-center gap-2 ${
                currentView === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-5 h-5 text-indigo-600" />
              ผู้ดูแลระบบ
            </button>
          )}

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!user) onOpenAuthModal('login');
                else onOpenPostModal();
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl"
            >
              <PlusCircle className="w-5 h-5" />
              แบ่งปันสื่อความรู้
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
