import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Heart,
  Share2,
  Flag,
  Calendar,
  Eye,
  User,
  GraduationCap,
  Layers,
  Tag,
  Trash2,
  Edit3,
  Download
} from 'lucide-react';
import { KnowledgeResource, EDUCATION_LEVEL_LABELS, MEDIA_TYPE_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatThaiDate } from '../utils/thaiDate';
import { DynamicIcon } from '../utils/iconHelper';
import { Breadcrumbs } from './Breadcrumbs';
import { incrementViewCount, toggleFavorite, checkIsFavorite } from '../services/resourceService';

interface ResourceDetailModalProps {
  resource: KnowledgeResource | null;
  categoryName?: string;
  onClose: () => void;
  onEdit: (resource: KnowledgeResource) => void;
  onDelete: (resource: KnowledgeResource) => void;
  onReport: (resource: KnowledgeResource) => void;
  onRequireAuth: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  categoryName,
  onClose,
  onEdit,
  onDelete,
  onReport,
  onRequireAuth
}) => {
  const { user, isModerator } = useAuth();
  const { success, error } = useToast();
  const [isFav, setIsFav] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!resource) return;
    setLikesCount(resource.likesCount || 0);

    // Track view count
    incrementViewCount(resource.id);

    // Check favorite status
    if (user) {
      checkIsFavorite(user.uid, resource.id).then((val) => setIsFav(val));
    }
  }, [resource, user]);

  if (!resource) return null;

  const isOwner = Boolean(user && user.uid === resource.authorId);
  const canManage = isOwner || isModerator;
  const mediaInfo = MEDIA_TYPE_LABELS[resource.mediaType] || { label: 'สื่อการเรียน', icon: 'Folder' };

  // Helper to extract YouTube video ID for embedded player
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
    } catch {
      return null;
    }
  };

  const youtubeEmbedUrl = resource.mediaType === 'video' ? getYouTubeEmbedUrl(resource.url) : null;

  const handleFavorite = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      const nextFav = await toggleFavorite(user.uid, resource, isFav);
      setIsFav(nextFav);
      setLikesCount((prev) => (nextFav ? prev + 1 : Math.max(0, prev - 1)));
      if (nextFav) {
        success('บันทึกรายการโปรดแล้ว');
      } else {
        success('ยกเลิกรายการโปรดแล้ว');
      }
    } catch (err: any) {
      error('ไม่สามารถบันทึกรายการโปรดได้', err?.message);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('คัดลอกลิงก์สื่อการเรียนรู้แล้ว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Breadcrumbs & Close button */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70">
          <Breadcrumbs
            items={[
              { label: 'คลังความรู้', onClick: onClose },
              { label: categoryName || resource.category, onClick: onClose },
              { label: resource.title, active: true },
            ]}
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <DynamicIcon name={mediaInfo.icon} className="w-3.5 h-3.5" />
              <span>{mediaInfo.label}</span>
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {categoryName || resource.category}
            </span>

            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800">
              {EDUCATION_LEVEL_LABELS[resource.educationLevel] || resource.educationLevel}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {resource.title}
          </h1>

          {/* Video Preview or External Link Preview */}
          {youtubeEmbedUrl ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md bg-black">
              <iframe
                src={youtubeEmbedUrl}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  ช่องทางเข้าถึงเนื้อหาต้นฉบับ
                </p>
                <p className="text-sm text-slate-700 font-medium break-all">
                  {resource.url}
                </p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
              >
                <span>เปิดดูสื่อการเรียนรู้</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              รายละเอียดสื่อการเรียนรู้
            </h4>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {resource.description}
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>คำสำคัญ / แท็ก</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {resource.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author & Timestamp Information */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{resource.authorName}</p>
                <p className="text-[11px] text-slate-400">ผู้แบ่งปันความรู้</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-start sm:justify-end">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatThaiDate(resource.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>เข้าชม {resource.viewsCount || 1} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
                isFav
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFav ? 'อยู่ในรายการโปรดแล้ว' : 'บันทึกเป็นรายการโปรด'}</span>
              <span className="text-[11px] opacity-75">({likesCount})</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>แชร์</span>
            </button>

            <button
              onClick={() => onReport(resource)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="รายงานเนื้อหาที่ไม่เหมาะสมหรือลิงก์เสีย"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>รายงาน</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(resource);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขสื่อ</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(resource);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </>
            )}

            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <span>เปิดลิงก์</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
