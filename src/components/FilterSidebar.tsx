import React from 'react';
import {
  Filter,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { DynamicIcon } from '../utils/iconHelper';
import { CategoryItem, EDUCATION_LEVEL_LABELS, EducationLevel, MEDIA_TYPE_LABELS, MediaType } from '../types';

interface FilterSidebarProps {
  categories: CategoryItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  selectedMediaType: string;
  setSelectedMediaType: (type: string) => void;
  sortBy: 'newest' | 'popular' | 'likes';
  setSortBy: (sort: 'newest' | 'popular' | 'likes') => void;
  onReset: () => void;
  totalResultsCount: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  selectedMediaType,
  setSelectedMediaType,
  sortBy,
  setSortBy,
  onReset,
  totalResultsCount
}) => {
  const hasActiveFilters = Boolean(
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    selectedMediaType !== 'all'
  );

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>ตัวกรองการค้นหา</span>
          <span className="text-xs text-slate-500 font-normal">({totalResultsCount} รายการ)</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างค่า</span>
          </button>
        )}
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>การจัดเรียง</span>
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              sortBy === 'newest'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ล่าสุด
          </button>
          <button
            type="button"
            onClick={() => setSortBy('popular')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              sortBy === 'popular'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ยอดนิยม
          </button>
          <button
            type="button"
            onClick={() => setSortBy('likes')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              sortBy === 'likes'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ถูกใจมากสุด
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>หมวดหมู่วิชา</span>
        </label>
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ทุกหมวดหมู่วิชา</span>
            {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <DynamicIcon name={cat.icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </div>
              {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Education Level */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span>ระดับชั้นการศึกษา</span>
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSelectedLevel('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
              selectedLevel === 'all'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ทุกระดับชั้น</span>
            {selectedLevel === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>
          {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedLevel(level)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                selectedLevel === level
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{EDUCATION_LEVEL_LABELS[level]}</span>
              {selectedLevel === level && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Media Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>ประเภทสื่อการเรียนรู้</span>
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSelectedMediaType('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
              selectedMediaType === 'all'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ทุกประเภทสื่อ</span>
            {selectedMediaType === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>
          {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((mType) => {
            const item = MEDIA_TYPE_LABELS[mType];
            return (
              <button
                key={mType}
                type="button"
                onClick={() => setSelectedMediaType(mType)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  selectedMediaType === mType
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DynamicIcon name={item.icon} className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {selectedMediaType === mType && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
