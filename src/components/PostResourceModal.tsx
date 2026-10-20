import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { KnowledgeResource, EDUCATION_LEVEL_LABELS, EducationLevel, MEDIA_TYPE_LABELS, MediaType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './Toast';
import { createResource, updateResource, uploadResourceFile } from '../services/resourceService';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource?: KnowledgeResource | null;
  onSuccess?: () => void;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  editingResource,
  onSuccess
}) => {
  const { user, userProfile, isSuspended } = useAuth();
  const { categories } = useSettings();
  const { success, error, warning } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('general');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title);
      setDescription(editingResource.description);
      setCategory(editingResource.category);
      setEducationLevel(editingResource.educationLevel);
      setMediaType(editingResource.mediaType);
      setUrl(editingResource.url);
      setTagsInput(editingResource.tags?.join(', ') || '');
      setUploadMode('link');
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.id || 'computer');
      setEducationLevel('general');
      setMediaType('pdf');
      setUrl('');
      setTagsInput('');
      setFileToUpload(null);
      setUploadMode('link');
    }
    setFormError(null);
  }, [editingResource, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setFormError('ขนาดไฟล์ต้องไม่เกิน 25 MB');
        return;
      }
      setFileToUpload(file);
      setFormError(null);

      // Auto detect media type based on extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setMediaType('pdf');
      else if (['mp4', 'mov', 'webm'].includes(ext || '')) setMediaType('video');
      else if (['ppt', 'pptx'].includes(ext || '')) setMediaType('slide');
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) setMediaType('image');
      else if (['zip', 'js', 'py', 'ts', 'html'].includes(ext || '')) setMediaType('code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      error('กรุณาเข้าสู่ระบบก่อนเผยแพร่สื่อ');
      return;
    }

    if (isSuspended) {
      error('บัญชีของคุณถูกระงับ ไม่สามารถเผยแพร่สื่อได้');
      return;
    }

    // Client-side validations
    if (!title.trim() || title.length < 3) {
      setFormError('กรุณากรอกชื่อสื่อความรู้ความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (title.length > 200) {
      setFormError('ชื่อสื่อต้องไม่เกิน 200 ตัวอักษร');
      return;
    }
    if (!description.trim() || description.length < 5) {
      setFormError('กรุณากรอกคำอธิบายสื่อความรู้ความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }
    if (description.length > 3000) {
      setFormError('คำอธิบายต้องไม่เกิน 3,000 ตัวอักษร');
      return;
    }

    let finalUrl = url.trim();

    // If uploading file
    if (uploadMode === 'file') {
      if (!fileToUpload && !editingResource) {
        setFormError('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
        return;
      }
    } else {
      if (!finalUrl) {
        setFormError('กรุณาระบุลิงก์สื่อการเรียนรู้');
        return;
      }
      // Simple url check
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
    }

    setIsSubmitting(true);

    try {
      let storagePath: string | undefined = editingResource?.storagePath;

      if (uploadMode === 'file' && fileToUpload) {
        try {
          const uploadRes = await uploadResourceFile(fileToUpload, user.uid, (prog) => {
            setUploadProgress(Math.round(prog));
          });
          finalUrl = uploadRes.downloadUrl;
          storagePath = uploadRes.storagePath;
        } catch (storageErr: any) {
          console.warn('Storage upload note:', storageErr);
          // If storage bucket isn't set up, notify user and suggest direct link
          throw new Error('ไม่สามารถอัปโหลดไฟล์ไปยัง Storage ได้ กรุณาใช้ตัวเลือก "แนบลิงก์ (URL)" แทนชั่วคราว');
        }
      }

      // Parse tags
      const tags = tagsInput
        .split(/[,#]/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
        .slice(0, 10);

      if (editingResource) {
        await updateResource(editingResource.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          educationLevel,
          mediaType,
          url: finalUrl,
          storagePath,
          tags,
        });
        success('อัปเดตข้อมูลสื่อการเรียนรู้สำเร็จ');
      } else {
        await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          educationLevel,
          mediaType,
          url: finalUrl,
          storagePath,
          tags,
          authorId: user.uid,
          authorName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'สมาชิก',
          authorEmail: user.email || '',
        });
        success('เผยแพร่สื่อการเรียนรู้สำเร็จ');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit resource error:', err);
      const msg = err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setFormError(msg);
      error('ไม่สามารถบันทึกข้อมูลได้', msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {editingResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
            </h2>
            <p className="text-xs text-slate-500">
              ร่วมแบ่งปันองค์ความรู้เพื่อเพื่อนนักเรียน นักศึกษา และครูอาจารย์
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อสื่อการเรียนรู้ / หัวข้อความรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรฟิสิกส์ ม.ปลาย, ชีทคำศัพท์ภาษาอังกฤษสำหรับสอบ TGAT"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Category & Education Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับชั้นการศึกษา <span className="text-rose-500">*</span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              >
                {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map((level) => (
                  <option key={level} value={level}>
                    {EDUCATION_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ประเภทสื่อ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['pdf', 'video', 'website', 'slide', 'code', 'image'] as MediaType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMediaType(m)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    mediaType === m
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {MEDIA_TYPE_LABELS[m]?.label.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Content Source Tab: Direct Link vs File Upload */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  uploadMode === 'link'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>แนบลิงก์ (URL / YouTube / Google Drive)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดไฟล์เอกสาร</span>
              </button>
            </div>

            {uploadMode === 'link' ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  URL ของสื่อ (รองรับ YouTube, Google Docs/Drive, Notion, GitHub, หรือเว็บไซต์การศึกษา)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... หรือ https://drive.google.com/..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  เลือกไฟล์จากคอมพิวเตอร์ของคุณ (PDF, PPT, Word, รูปภาพ, สูงสุด 25 MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.mp4,.zip"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {fileToUpload && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    เลือกไฟล์: {fileToUpload.name} ({(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                {uploadProgress > 0 && (
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายเนื้อหาและคำแนะนำการใช้งาน <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายว่าสื่อนี้มีประโยชน์อย่างไร ครอบคลุมเนื้อหาอะไรบ้าง และเหมาะสำหรับใคร..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำสำคัญ / แท็ก (คั่นด้วยเครื่องหมายจุลภาค , หรือ #)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ฟิสิกส์, ม.5, คลื่นกล, เตรียมสอบ"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ช่วยให้ผู้ใช้งานท่านอื่นค้นพบสื่อของคุณได้ง่ายขึ้น
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{editingResource ? 'บันทึกการแก้ไข' : 'เผยแพร่สื่อความรู้'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
