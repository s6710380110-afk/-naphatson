import React, { useState, useEffect } from 'react';
import {
  Eye,
  Heart,
  ExternalLink,
  Share2,
  MoreVertical,
  Flag,
  Trash2,
  Edit3,
  Lock
} from 'lucide-react';
import { KnowledgeResource, EDUCATION_LEVEL_LABELS, MEDIA_TYPE_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatThaiDateShort } from '../utils/thaiDate';
import { DynamicIcon } from '../utils/iconHelper';
import { toggleFavorite, checkIsFavorite } from '../services/resourceService';

interface ResourceCardProps {
  resource: KnowledgeResource;
  categoryName?: string;
  onSelect: (resource: KnowledgeResource) => void;
  onEdit?: (resource: KnowledgeResource) => void;
  onDelete?: (resource: KnowledgeResource) => void;
  onReport?: (resource: KnowledgeResource) => void;
  onRequireAuth?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  categoryName,
  onSelect,
  onEdit,
  onDelete,
  onReport,
  onRequireAuth,
}) => {
  const { user, isModerator } = useAuth();
  const { success, error } = useToast();
  const [isFav, setIsFav] = useState(false);
  const [likesCount, setLikesCount] = useState(resource.likesCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const isOwner = Boolean(user && user.uid === resource.authorId);
  const canManage = isOwner || isModerator;

  useEffect(() => {
    let isMounted = true;
    if (user) {
      checkIsFavorite(user.uid, resource.id).then((val) => {
        if (isMounted) setIsFav(val);
      });
    } else {
      setIsFav(false);
    }
    return () => {
      isMounted = false;
    };
  }, [user, resource.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (isTogglingFav) return;

    setIsTogglingFav(true);
    try {
      const nextFavState = await toggleFavorite(user.uid, resource, isFav);
      setIsFav(nextFavState);
      setLikesCount((prev) => (nextFavState ? prev + 1 : Math.max(0, prev - 1)));
      if (nextFavState) {
        success('บันทึกรายการโปรดสำเร็จ');
      } else {
        success('ยกเลิกรายการโปรดแล้ว');
      }
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการบันทึกรายการโปรด', err?.message);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#resource-${resource.id}`);
      success('คัดลอกลิงก์สื่อแล้ว');
    }
  };

  const mediaInfo = MEDIA_TYPE_LABELS[resource.mediaType] || { label: 'สื่อการเรียน', icon: 'Folder' };

  // Color accents for media types
  const getMediaBadgeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pdf':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'code':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'slide':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div
      onClick={() => onSelect(resource)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getMediaBadgeColor(resource.mediaType)}`}>
              <DynamicIcon name={mediaInfo.icon} className="w-3 h-3" />
              <span>{mediaInfo.label}</span>
            </span>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
              {categoryName || resource.category}
            </span>
          </div>

          {/* Quick Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      handleShareClick(e);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    แชร์ลิงก์
                  </button>

                  {canManage && onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(resource);
                      }}
                      className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      แก้ไขสื่อ
                    </button>
                  )}

                  {canManage && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(resource);
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบสื่อนี้
                    </button>
                  )}

                  {onReport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onReport(resource);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-500" />
                      รายงานเนื้อหา
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base leading-snug mb-2">
          {resource.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {resource.description}
        </p>

        {/* Level & Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[11px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full font-medium">
            {EDUCATION_LEVEL_LABELS[resource.educationLevel] || resource.educationLevel}
          </span>
          {resource.tags?.slice(0, 2).map((t, i) => (
            <span key={i} className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              #{t}
            </span>
          ))}
          {resource.tags && resource.tags.length > 2 && (
            <span className="text-[10px] text-slate-400">+{resource.tags.length - 2}</span>
          )}
        </div>
      </div>

      {/* Footer info: author, date, views, likes */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-400">
        <div className="truncate max-w-[140px]">
          <span className="text-slate-700 font-medium">{resource.authorName}</span>
          <span className="mx-1">•</span>
          <span>{formatThaiDateShort(resource.createdAt)}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 hover:text-slate-600" title="จำนวนผู้เข้าชม">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.viewsCount || 0}</span>
          </span>

          <button
            onClick={handleFavoriteClick}
            disabled={isTogglingFav}
            className={`flex items-center gap-1 p-1 rounded-md transition-colors ${
              isFav ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
            }`}
            title={isFav ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
