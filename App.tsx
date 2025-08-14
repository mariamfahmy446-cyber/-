import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import useLocalStorage from './hooks/useLocalStorage';
import type { Child, Settings, Class, EducationLevel, Hymn, AttendanceRecord, PointsSettings, Servant, SyllabusItem, ClassMaterial, LessonAid, User, AppState, NotificationItem } from './types';
import { INITIAL_CHILDREN, INITIAL_SETTINGS, INITIAL_CLASSES, INITIAL_LEVELS, INITIAL_HYMNS, INITIAL_POINTS_SETTINGS, INITIAL_SERVANTS, INITIAL_USERS } from './constants';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddEditChild from './pages/AddEditChild';
import SettingsPage from './pages/Settings';
import LandingPage from './pages/LandingPage';
import ClassDetails from './pages/ClassDetails';
import Attendance from './pages/Attendance';
import ClassAttendance from './pages/ClassAttendance';
import PlaceholderPage from './pages/PlaceholderPage';
import SchedulePage from './pages/SchedulePage';
import AttendanceHistory from './pages/AttendanceHistory';
import PointsSettingsPage from './pages/PointsSettings';
import LevelDetailsPage from './pages/LevelDetailsPage';
import LevelServantsPage from './pages/LevelServantsPage';
import AddEditServant from './pages/AddEditServant';
import AddEditLevel from './pages/AddEditLevel';
import ClassFullDetails from './pages/ClassFullDetails';
import ChildrenCardsPage from './pages/ChildrenCardsPage';
import ChildCardPage from './pages/ChildCardPage';
import ClassSyllabusPage from './pages/ClassSyllabusPage';
import HymnsPage from './pages/HymnsPage';
import LessonDetailsPage from './pages/LessonDetailsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import SummerActivitiesPage from './pages/SummerActivitiesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServantProfilePage from './pages/ServantProfilePage';
import ReportsPage from './pages/Reports';
import ClassesAndLevels from './pages/ClassesAndLevels';
import { ArrowLeftIcon, ClipboardCheckIcon, BookOpenIcon, CheckIcon, UserPlusIcon, BellIcon, LogInIcon } from './components/Icons';
import HomePage from './pages/HomePage';
import EditLevelSubgroupPage from './pages/EditLevelSubgroupPage';
import WelcomeModal from './components/WelcomeModal';
import useFilteredAppState from './hooks/useFilteredAppState';
import AdministrativesPage from './pages/Administratives';
import { playSound, playVibration } from './utils/audio';


interface OutletContextType {
  appState: AppState;
}

