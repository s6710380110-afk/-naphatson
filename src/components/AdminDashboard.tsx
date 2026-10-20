import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './Toast';
import {
  ReportItem,
  UserProfile,
  KnowledgeResource,
  ModerationLogItem,
  CategoryItem,
  UserRole,
  UserStatus
} from '../types';
import { resolveReport, logModerationAction } from '../services/resourceService';
import { formatThaiDate } from '../utils/thaiDate';
import { DynamicIcon } from '../utils/iconHelper';

type AdminTab = 'reports' | 'users' | 'resources' | 'settings' | 'logs';

export const AdminDashboard: React.FC<{
  onSelectResource: (res: KnowledgeResource) => void;
}> = ({ onSelectResource }) => {
  const { user, userProfile, isAdmin, isModerator } = useAuth();
  const { settings, updateSettings, addCategory, removeCategory } = useSettings();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('reports');

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [loadingReports, setLoadingReports] = useState(true);

  // Users state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Resources state
  const [resourcesList, setResourcesList] = useState<KnowledgeResource[]>([]);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [loadingResources, setLoadingResources] = useState(true);

  // Moderation logs state
  const [logs, setLogs] = useState<ModerationLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Settings form state
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [announcementActive, setAnnouncementActive] = useState(settings.announcementActive);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // New category modal state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('BookOpen');
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Listen to reports
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReportItem));
        setReports(items);
        setLoadingReports(false);
      },
      (err) => {
        console.error('Reports listener err:', err);
        setLoadingReports(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile));
        setUsersList(items);
        setLoadingUsers(false);
      },
      (err) => {
        console.error('Users listener err:', err);
        setLoadingUsers(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to all resources
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as KnowledgeResource));
        setResourcesList(items);
        setLoadingResources(false);
      },
      (err) => {
        console.error('Resources listener err:', err);
        setLoadingResources(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to moderation logs
  useEffect(() => {
    const q = query(collection(db, 'moderationLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ModerationLogItem));
        setLogs(items);
        setLoadingLogs(false);
      },
      (err) => {
        console.error('Logs listener err:', err);
        setLoadingLogs(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync settings form
  useEffect(() => {
    setSiteName(settings.siteName);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
    setAnnouncementActive(settings.announcementActive);
  }, [settings]);

  if (!isModerator) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-xs">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-sm text-slate-600">
          หน้านี้สงวนไว้สำหรับผู้ดูแลระบบและผู้ดูแลเนื้อหา (Moderator / Admin) เท่านั้น
        </p>
      </div>
    );
  }

  // Action: Take down or hide resource
  const handleToggleResourceStatus = async (resource: KnowledgeResource) => {
    const newStatus = resource.status === 'published' ? 'hidden' : 'published';
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      await logModerationAction(
        user?.uid || '',
        user?.email || '',
        `resource_${newStatus}`,
        'resource',
        resource.id,
        `${newStatus === 'hidden' ? 'ซ่อน' : 'เผยแพร่'} สื่อ: ${resource.title}`
      );
      success(`${newStatus === 'hidden' ? 'ซ่อนสื่อเรียบร้อยแล้ว' : 'เผยแพร่สื่อตามปกติแล้ว'}`);
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะสื่อได้', err?.message);
    }
  };

  // Action: Delete resource with confirmation
  const handleDeleteResourceConfirm = (resource: KnowledgeResource) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบสื่อการเรียนรู้',
      message: `คุณต้องการลบ "${resource.title}" ออกจากระบบอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'resources', resource.id));
          await logModerationAction(
            user?.uid || '',
            user?.email || '',
            'delete_resource',
            'resource',
            resource.id,
            `ลบสื่อถาวร: ${resource.title}`
          );
          success('ลบสื่อการเรียนรู้เรียบร้อยแล้ว');
        } catch (err: any) {
          error('ไม่สามารถลบสื่อได้', err?.message);
        }
      }
    });
  };

  // Action: Handle Report
  const handleReportAction = async (report: ReportItem, action: 'dismiss' | 'hide_resource' | 'delete_resource') => {
    if (action === 'dismiss') {
      try {
        await resolveReport(report.id, 'dismissed', 'ผู้ดูแลตรวจสอบแล้วไม่พบปัญหา', user?.uid || '', user?.email || '');
        success('ยกเลิกรายงานปัญหานี้แล้ว');
      } catch (err: any) {
        error('เกิดข้อผิดพลาด', err?.message);
      }
    } else if (action === 'hide_resource') {
      try {
        await updateDoc(doc(db, 'resources', report.resourceId), {
          status: 'hidden',
          updatedAt: new Date().toISOString()
        });
        await resolveReport(report.id, 'resolved', 'ผู้ดูแลสั่งซ่อนสื่อเนื่องจากมีปัญหา', user?.uid || '', user?.email || '');
        success('สั่งซ่อนสื่อและปิดรายงานเรียบร้อยแล้ว');
      } catch (err: any) {
        error('เกิดข้อผิดพลาด', err?.message);
      }
    } else if (action === 'delete_resource') {
      setConfirmDialog({
        isOpen: true,
        title: 'ยืนยันการลบสื่อตามรายงาน',
        message: `คุณต้องการลบสื่อ "${report.resourceTitle}" ออกจากระบบและปิดรายงานนี้ใช่หรือไม่?`,
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, 'resources', report.resourceId));
            await resolveReport(report.id, 'resolved', 'ผู้ดูแลลบสื่อออกจากระบบถาวร', user?.uid || '', user?.email || '');
            success('ลบสื่อและบันทึกรายงานสำเร็จ');
          } catch (err: any) {
            error('เกิดข้อผิดพลาดในการลบสื่อ', err?.message);
          }
        }
      });
    }
  };

  // Action: Toggle user status (active / suspended)
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const newStatus: UserStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    setConfirmDialog({
      isOpen: true,
      title: newStatus === 'suspended' ? 'ยืนยันการระงับบัญชี' : 'ยืนยันการคืนสถานะบัญชี',
      message: `คุณต้องการ ${newStatus === 'suspended' ? 'ระงับบัญชี' : 'ปลดการระงับบัญชี'} ของคุณ "${targetUser.displayName}" (${targetUser.email}) หรือไม่?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', targetUser.uid), {
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
          await logModerationAction(
            user?.uid || '',
            user?.email || '',
            `user_${newStatus}`,
            'user',
            targetUser.uid,
            `${newStatus === 'suspended' ? 'ระงับ' : 'ปลดระงับ'} บัญชี: ${targetUser.email}`
          );
          success(`${newStatus === 'suspended' ? 'ระงับบัญชีเรียบร้อย' : 'ปลดการระงับบัญชีสำเร็จ'}`);
        } catch (err: any) {
          error('ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้', err?.message);
        }
      }
    });
  };

  // Action: Change user role (Admin only)
  const handleChangeUserRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!isAdmin) {
      warning('เฉพาะ Admin สูงสุดเท่านั้นที่สามารถปรับเปลี่ยนบทบาทผู้ใช้ได้');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      await logModerationAction(
        user?.uid || '',
        user?.email || '',
        'change_user_role',
        'user',
        targetUser.uid,
        `เปลี่ยนบทบาท ${targetUser.email} เป็น ${newRole}`
      );
      success(`เปลี่ยนบทบาทเป็น ${newRole} สำเร็จ`);
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้', err?.message);
    }
  };

  // Action: Save Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      warning('เฉพาะ Admin สูงสุดเท่านั้นที่สามารถบันทึกการตั้งค่าระบบได้');
      return;
    }
    setIsSavingSettings(true);
    try {
      await updateSettings({
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        announcement: announcement.trim(),
        announcementActive
      });
      await logModerationAction(
        user?.uid || '',
        user?.email || '',
        'update_settings',
        'settings',
        'general',
        'อัปเดตข้อมูลทั่วไปของเว็บไซต์และการตั้งค่าหมวดหมู่'
      );
      success('บันทึกการตั้งค่าเว็บไซต์สำเร็จ');
    } catch (err: any) {
      error('ไม่สามารถบันทึกการตั้งค่าได้', err?.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Action: Add custom category
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      error('กรุณาระบุชื่อหมวดหมู่');
      return;
    }
    try {
      await addCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || 'หมวดหมู่วิชาความรู้ทั่วไป',
        icon: newCatIcon,
        color: 'from-blue-500 to-indigo-600'
      });
      success('เพิ่มหมวดหมู่ใหม่สำเร็จ');
      setNewCatName('');
      setNewCatDesc('');
      setShowAddCatModal(false);
    } catch (err: any) {
      error('ไม่สามารถเพิ่มหมวดหมู่ได้', err?.message);
    }
  };

  // Filtered lists
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  const filteredUsers = usersList.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.institution?.toLowerCase().includes(q)
    );
  });

  const filteredResources = resourcesList.filter((res) => {
    const q = resourceSearchQuery.toLowerCase();
    return (
      res.title.toLowerCase().includes(q) ||
      res.authorName.toLowerCase().includes(q) ||
      res.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">ศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)</h1>
            <span className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-semibold">
              {isAdmin ? 'Admin' : 'Moderator'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            ระบบตรวจสอบเนื้อหา จัดการสมาชิก และปรับแต่งโครงสร้างหมวดหมู่ของแพลตฟอร์มคลังปัญญา
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-300">รายงานรอตรวจ</p>
            <p className="text-lg font-bold text-amber-300">
              {reports.filter((r) => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-300">สมาชิกทั้งหมด</p>
            <p className="text-lg font-bold text-sky-300">{usersList.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/10 text-center">
            <p className="text-slate-300">สื่อความรู้</p>
            <p className="text-lg font-bold text-emerald-300">{resourcesList.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1 text-sm">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>รายงานปัญหา ({reports.filter((r) => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>จัดการสื่อทั้งหมด ({resourcesList.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ตั้งค่าเว็บไซต์ & หมวดหมู่</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>บันทึกกิจกรรม ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {(['pending', 'resolved', 'dismissed', 'all'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setReportFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    reportFilter === filterKey
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filterKey === 'pending'
                    ? 'รอตรวจสอบ'
                    : filterKey === 'resolved'
                    ? 'แก้ไขแล้ว'
                    : filterKey === 'dismissed'
                    ? 'ยกเลิกรายงาน'
                    : 'ทั้งหมด'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">พบ {filteredReports.length} รายการ</p>
          </div>

          {loadingReports ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังโหลดข้อมูลรายงาน...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              ไม่พบรายการรายงานปัญหาในสถานะนี้
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {report.status === 'pending' ? 'รอตรวจสอบ' : report.status === 'resolved' ? 'แก้ไขแล้ว' : 'ยกเลิก'}
                        </span>
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          {report.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatThaiDate(report.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        สื่อ: {report.resourceTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ผู้รายงาน: {report.reporterEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReportAction(report, 'hide_resource')}
                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>ซ่อนสื่อ</span>
                          </button>
                          <button
                            onClick={() => handleReportAction(report, 'delete_resource')}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบสื่อ</span>
                          </button>
                          <button
                            onClick={() => handleReportAction(report, 'dismiss')}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ยกเลิก</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {report.details && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-500">รายละเอียดเพิ่มเติม: </span>
                      {report.details}
                    </div>
                  )}

                  {report.actionTaken && (
                    <div className="text-xs text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                      <span className="font-semibold">ผลการดำเนินการ: </span>
                      {report.actionTaken} ({formatThaiDate(report.resolvedAt)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล หรือสถานศึกษา..."
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500">สมาชิกทั้งหมด {filteredUsers.length} บัญชี</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">สมาชิก</th>
                    <th className="py-3 px-4">อีเมล</th>
                    <th className="py-3 px-4">บทบาท</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4">วันที่สมัคร</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {u.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="line-clamp-1">{u.displayName}</p>
                            {u.institution && (
                              <p className="text-[10px] text-slate-400">{u.institution}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u, e.target.value as UserRole)}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium"
                          >
                            <option value="member">สมาชิก (Member)</option>
                            <option value="moderator">ผู้ดูแลเนื้อหา (Moderator)</option>
                            <option value="admin">ผู้ดูแลสูงสุด (Admin)</option>
                          </select>
                        ) : (
                          <span className="font-semibold capitalize text-slate-800">{u.role}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            u.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.status === 'suspended' ? 'ถูกระงับ' : 'ใช้งานปกติ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatThaiDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.status === 'suspended' ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>ปลดระงับ</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>ระงับบัญชี</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL RESOURCES */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={resourceSearchQuery}
                onChange={(e) => setResourceSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสื่อ, ผู้โพสต์ หรือหมวดหมู่..."
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
            <p className="text-xs text-slate-500">สื่อทั้งหมด {filteredResources.length} รายการ</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ชื่อสื่อ</th>
                    <th className="py-3 px-4">ผู้แบ่งปัน</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4">ยอดชม / ถูกใจ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredResources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                        <button
                          onClick={() => onSelectResource(res)}
                          className="hover:text-blue-600 line-clamp-1 text-left"
                        >
                          {res.title}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{res.authorName}</td>
                      <td className="py-3 px-4">{res.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            res.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {res.status === 'published' ? 'เผยแพร่' : 'ซ่อน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {res.viewsCount || 0} ชม / {res.likesCount || 0} ไลก์
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleResourceStatus(res)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                          title={res.status === 'published' ? 'ซ่อนสื่อ' : 'เผยแพร่สื่อ'}
                        >
                          {res.status === 'published' ? (
                            <EyeOff className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteResourceConfirm(res)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="ลบสื่อถาวร"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SITE SETTINGS & CATEGORIES (ADMIN ONLY) */}
      {activeTab === 'settings' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* General Site Branding */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">ตั้งค่าข้อมูลเว็บไซต์ทั่วไป</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อเว็บไซต์ (Site Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายเว็บไซต์ (Description) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ข้อความประกาศด้านบน (Banner Announcement)
                </label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="เช่น ต้อนรับเปิดเทอมใหม่ ร่วมแชร์สื่อการสอนลุ้นรับของที่ระลึก!"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="announcementToggle"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                />
                <label htmlFor="announcementToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                  เปิดแสดงแถบประกาศด้านบนของเว็บไซต์
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>บันทึกการตั้งค่า</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Categories Management */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">จัดการหมวดหมู่วิชา</h3>
                <p className="text-xs text-slate-500">เพิ่มหรือลบหมวดหมู่วิชาความรู้ผ่านหน้าเว็บได้ทันที</p>
              </div>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {settings.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs">
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">{cat.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (settings.categories.length <= 1) {
                        warning('ต้องมีหมวดหมู่วิชาอย่างน้อย 1 หมวด');
                        return;
                      }
                      removeCategory(cat.id);
                      success(`ลบหมวดหมู่ "${cat.name}" เรียบร้อยแล้ว`);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="ลบหมวดหมู่"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: MODERATION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              ประวัติการดำเนินงานของผู้ดูแลระบบ (Audit Trail)
            </h3>
            <p className="text-xs text-slate-500">บันทึกทั้งหมด {logs.length} รายการ</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 text-xs">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {log.action}
                      </span>
                      <span className="text-slate-600 font-medium">โดย {log.adminEmail}</span>
                    </div>
                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{log.details}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatThaiDate(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">เพิ่มหมวดหมู่วิชาใหม่</h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อหมวดหมู่วิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="เช่น การงานอาชีพ, ดาราศาสตร์, เกษตรศาสตร์"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายหมวดหมู่
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="เช่น เนื้อหาเกี่ยวกับการฝึกอาชีพและการประดิษฐ์"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกไอคอนหมวดหมู่
                </label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="BookOpen">หนังสือ (BookOpen)</option>
                  <option value="Cpu">คอมพิวเตอร์ / เทคโนโลยี (Cpu)</option>
                  <option value="Atom">วิทยาศาสตร์ (Atom)</option>
                  <option value="Calculator">คณิตศาสตร์ (Calculator)</option>
                  <option value="Globe">ภาษาต่างประเทศ (Globe)</option>
                  <option value="Landmark">สังคม / ประวัติศาสตร์ (Landmark)</option>
                  <option value="Palette">ศิลปะ / ออกแบบ (Palette)</option>
                  <option value="Sparkles">ความรู้ทั่วไป (Sparkles)</option>
                  <option value="GraduationCap">การศึกษา (GraduationCap)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  เพิ่มหมวดหมู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
