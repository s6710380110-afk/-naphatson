export type UserRole = 'guest' | 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  institution?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'slide' | 'code' | 'image' | 'other';

export type EducationLevel = 
  | 'primary'          // ประถมศึกษา
  | 'secondary_early'  // มัธยมศึกษาตอนต้น
  | 'secondary_late'   // มัธยมศึกษาตอนปลาย
  | 'vocational'       // อาชีวศึกษา / ปวช. / ปวส.
  | 'university'       // อุดมศึกษา / มหาวิทยาลัย
  | 'general';         // บุคคลทั่วไป / ทุกระดับ

export interface KnowledgeResource {
  id: string;
  title: string;
  description: string;
  category: string;
  educationLevel: EducationLevel;
  mediaType: MediaType;
  url: string;
  storagePath?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorEmail?: string;
  status: 'published' | 'hidden' | 'deleted';
  viewsCount: number;
  likesCount: number;
  reportsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceMediaType: string;
  createdAt: string;
}

export type ReportReason = 
  | 'broken_link'      // ลิงก์เสีย / ไฟล์เปิดไม่ได้
  | 'copyright'        // ละเมิดลิขสิทธิ์
  | 'inappropriate'    // เนื้อหาไม่เหมาะสม / หยาบคาย
  | 'inaccurate'       // ข้อมูลผิดพลาดหรือบิดเบือน
  | 'other';           // อื่นๆ

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reportedBy: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  actionTaken?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'resource' | 'user' | 'report' | 'settings';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  announcement: string;
  announcementActive: boolean;
  categories: CategoryItem[];
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'computer', name: 'คอมพิวเตอร์และเทคโนโลยี', description: 'การเขียนโปรแกรม, AI, ข้อมูล, เน็ตเวิร์ก', icon: 'Cpu', color: 'from-blue-500 to-indigo-600' },
  { id: 'science', name: 'วิทยาศาสตร์และฟิสิกส์', description: 'เคมี, ชีววิทยา, ดาราศาสตร์, การทดลอง', icon: 'Atom', color: 'from-emerald-500 to-teal-600' },
  { id: 'math', name: 'คณิตศาสตร์และสถิติ', description: 'พีชคณิต, แคลคูลัส, เรขาคณิต, สถิติวิเคราะห์', icon: 'Calculator', color: 'from-amber-500 to-orange-600' },
  { id: 'thai', name: 'ภาษาไทยและวรรณคดี', description: 'หลักภาษา, วรรณคดี, การเขียนและการสื่อสาร', icon: 'BookOpen', color: 'from-rose-500 to-red-600' },
  { id: 'foreign_lang', name: 'ภาษาต่างประเทศ', description: 'ภาษาอังกฤษ, ภาษาจีน, ภาษาญี่ปุ่น, แกรมม่า', icon: 'Globe', color: 'from-cyan-500 to-blue-600' },
  { id: 'social', name: 'สังคมศึกษาและประวัติศาสตร์', description: 'ภูมิศาสตร์, หน้าที่พลเมือง, ประวัติศาสตร์, เศรษฐศาสตร์', icon: 'Landmark', color: 'from-purple-500 to-violet-600' },
  { id: 'arts', name: 'ศิลปะ ดนตรี และการออกแบบ', description: 'ทัศนศิลป์, ดนตรีสากล/ไทย, กราฟิกดีไซน์', icon: 'Palette', color: 'from-pink-500 to-rose-600' },
  { id: 'general', name: 'ความรู้ทั่วไปและทักษะชีวิต', description: 'การเงินส่วนบุคคล, เทคนิคการเรียน, การสอบ', icon: 'Sparkles', color: 'from-sky-500 to-indigo-600' },
];

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primary: 'ประถมศึกษา (ป.1 - ป.6)',
  secondary_early: 'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  secondary_late: 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  vocational: 'อาชีวศึกษา (ปวช. / ปวส.)',
  university: 'อุดมศึกษา / มหาวิทยาลัย',
  general: 'บุคคลทั่วไป / ทุกระดับชั้น',
};

export const MEDIA_TYPE_LABELS: Record<MediaType, { label: string; icon: string }> = {
  pdf: { label: 'PDF / เอกสาร', icon: 'FileText' },
  video: { label: 'วิดีโอคลิป / YouTube', icon: 'Video' },
  website: { label: 'เว็บไซต์ / สื่อออนไลน์', icon: 'Globe' },
  slide: { label: 'สไลด์นำเสนอ / PPT', icon: 'Presentation' },
  code: { label: 'คลังโค้ด / โปรเจกต์', icon: 'Code' },
  image: { label: 'ภาพสรุป / อินโฟกราฟิก', icon: 'Image' },
  other: { label: 'อื่นๆ', icon: 'Folder' },
};
