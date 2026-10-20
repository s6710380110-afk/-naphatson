import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { DynamicIcon } from '../utils/iconHelper';

interface CategoryShowcaseProps {
  onSelectCategory: (categoryId: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  onSelectCategory,
  categoryCounts
}) => {
  const { categories } = useSettings();

  return (
    <section className="space-y-4 my-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>หมวดหมู่วิชาและความรู้</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            เลือกเรียนรู้ตามกลุ่มสาระการเรียนรู้และสาขาวิชาที่คุณสนใจ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {categories.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DynamicIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{count} รายการ</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
