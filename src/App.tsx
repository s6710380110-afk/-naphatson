import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { HeroSection } from './components/HeroSection';
import { CategoryShowcase } from './components/CategoryShowcase';
import { FilterSidebar } from './components/FilterSidebar';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { PostResourceModal } from './components/PostResourceModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { EmptyState } from './components/EmptyState';
import { LoadingGrid } from './components/LoadingSkeleton';
import { Footer } from './components/Footer';
import { Breadcrumbs } from './components/Breadcrumbs';
import { KnowledgeResource, FavoriteItem } from './types';
import { deleteResource, logModerationAction } from './services/resourceService';
import {
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Bookmark,
  GraduationCap,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

// Initial educational resources seed if database is brand new
const INITIAL_SEED_RESOURCES: Omit<KnowledgeResource, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'res_seed_01',
    title: 'คู่มือพื้นฐานการเขียนโปรแกรมด้วยภาษา Python ฉบับเริ่มต้นสำหรับนักเรียน',
    description: 'เอกสารสรุปไวยากรณ์พื้นฐาน Python 3 ตัวแปร โครงสร้างควบคุม if-else ลูปฟังก์ชัน และตัวอย่างโจทย์ฝึกทักษะการคิดเชิงคำนวณ เหมาะสำหรับนักเรียน ม.ต้น-ม.ปลาย และผู้เริ่มต้นศึกษา',
    category: 'computer',
    educationLevel: 'secondary_late',
    mediaType: 'pdf',
    url: 'https://docs.python.org/3/tutorial/',
    tags: ['python', 'coding', 'ม.ปลาย', 'วิทยาการคำนวณ'],
    authorId: 'system_curator',
    authorName: 'อ.พรชัย วิชาการ',
    authorEmail: 'curator@klangpanya.org',
    status: 'published',
    viewsCount: 42,
    likesCount: 15,
    reportsCount: 0
  },
  {
    id: 'res_seed_02',
    title: 'คอร์สติวสรุป ฟิสิกส์ ม.ปลาย: กฎการเคลื่อนที่ของนิวตันและแรงเสียดทาน',
    description: 'วิดีโอบทเรียนอธิบายกฎ 3 ข้อของนิวตัน พร้อมเทคนิคการเขียน Free Body Diagram และการแก้โจทย์ฟิสิกส์สอบเข้ามหาวิทยาลัยอย่างเป็นระบบ อธิบายเข้าใจง่ายพร้อมตัวอย่างจริง',
    category: 'science',
    educationLevel: 'secondary_late',
    mediaType: 'video',
    url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
    tags: ['ฟิสิกส์', 'นิวตัน', 'เตรียมสอบ', 'วิทยาศาสตร์'],
    authorId: 'system_curator',
    authorName: 'ครูสมชาย ฟิสิกส์คลินิก',
    authorEmail: 'somchai@klangpanya.org',
    status: 'published',
    viewsCount: 88,
    likesCount: 34,
    reportsCount: 0
  },
  {
    id: 'res_seed_03',
    title: 'สรุปสูตรคณิตศาสตร์: สถิติและการแจกแจงความน่าจะเป็น',
    description: 'แผ่นสรุปสูตรสถิติ ค่าเฉลี่ยเลขคณิต มัธยฐาน ฐานนิยม ส่วนเบี่ยงเบนมาตรฐาน และการแจกแจงปกติ พร้อมข้อสอบเก่าและแนวคิดลัดสำหรับนักเรียนชั้น ม.6',
    category: 'math',
    educationLevel: 'secondary_late',
    mediaType: 'slide',
    url: 'https://th.wikipedia.org/wiki/%E0%B8%AA%E0%B8%96%E0%B8%B4%E0%B8%95%E0%B8%B4%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%5F',
    tags: ['คณิตศาสตร์', 'สถิติ', 'ม.6', 'A-Level'],
    authorId: 'system_curator',
    authorName: 'ติวเตอร์บิ๊ก',
    authorEmail: 'tutor@klangpanya.org',
    status: 'published',
    viewsCount: 65,
    likesCount: 22,
    reportsCount: 0
  },
  {
    id: 'res_seed_04',
    title: '500 คำศัพท์ภาษาอังกฤษพบบ่อยในข้อสอบ TGAT และ A-Level พร้อมคำเหมือน (Synonyms)',
    description: 'ชุดคำศัพท์แยกตามรากศัพท์ (Roots, Prefixes, Suffixes) ตัวอย่างประโยค และเทคนิคการจำเพื่อทำคะแนนพาร์ท Reading และ Vocabulary ให้ได้คะแนนสูงสุด',
    category: 'foreign_lang',
    educationLevel: 'secondary_late',
    mediaType: 'pdf',
    url: 'https://dictionary.cambridge.org/th/',
    tags: ['ภาษาอังกฤษ', 'TGAT', 'คำศัพท์', 'vocab'],
    authorId: 'system_curator',
    authorName: 'ครูแนน English Corner',
    authorEmail: 'english@klangpanya.org',
    status: 'published',
    viewsCount: 110,
    likesCount: 58,
    reportsCount: 0
  },
  {
    id: 'res_seed_05',
    title: 'โครงงาน Web App จัดการตารางเรียนด้วย React และ Tailwind CSS',
    description: 'ซอร์สโค้ดตัวอย่างโครงงานวิชาคอมพิวเตอร์ระดับมหาวิทยาลัยและ ปวช. มีระบบบันทึกวิชาเรียน การแจ้งเตือนการบ้าน และ UI สไตล์โมเดิร์น',
    category: 'computer',
    educationLevel: 'university',
    mediaType: 'code',
    url: 'https://github.com',
    tags: ['react', 'web-development', 'โครงงาน', 'นักศึกษา'],
    authorId: 'system_curator',
    authorName: 'ทีมนักศึกษาไอที',
    authorEmail: 'devclub@klangpanya.org',
    status: 'published',
    viewsCount: 39,
    likesCount: 19,
    reportsCount: 0
  },
  {
    id: 'res_seed_06',
    title: 'อินโฟกราฟิกสรุปประวัติศาสตร์ไทย: ยุคปฏิรูปการปกครองสมัยรัชกาลที่ 5',
    description: 'ภาพสรุปเข้าใจง่าย ลำดับไทม์ไลน์การปฏิรูประบบราชการ การเลิกทาส และการสร้างทางรถไฟสายแรก เข้าใจบริบทการพัฒนาประเทศอย่างรอบด้าน',
    category: 'social',
    educationLevel: 'secondary_early',
    mediaType: 'image',
    url: 'https://th.wikipedia.org/wiki/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C%E0%B9%84%E0%B8%97%E0%B8%A2',
    tags: ['ประวัติศาสตร์', 'สังคมศึกษา', 'ม.ต้น', 'สรุปบทเรียน'],
    authorId: 'system_curator',
    authorName: 'ครูปิ่น สังคมหรรษา',
    authorEmail: 'pin@klangpanya.org',
    status: 'published',
    viewsCount: 54,
    likesCount: 20,
    reportsCount: 0
  }
];

