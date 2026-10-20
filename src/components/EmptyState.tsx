import React from 'react';
import { SearchX, FolderOpen, BookmarkX, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'category' | 'favorites' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionText,
  onAction
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <SearchX className="w-12 h-12 text-slate-400" />;
      case 'favorites':
        return <BookmarkX className="w-12 h-12 text-amber-400" />;
      default:
        return <FolderOpen className="w-12 h-12 text-blue-400" />;
    }
  };

  const defaultTitle =
    title ||
    (type === 'search'
      ? 'ไม่พบสื่อความรู้ที่ค้นหา'
      : type === 'favorites'
      ? 'ยังไม่มีรายการโปรดที่บันทึกไว้'
      : 'ยังไม่มีข้อมูลสื่อความรู้ในหมวดนี้');

  const defaultDescription =
    description ||
    (type === 'search'
      ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองหมวดหมู่และระดับชั้นเพื่อดูเนื้อหาเพิ่มเติม'
      : type === 'favorites'
      ? 'กดไอคอนหัวใจหรือปุ่มบันทึกบนสื่อความรู้ที่คุณสนใจ เพื่อเข้าถึงได้อย่างรวดเร็วในภายหลัง'
      : 'เป็นคนแรกที่ร่วมแบ่งปันสื่อความรู้ดีๆ ให้กับเพื่อนนักเรียน นักศึกษา และคุณครู');

  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
        {getIcon()}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">{defaultTitle}</h3>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
        {defaultDescription}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
