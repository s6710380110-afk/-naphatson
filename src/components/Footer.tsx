import React from 'react';
import { GraduationCap, Heart, Sparkles, BookOpen } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const Footer: React.FC<{
  onSelectCategory: (cat: string) => void;
  setCurrentView: (view: string) => void;
}> = ({ onSelectCategory, setCurrentView }) => {
  const { settings, categories } = useSettings();

  return (
    <footer className="mt-16 bg-white border-t border-slate-200 text-slate-600 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-base">
                {settings.siteName || 'คลังปัญญา (KlangPanya)'}
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              แพลตฟอร์มคลังความรู้เปิดเพื่อการศึกษาไทย สำหรับนักเรียน นักศึกษา และครูอาจารย์ มุ่งส่งเสริมการแบ่งปันองค์ความรู้ ชีทสรุป วิดีโอ และสื่อดิจิทัลเพื่อการเรียนรู้อย่างยั่งยืน
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              เมนูหลัก
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setCurrentView('home')}
                  className="hover:text-blue-600 transition-colors"
                >
                  หน้าแรก
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('explore')}
                  className="hover:text-blue-600 transition-colors"
                >
                  ค้นหาคลังความรู้
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('favorites')}
                  className="hover:text-blue-600 transition-colors"
                >
                  รายการโปรดของฉัน
                </button>
              </li>
            </ul>
          </div>

          {/* Featured Categories */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              หมวดหมู่วิชายอดนิยม
            </h4>
            <ul className="space-y-1.5">
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCategory(c.id)}
                    className="hover:text-blue-600 transition-colors truncate max-w-[180px] text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} KlangPanya. พัฒนาเพื่อการศึกษาไทยและชุมชนการเรียนรู้</p>
          <div className="flex items-center gap-1">
            <span>แบ่งปันด้วยใจเพื่อสังคมแห่งการเรียนรู้</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};
