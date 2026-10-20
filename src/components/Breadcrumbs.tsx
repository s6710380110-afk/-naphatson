import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 py-3 overflow-x-auto no-scrollbar">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>หน้าแรก</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {item.onClick && !item.active ? (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={`truncate max-w-[250px] ${
                item.active ? 'text-slate-900 font-medium' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
