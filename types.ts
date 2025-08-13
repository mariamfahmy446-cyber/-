

export type UserRole = 'general_secretary' | 'assistant_secretary' | 'secretary' | 'level_secretary' | 'class_supervisor' | 'servant' | 'priest';

export interface Secretary {
  name: string;
  phone: string;
  email: string;
}

export interface LevelSubgroup {
  name: string; // e.g., 'مرحلة أولى وتانية'
  secretaryName: string;
  logo: string; // base64
}

export interface LevelDivision {
  type: 'boys' | 'girls';
  name: string;
  generalSecretary: Secretary;
  assistantSecretary: Secretary;
  logo?: string;
  responsiblePriest?: string;
}

export interface EducationLevel {
  id: string;
  name:string;
  sections: string[];
  generalSecretary: Secretary;
  assistantSecretary: Secretary;
  logo?: string;
  responsiblePriest?: string;
  divisions?: LevelDivision[];
  subgroups?: LevelSubgroup[];
}

export interface ServiceAssignment {
  levelId: string;
  classId: string;
}

export interface Servant {
  id:string;
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  notes?: string;
  image?: string; 
  birthDate?: string;
  age?: number;
  confessionFather?: string;
  maritalStatus?: 'single' | 'engaged' | 'married';
  professionalStatus?: 'student' | 'working' | 'not_working' | 'other';
  jobTitle?: string;
  workplace?: string;
  college?: string;
  professionalStatusNotes?: string;
  serviceAssignments?: ServiceAssignment[];
}

export interface Class {
  id: string;
  level_id: string;
  grade: string;
  name: string;
  logo?: string; // base64
  supervisorName: string;
  servantNames: string[];
  cardLogo?: string;
  cardBackground?: string;
  cardBackgroundStyle?: 'color' | 'image';
  cardBackgroundColor?: string;
}

export interface Child {
  id: string;
  class_id: string;
  name: string;
  age: number;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  school: string;
  address: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  siblings: string[];
  confessionFather: string;
  hobbies: string;
  background: string;
  notes: string;
  image?: string; 
}

export interface Settings {
  churchName?: string;
  darkMode: boolean;
  schoolLogo?: string; // base64 string
  churchLogo?: string; // base64 string
  cardLogo?: string; // base64 string
  cardBackground?: string; // base64 string
  cardBackgroundStyle?: 'color' | 'image';
  cardBackgroundColor?: string;
  enableSounds: boolean;
  enableVibrations: boolean;
  enablePopups: boolean;
}

export interface Hymn {
    id: string;
    title: string;
    lyrics: string;
    category: string;
    youtubeUrl?: string;
    file?: {
        name: string;
        data: string; // base64
    };
}

export interface PointsBreakdown {
  classAttendance: number;
  prayerAttendance: number;
  psalmRecitation: number;
  scarf: number;
  behavior: number;
}

export interface AttendanceRecord {
  id: string; // Format: 'classId-YYYY-MM-DD'
  classId: string;
  date: string; // YYYY-MM-DD
  attendanceData: Record<string, { // key is childId
    status: 'present' | 'absent' | 'late';
    entryTime: string | null;
    points: PointsBreakdown;
  }>;
}

export interface PointsSettings {
  attendance: number;
  lateWithExcuse: number;
  prayer: number;
  psalm: number;
  behavior: number;
  scarf: number;
}

export interface SyllabusItem {
  id: string;
  classId: string;
  date: string;
  lessonName: string;
  servantName: string;
  lessonImage?: string; // base64
  storyText?: string;
  storyLinks?: string[];
}

export interface ClassMaterial {
  id: string;
  classId: string;
  type: 'image' | 'file';
  name: string; // base64
  data: string; // base64
}

export interface LessonAid {
    id: string;
    lessonId: string;
    type: 'image' | 'video';
    data: string; // base64 for image, or video file. URL for youtube link.
    title: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  nationalId?: string;
  roles: UserRole[];
  servantId?: string;
  profileComplete?: boolean;
  levelIds?: string[];
}

export interface NotificationItem {
    id: number;
    text: string;
    time: string;
    read: boolean;
    icon: React.ElementType;
    targetUserId?: string;
    isImportant?: boolean;
}

export interface AppState {
  levels: EducationLevel[];
  setLevels: React.Dispatch<React.SetStateAction<EducationLevel[]>>;
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  children: Child[];
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
  servants: Servant[];
  setServants: React.Dispatch<React.SetStateAction<Servant[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  hymns: Hymn[];
  setHymns: React.Dispatch<React.SetStateAction<Hymn[]>>;
  attendanceHistory: AttendanceRecord[];
  setAttendanceHistory: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  pointsSettings: Record<string, PointsSettings>;
  setPointsSettings: React.Dispatch<React.SetStateAction<Record<string, PointsSettings>>>;
  syllabus: SyllabusItem[];
  setSyllabus: React.Dispatch<React.SetStateAction<SyllabusItem[]>>;
  classMaterials: ClassMaterial[];
  setClassMaterials: React.Dispatch<React.SetStateAction<ClassMaterial[]>>;
  lessonAids: LessonAid[];
  setLessonAids: React.Dispatch<React.SetStateAction<LessonAid[]>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}