const MainApp: React.FC = () => {
  const { user, userProfile, isModerator } = useAuth();
  const { categories } = useSettings();
  const { success, error, warning } = useToast();

  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'explore' | 'favorites' | 'my-resources' | 'admin'>('home');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'likes'>('newest');

  // Data states
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(1);
  const [loadingResources, setLoadingResources] = useState(true);

  // Modals state
  const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(null);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingResource, setReportingResource] = useState<KnowledgeResource | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Delete confirmation
  const [resourceToDelete, setResourceToDelete] = useState<KnowledgeResource | null>(null);

  // Listen to Firestore resources
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          // If Firestore resources is totally empty, seed initial verified educational items
          try {
            const now = new Date().toISOString();
            for (const item of INITIAL_SEED_RESOURCES) {
              await setDoc(doc(db, 'resources', item.id), {
                ...item,
                createdAt: now,
                updatedAt: now
              });
            }
          } catch (e) {
            console.warn('Initial resource seed note:', e);
          }
        } else {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as KnowledgeResource));
          setResources(list);
        }
        setLoadingResources(false);
      },
      (err) => {
        console.error('Resources onSnapshot error:', err);
        setLoadingResources(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to user favorites if signed in
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const favs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FavoriteItem));
        setFavorites(favs);
      },
      (err) => {
        console.error('Favorites onSnapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Count total members
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setTotalUsersCount(Math.max(snap.size, 1));
      },
      (e) => console.debug('Users count note:', e)
    );
    return () => unsubscribe();
  }, []);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const res of resources) {
      if (res.status === 'published') {
        counts[res.category] = (counts[res.category] || 0) + 1;
      }
    }
    return counts;
  }, [resources]);

  // Filtered and sorted resources list
  const filteredResources = useMemo(() => {
    let list = resources.filter((r) => {
      // In normal view, only show published resources unless viewed by owner or moderator in admin
      if (currentView === 'my-resources') {
        return user && r.authorId === user.uid;
      }
      if (currentView === 'favorites') {
        const favIds = new Set(favorites.map((f) => f.resourceId));
        return favIds.has(r.id) && r.status === 'published';
      }
      return r.status === 'published';
    });

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((r) => r.category === selectedCategory);
    }

    // Education Level filter
    if (selectedLevel !== 'all') {
      list = list.filter((r) => r.educationLevel === selectedLevel);
    }

    // Media Type filter
    if (selectedMediaType !== 'all') {
      list = list.filter((r) => r.mediaType === selectedMediaType);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description.toLowerCase().includes(q);
        const inTags = r.tags?.some((t) => t.toLowerCase().includes(q));
        const inAuthor = r.authorName.toLowerCase().includes(q);
        return inTitle || inDesc || inTags || inAuthor;
      });
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (sortBy === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [resources, favorites, currentView, selectedCategory, selectedLevel, selectedMediaType, searchQuery, sortBy, user]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectCategoryFromHeroOrCard = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentView('explore');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedMediaType('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleDeleteResource = async (res: KnowledgeResource) => {
    try {
      await deleteResource(res.id);
      if (user) {
        await logModerationAction(
          user.uid,
          user.email || '',
          'delete_own_resource',
          'resource',
          res.id,
          `ผู้ใช้ลบสื่อของตนเอง: ${res.title}`
        );
      }
      success('ลบสื่อการเรียนรู้เรียบร้อยแล้ว');
      setResourceToDelete(null);
      if (selectedResource?.id === res.id) setSelectedResource(null);
    } catch (err: any) {
      error('ไม่สามารถลบสื่อได้', err?.message);
    }
  };

  const getCategoryName = (id: string) => {
    const found = categories.find((c) => c.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={handleOpenAuth}
        onOpenPostModal={() => {
          setEditingResource(null);
          setPostModalOpen(true);
        }}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <AdminDashboard
            onSelectResource={(res) => setSelectedResource(res)}
          />
        )}

        {/* VIEW: HOME, EXPLORE, FAVORITES, MY RESOURCES */}
        {currentView !== 'admin' && (
          <div className="space-y-6">
            
            {/* Hero Section displayed on Home */}
            {currentView === 'home' && (
              <>
                <HeroSection
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSubmit={() => {
                    setCurrentView('explore');
                  }}
                  onSelectCategory={handleSelectCategoryFromHeroOrCard}
                  onOpenPostModal={() => {
                    if (!user) handleOpenAuth('login');
                    else {
                      setEditingResource(null);
                      setPostModalOpen(true);
                    }
                  }}
                  totalResources={resources.filter((r) => r.status === 'published').length}
                  totalMembers={totalUsersCount}
                />

                {/* Category Showcase Section */}
                <CategoryShowcase
                  onSelectCategory={handleSelectCategoryFromHeroOrCard}
                  categoryCounts={categoryCounts}
                />
              </>
            )}

            {/* Breadcrumb Navigation when exploring or in sub-views */}
            {currentView !== 'home' && (
              <div className="pt-3">
                <Breadcrumbs
                  items={[
                    {
                      label:
                        currentView === 'explore'
                          ? 'คลังความรู้ทั้งหมด'
                          : currentView === 'favorites'
                          ? 'รายการโปรดของฉัน'
                          : 'สื่อที่ฉันแบ่งปัน',
                      active: true
                    }
                  ]}
                />
              </div>
            )}

            {/* Title Banner for Sub-views */}
            {currentView === 'favorites' && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      รายการโปรดที่บันทึกไว้ ({filteredResources.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      สื่อการเรียนรู้ที่คุณบันทึกไว้เพื่อกลับมาทบทวนในภายหลัง
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'my-resources' && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      สื่อการเรียนรู้ที่ฉันแบ่งปัน ({filteredResources.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      จัดการ แก้ไข หรืออัปเดตสื่อความรู้ที่คุณได้ร่วมแบ่งปันไว้ในชุมชน
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingResource(null);
                    setPostModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>แบ่งปันสื่อใหม่</span>
                </button>
              </div>
            )}

            {/* Grid Layout: Sidebar Filters + Resource Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column: Filter Sidebar */}
              <div className="lg:col-span-1">
                <FilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  selectedMediaType={selectedMediaType}
                  setSelectedMediaType={setSelectedMediaType}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onReset={handleResetFilters}
                  totalResultsCount={filteredResources.length}
                />
              </div>

              {/* Right Column: Resource Cards Feed */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Search query tag / current filter label */}
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <p>
                    {searchQuery ? (
                      <span>
                        ผลการค้นหาสำหรับ "<strong className="text-blue-600">{searchQuery}</strong>"
                      </span>
                    ) : (
                      <span>
                        แสดงทั้งหมด <strong>{filteredResources.length}</strong> รายการ
                      </span>
                    )}
                  </p>

                  {(selectedCategory !== 'all' || selectedLevel !== 'all' || selectedMediaType !== 'all') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>

                {/* Resource List / Loading / Empty */}
                {loadingResources ? (
                  <LoadingGrid count={6} />
                ) : filteredResources.length === 0 ? (
                  <EmptyState
                    type={currentView === 'favorites' ? 'favorites' : searchQuery ? 'search' : 'category'}
                    actionText={currentView === 'favorites' ? 'ค้นหาคลังความรู้' : 'ร่วมแบ่งปันสื่อแรก'}
                    onAction={() => {
                      if (currentView === 'favorites') {
                        setCurrentView('explore');
                      } else {
                        if (!user) handleOpenAuth('login');
                        else {
                          setEditingResource(null);
                          setPostModalOpen(true);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        categoryName={getCategoryName(resource.category)}
                        onSelect={(r) => setSelectedResource(r)}
                        onEdit={(r) => {
                          setEditingResource(r);
                          setPostModalOpen(true);
                        }}
                        onDelete={(r) => setResourceToDelete(r)}
                        onReport={(r) => {
                          setReportingResource(r);
                          setReportModalOpen(true);
                        }}
                        onRequireAuth={() => handleOpenAuth('login')}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={handleSelectCategoryFromHeroOrCard}
        setCurrentView={(view) => {
          setCurrentView(view as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* MODALS */}

      {/* 1. Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        categoryName={selectedResource ? getCategoryName(selectedResource.category) : ''}
        onClose={() => setSelectedResource(null)}
        onEdit={(r) => {
          setSelectedResource(null);
          setEditingResource(r);
          setPostModalOpen(true);
        }}
        onDelete={(r) => {
          setSelectedResource(null);
          setResourceToDelete(r);
        }}
        onReport={(r) => {
          setReportingResource(r);
          setReportModalOpen(true);
        }}
        onRequireAuth={() => handleOpenAuth('login')}
      />

      {/* 2. Post / Edit Resource Modal */}
      <PostResourceModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setEditingResource(null);
        }}
        editingResource={editingResource}
      />

      {/* 3. Report Resource Modal */}
      <ReportModal
        resource={reportingResource}
        onClose={() => {
          setReportModalOpen(false);
          setReportingResource(null);
        }}
        onRequireAuth={() => handleOpenAuth('login')}
      />

      {/* 4. Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* 5. User Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* 6. Delete Resource Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบสื่อ</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบ "{resourceToDelete.title}" ออกจากคลังความรู้?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteResource(resourceToDelete)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                ลบสื่อนี้
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <MainApp />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
