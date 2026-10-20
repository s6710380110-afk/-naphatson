import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { KnowledgeResource, ReportReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { submitReport } from '../services/resourceService';

interface ReportModalProps {
  resource: KnowledgeResource | null;
  onClose: () => void;
  onRequireAuth: () => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  { id: 'broken_link', label: 'ลิงก์เสีย / ไม่สามารถเข้าถึงไฟล์ได้', desc: 'ไฟล์ถูกลบ ลิงก์ Google Drive ติดสิทธิ์ หรือเว็บปลายทางไม่เปิด' },
  { id: 'copyright', label: 'ละเมิดลิขสิทธิ์หรือผลงานผู้อื่น', desc: 'คัดลอกหรือเผยแพร่ผลงานโดยไม่ได้รับอนุญาตจากเจ้าของผลงาน' },
  { id: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม / หยาบคาย / หลอกลวง', desc: 'มีภาพหรือข้อความขัดต่อความสงบเรียบร้อย มีการโฆษณาสแปม' },
  { id: 'inaccurate', label: 'ข้อมูลทางวิชาการผิดพลาดหรือบิดเบือน', desc: 'เนื้อหาไม่ถูกต้องอย่างรุนแรงอาจทำให้ผู้เรียนเข้าใจผิด' },
  { id: 'other', label: 'ปัญหาอื่นๆ', desc: 'ระบุรายละเอียดเพิ่มเติม' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  resource,
  onClose,
  onRequireAuth
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport(
        resource.id,
        resource.title,
        user.uid,
        user.email || '',
        reason,
        details.trim()
      );
      success('ส่งรายงานปัญหาเรียบร้อยแล้ว', 'ทีมงานจะดำเนินการตรวจสอบโดยเร็วที่สุด');
      onClose();
    } catch (err: any) {
      error('ไม่สามารถส่งรายงานได้', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <Flag className="w-4 h-4 text-amber-600" />
            <span>รายงานเนื้อหาที่ไม่เหมาะสม</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">สื่อที่กำลังรายงาน:</p>
            <p className="font-semibold text-slate-800 line-clamp-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
              {resource.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              เหตุผลในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === item.id
                      ? 'border-amber-400 bg-amber-50/60 text-amber-950 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.id}
                    checked={reason === item.id}
                    onChange={() => setReason(item.id)}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุจุดที่พบปัญหา เช่น ลิงก์เปิดไม่ได้ในนาทีที่... หรือหลักฐานการเป็นเจ้าของลิขสิทธิ์"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังส่งข้อมูล...</span>
                </>
              ) : (
                <span>ส่งรายงานปัญหา</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