const MainAppLayout: React.FC<{
    appState: AppState;
    handleLogout: () => void;
}> = ({ appState, handleLogout }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = appState;

    useEffect(() => {
        // If profile is not complete, force user to their profile page.
        if (currentUser && !currentUser.profileComplete) {
            const targetPath = `/app/servant/${currentUser.servantId}`;
            if (location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
        }
    }, [currentUser, location.pathname, navigate]);

    // Render a simplified layout during profile completion.
    if (currentUser && !currentUser.profileComplete) {
        return (
            <div className="bg-slate-50 min-h-screen">
                 <main className="p-4 md:p-6 lg:p-8">
                    <div key={location.pathname} className="animate-fade-in-content">
                        <Outlet context={{ appState }} />
                    </div>
                 </main>
            </div>
        );
    }


    return (
        <div className="flex flex-col h-screen">
          <Header 
            settings={appState.settings} 
            language={appState.language} 
            notifications={appState.notifications}
            setNotifications={appState.setNotifications}
            currentUser={appState.currentUser}
            onLogout={handleLogout}
          />
          <div className="flex flex-1 overflow-hidden">
             <Sidebar 
                classes={appState.classes} 
                levels={appState.levels} 
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                currentUser={appState.currentUser}
             />
             <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50">
                <div key={location.pathname} className="animate-fade-in-content">
                    <Outlet context={{ appState }} />
                </div>
             </main>
          </div>
        </div>
    );
}

const ProtectedRoute: React.FC<{ currentUser: User | null; children: React.ReactElement }> = ({ currentUser, children }) => {
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return children;
};


function App() {
  const [levels, setLevels] = useLocalStorage<EducationLevel[]>('educationLevels_reverted', INITIAL_LEVELS);
  const [classes, setClasses] = useLocalStorage<Class[]>('classes_reverted', INITIAL_CLASSES);
  const [children, setChildren] = useLocalStorage<Child[]>('childrenList_reverted', INITIAL_CHILDREN);
  const [servants, setServants] = useLocalStorage<Servant[]>('servants_reverted', INITIAL_SERVANTS);
  const [settings, setSettings] = useLocalStorage<Settings>('appSettings_reverted', INITIAL_SETTINGS);
  const [hymns, setHymns] = useLocalStorage<Hymn[]>('hymns_reverted_v2', INITIAL_HYMNS);
  const [attendanceHistory, setAttendanceHistory] = useLocalStorage<AttendanceRecord[]>('attendanceHistory_reverted', []);
  const [pointsSettings, setPointsSettings] = useLocalStorage<Record<string, PointsSettings>>('pointsSettings_reverted', {});
  const [syllabus, setSyllabus] = useLocalStorage<SyllabusItem[]>('syllabus_reverted', []);
  const [classMaterials, setClassMaterials] = useLocalStorage<ClassMaterial[]>('classMaterials_reverted', []);
  const [lessonAids, setLessonAids] = useLocalStorage<LessonAid[]>('lessonAids_reverted', []);
  const [language, setLanguage] = useLocalStorage<string>('appLanguage_reverted', 'ar');
  const [users, setUsers] = useLocalStorage<User[]>('users_reverted', INITIAL_USERS);
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>('appNotifications_reverted', []);
  
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser_v3', null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const handleLogin = (username: string, password: string): { success: boolean; message: string } => {
    const user = users.find(u => (u.username === username || u.nationalId === username));
    if (!user) {
        return { success: false, message: 'اسم المستخدم أو الرقم القومي غير مسجل.' };
    }
    if (user.password !== password) {
        return { success: false, message: 'كلمة المرور غير صحيحة.' };
    }
    
    // Send login notification to site admin
    const SUPER_ADMIN_NATIONAL_ID = '29908241301363';
    const siteAdmin = users.find(u => u.nationalId === SUPER_ADMIN_NATIONAL_ID);

    if (siteAdmin && siteAdmin.id !== user.id) {
        const newNotification: NotificationItem = {
            id: Date.now(),
            text: `قام المستخدم "${user.displayName}" بتسجيل الدخول.`,
            time: new Date().toLocaleTimeString('ar-EG'),
            read: false,
            icon: LogInIcon,
            targetUserId: siteAdmin.id,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }

    setCurrentUser(user);
    if (user.profileComplete) {
        setShowWelcomeModal(true);
    }
    return { success: true, message: 'تم تسجيل الدخول بنجاح.' };
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleRegister = (displayName: string, nationalId: string, password: string): { success: boolean; message: string } => {
    if (users.some(u => u.nationalId === nationalId && u.nationalId)) {
        const SUPER_ADMIN_NATIONAL_ID = '29908241301363';
        const generalSecretary = users.find(u => u.nationalId === SUPER_ADMIN_NATIONAL_ID);

        if (generalSecretary) {
            const newNotification: NotificationItem = {
                id: Date.now(),
                text: `تنبيه: محاولة تسجيل مستخدم برقم قومي مُسجل بالفعل (${nationalId}).`,
                time: new Date().toLocaleTimeString('ar-EG'),
                read: false,
                icon: UserPlusIcon,
                targetUserId: generalSecretary.id,
            };
            setNotifications(prev => [newNotification, ...prev]);
        }
        return { success: false, message: 'هذا الرقم القومى مسجل بالفعل. تم إبلاغ الإدارة بذلك.' };
    }

    const newServantId = `servant-${Date.now()}`;
    const newServant: Servant = {
      id: newServantId,
      name: displayName,
      phone: '',
      email: '',
      address: '',
      notes: 'ملف شخصي جديد, يحتاج إلى استكمال البيانات.',
      serviceAssignments: [],
    };
    setServants(prev => [...prev, newServant]);

    const newUser: User = {
        id: `user-${Date.now()}`,
        username: nationalId,
        password: password,
        displayName: displayName,
        nationalId: nationalId,
        roles: ['servant'],
        servantId: newServantId,
        profileComplete: false,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setShowWelcomeModal(true);
    return { success: true, message: 'تم التسجيل بنجاح!' };
  };

  useEffect(() => {
    // Migration for existing users who won't have the `profileComplete` flag.
    setUsers(currentUsers => {
        return currentUsers.map(user => {
            if (user.profileComplete === undefined) {
                // Assume existing users have completed their profiles.
                return { ...user, profileComplete: true };
            }
            return user;
        });
    });
  }, []); 

    // Global click sound effect
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('a, button, [role="button"], input[type="checkbox"], input[type="radio"]')) {
                if (settings.enableSounds) playSound('click');
                if (settings.enableVibrations) playVibration('click');
            }
        };
        document.addEventListener('click', handleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [settings.enableSounds, settings.enableVibrations]);

    // Important notification sound effect
    const prevNotificationsRef = useRef<NotificationItem[]>(notifications);
    useEffect(() => {
        const prevNotifications = prevNotificationsRef.current;
        if (notifications.length > prevNotifications.length) {
            const newNotifications = notifications.slice(prevNotifications.length);
            const hasImportant = newNotifications.some(n => n.isImportant);
            
            if (hasImportant) {
                playSound('special');
                playVibration('special');
            }
        }
        prevNotificationsRef.current = notifications;
    }, [notifications]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#f8fafc';
    
    document.body.style.backgroundImage = 'none';
    
    document.body.classList.add('transition-colors', 'duration-300');
  }, [language]);
  
  const appState: AppState = {
      levels, setLevels,
      classes, setClasses,
      children, setChildren,
      servants, setServants,
      settings, setSettings,
      hymns, setHymns,
      attendanceHistory, setAttendanceHistory,
      pointsSettings, setPointsSettings,
      syllabus, setSyllabus,
      classMaterials, setClassMaterials,
      lessonAids, setLessonAids,
      language, setLanguage,
      users, setUsers,
      currentUser, 
      setCurrentUser,
      notifications, setNotifications,
  }

  const filteredAppState = useFilteredAppState(appState);
  
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  return (
      <div className="text-slate-800">
          {showWelcomeModal && currentUser && currentUser.profileComplete && <WelcomeModal user={currentUser} onClose={handleCloseWelcomeModal} />}
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} settings={settings} currentUser={currentUser} />} />
            <Route path="/register" element={<RegisterPage onRegister={handleRegister} settings={settings} />} />
            
            <Route path="/app/*" element={
              <ProtectedRoute currentUser={currentUser}>
                  <Routes>
                      <Route path="/*" element={<MainAppLayout appState={filteredAppState} handleLogout={handleLogout} />}>
                          <Route index element={<HomePage />} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="class/:classId" element={<ClassDetails />} />
                          <Route path="classes-and-levels" element={<ClassesAndLevels />} />
                          <Route path="class/:classId/cards" element={<ChildrenCardsPage />} />
                          <Route path="child/:childId/card" element={<ChildCardPage />} />
                          <Route path="level/:levelId" element={<LevelDetailsPage />} />
                          <Route path="level/:levelId/servants" element={<LevelServantsPage />} />
                          <Route path="attendance" element={<Attendance />} />
                          <Route path="reports" element={<ReportsPage />} />
                          <Route path="class-attendance/:classId" element={<ClassAttendance />} />
                          <Route path="points-settings" element={<PointsSettingsPage />} />
                          <Route path="attendance-history" element={<AttendanceHistory />} />
                          <Route path="hymns" element={<HymnsPage />} />
                          <Route path="schedule" element={<SchedulePage />} />
                          <Route path="schedule/class/:classId" element={<ClassSyllabusPage />} />
                          <Route path="schedule/lesson/:lessonId" element={<LessonDetailsPage />} />
                          <Route path="activities" element={<ActivitiesPage />} />
                          <Route path="activities/choir" element={<PlaceholderPage title="الكورال" />} />
                          <Route path="activities/theater" element={<PlaceholderPage title="المسرح" />} />
                          <Route path="activities/teaching-aids" element={<PlaceholderPage title="وسائل الإيضاح" />} />
                          <Route path="activities/games" element={<PlaceholderPage title="الألعاب" />} />
                          <Route path="activities/scouts" element={<PlaceholderPage title="الكشافة" />} />
                          <Route path="activities/summer" element={<SummerActivitiesPage />} />
                          <Route path="activities/summer/recreational" element={<PlaceholderPage title="أنشطة ترفيهية" />} />
                          <Route path="activities/summer/religious" element={<PlaceholderPage title="أنشطة دينية" />} />
                          <Route path="activities/summer/keraza" element={<PlaceholderPage title="مهرجان الكرازة" />} />
                          <Route path="administratives" element={<AdministrativesPage />} />
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="settings/class/:classId" element={<ClassFullDetails />} />
                          <Route path="add-level" element={<AddEditLevel />} />
                          <Route path="edit-level/:levelId" element={<AddEditLevel />} />
                          <Route path="edit-level-subgroup/:levelId/:subgroupName" element={<EditLevelSubgroupPage />} />
                          <Route path="add-child" element={<AddEditChild />} />
                          <Route path="add-child/:classId" element={<AddEditChild />} />
                          <Route path="edit-child/:childId" element={<AddEditChild />} />
                          <Route path="add-servant" element={<AddEditServant />} />
                          <Route path="servant/:servantId" element={<AddEditServant />} />
                          <Route path="servant-profile/:servantId" element={<ServantProfilePage />} />
                      </Route>
                  </Routes>
              </ProtectedRoute>
            }/>

            <Route path="*" element={<Navigate to={currentUser ? "/app" : "/login"} replace />} />
          </Routes>
      </div>
  );
}

const AppWrapper: React.FC = () => (
    <HashRouter>
        <App />
    </HashRouter>
);

export default AppWrapper;