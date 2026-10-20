import React from 'react';
import {
  Search,
  BookOpen,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { DynamicIcon } from '../utils/iconHelper';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenPostModal: () => void;
  totalResources: number;
  totalMembers: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onSelectCategory,
  onOpenPostModal,
  totalResources,
  totalMembers
}) => {
  const { settings, categories } = useSettings();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 rounded-3xl shadow-xl my-4 sm:my-6">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        
        {/* Badges */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-medium text-sky-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>พื้นที่แห่งการแบ่งปันความรู้เพื่อทุกคน</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          {settings.siteName || 'คลังปัญญา'}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-white mt-1">
            ร่วมสร้างสังคมแห่งการเรียนรู้ไร้ขีดจำกัด
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {settings.siteDescription ||
            'ศูนย์กลางรวบรวมสื่อการสอน เอกสารสรุป แบบฝึกหัด วิดีโอ และโปรเจกต์โค้ด โดยนักเรียน นักศึกษา และคุณครูไทย'}
        </p>

        {/* Large Search Bar */}
        <div className="max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/20">
            <div className="pl-3.5 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหาชื่อวิชา, สรุปบทเรียน, ฟิสิกส์, สถิติ, ภาษาอังกฤษ, AI..."
              className="w-full text-slate-800 text-xs sm:text-sm px-3 py-2.5 focus:outline-hidden placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 mr-1 text-xs"
              >
                ล้าง
              </button>
            )}
            <button
              onClick={onSearchSubmit}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>
              <strong className="text-white font-bold">{totalResources}</strong> สื่อการเรียนรู้
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-white font-bold">{totalMembers}</strong> สมาชิกในชุมชน
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>
              <strong className="text-white font-bold">{categories.length}</strong> หมวดหมู่วิชา
            </span>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-xs border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <DynamicIcon name={cat.icon} className="w-3.5 h-3.5 text-sky-300" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
