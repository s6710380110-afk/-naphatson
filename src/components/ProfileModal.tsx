import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  School,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, updateProfileData, sendVerificationEmail, isAdmin, isModerator } = useAuth();
  const { success, error, info } = useToast();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingVerify, setIsSendingVerify] = useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setInstitution(userProfile.institution || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      error('กรุณาระบุชื่อที่แสดง');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileData({
        displayName: displayName.trim(),
        institution: institution.trim(),
        bio: bio.trim(),
      });
      success('อัปเดตข้อมูลโปรไฟล์สำเร็จ');
      onClose();
    } catch (err: any) {
      error('ไม่สามารถอัปเดตโปรไฟล์ได้', err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerify(true);
    try {
      await sendVerificationEmail();
      info('ส่งอีเมลยืนยันแล้ว', 'โปรดตรวจสอบกล่องข้อความหรือโฟลเดอร์จดหมายขยะของคุณ');
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน', err?.message);
    } finally {
      setIsSendingVerify(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">โปรไฟล์ผู้ใช้งาน</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* User Email & Verification Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">บัญชีอีเมล</p>
              <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ยืนยันตัวตนผ่านอีเมลแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ยังไม่ได้ยืนยันอีเมล
                  </span>
                )}
              </div>
            </div>

            {!user.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSendingVerify}
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingVerify ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>ส่งอีเมลยืนยัน</span>
              </button>
            )}
          </div>

          {/* Role & Status Badges */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">บทบาทของคุณ:</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                isAdmin
                  ? 'bg-indigo-100 text-indigo-800'
                  : isModerator
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {isAdmin ? 'ผู้ดูแลระบบสูงสุด (Admin)' : isModerator ? 'ผู้ดูแลเนื้อหา (Moderator)' : 'สมาชิก (Member)'}
            </span>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ-นามสกุล / ชื่อที่แสดง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สถานศึกษา / โรงเรียน / มหาวิทยาลัย
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="เช่น มหาวิทยาลัยราชภัฏภูเก็ต / โรงเรียนเตรียมอุดมศึกษา"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ข้อมูลแนะนำตัวสั้นๆ
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="แนะนำตัว สาขาวิชา หรือสิ่งที่สนใจแบ่งปัน..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>บันทึกการเปลี่ยนแปลง</span>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
