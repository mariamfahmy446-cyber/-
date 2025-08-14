

import type { Child, Settings, Class, EducationLevel, Hymn, PointsSettings, Servant, User } from './types';

export const INITIAL_LEVELS: EducationLevel[] = [
  {
    id: 'level-nursery',
    name: 'مرحلة حضانة',
    sections: [],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
  },
  {
    id: 'level-primary',
    name: 'المرحلة الابتدائية',
    sections: [],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
  },
  {
    id: 'level-preparatory',
    name: 'المرحلة الاعدادية',
    sections: ['اولى اعدادى', 'ثانية اعدادى', 'ثالثة اعدادى'],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
    divisions: [
        { type: 'boys', name: 'بنين', generalSecretary: { name: '', phone: '', email: '' }, assistantSecretary: { name: '', phone: '', email: '' }, logo: '', responsiblePriest: '' },
        { type: 'girls', name: 'بنات', generalSecretary: { name: '', phone: '', email: '' }, assistantSecretary: { name: '', phone: '', email: '' }, logo: '', responsiblePriest: '' }
    ]
  },
  {
    id: 'level-secondary',
    name: 'المرحلة الثانوية',
    sections: ['اولى ثانوى', 'ثانية ثانوى', 'ثالثة ثانوى'],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
    divisions: [
        { type: 'boys', name: 'بنين', generalSecretary: { name: '', phone: '', email: '' }, assistantSecretary: { name: '', phone: '', email: '' }, logo: '', responsiblePriest: '' },
        { type: 'girls', name: 'بنات', generalSecretary: { name: '', phone: '', email: '' }, assistantSecretary: { name: '', phone: '', email: '' }, logo: '', responsiblePriest: '' }
    ]
  },
  {
    id: 'level-university',
    name: 'مرحلة جامعة',
    sections: [],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
  },
  {
    id: 'level-graduates',
    name: 'مرحلة خرجيين',
    sections: [],
    generalSecretary: { name: '', phone: '', email: '' },
    assistantSecretary: { name: '', phone: '', email: '' },
    logo: '',
    responsiblePriest: '',
  },
];


export const INITIAL_SERVANTS: Servant[] = [
    { id: 'servant-admin-1', name: 'مريم فهمي', phone: '01000000000', serviceAssignments: [] },
    { id: 'servant-1', name: 'أ/ منى', phone: '01012345678', email: 'mona@example.com', address: '1 شارع الكنيسة', notes: 'مسؤولة فصل الأمل', image: 'https://i.pravatar.cc/150?u=servant-1', birthDate: '1990-05-15', age: 34, confessionFather: 'أبونا مرقس', maritalStatus: 'married', professionalStatus: 'working', jobTitle: 'معلمة', workplace: 'مدرسة النهضة', college: '', professionalStatusNotes: '' },
    { id: 'servant-2', name: 'أ/ سلمى', phone: '01111111111', email: 'salma@example.com', address: '2 شارع المدرسة', notes: '', image: 'https://i.pravatar.cc/150?u=servant-2', birthDate: '1995-02-20', age: 29, confessionFather: 'أبونا بطرس', maritalStatus: 'engaged', professionalStatus: 'working', jobTitle: 'مهندسة', workplace: 'شركة النور', college: '', professionalStatusNotes: '' },
    { id: 'servant-3', name: 'أ/ هبة', phone: '01123456789', email: 'heba@example.com', address: '3 شارع المحطة', notes: '', image: 'https://i.pravatar.cc/150?u=servant-3', birthDate: '2001-10-10', age: 22, confessionFather: 'أبونا بولس', maritalStatus: 'single', professionalStatus: 'student', jobTitle: '', workplace: '', college: 'كلية الآداب', professionalStatusNotes: '' },
    { id: 'servant-4', name: 'أ/ جورج', phone: '01222222222', email: 'george@example.com', address: '4 شارع النادي', notes: 'خادم جديد', image: 'https://i.pravatar.cc/150?u=servant-4', birthDate: '1998-08-01', age: 25, confessionFather: 'أبونا مينا', maritalStatus: 'single', professionalStatus: 'not_working', jobTitle: '', workplace: '', college: '', professionalStatusNotes: '' },
    { id: 'servant-priest-younis', name: 'ابونا يؤنس', phone: '01200000001', image: 'https://i.pravatar.cc/150?u=servant-priest-younis' },
    { id: 'servant-priest-karas', name: 'ابونا كاراس', phone: '01200000002', image: 'https://i.pravatar.cc/150?u=servant-priest-karas' },
    { id: 'servant-priest-bmwa', name: 'ابونا بموا', phone: '01200000003', image: 'https://i.pravatar.cc/150?u=servant-priest-bmwa' },
    { id: 'servant-priest-tawadros', name: 'ابونا تواضروس', phone: '01200000004', image: 'https://i.pravatar.cc/150?u=servant-priest-tawadros' },
];

const PRIMARY_GRADES = ['الصف الاول', 'الصف الثانى', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];
const primaryClasses: Class[] = [];
PRIMARY_GRADES.forEach((grade, index) => {
    // Boys
    primaryClasses.push({
        id: `class-primary-${index + 1}-boys`,
        level_id: 'level-primary',
        grade: grade,
        name: `${grade}`,
        supervisorName: '',
        servantNames: [],
    });
    // Girls
    primaryClasses.push({
        id: `class-primary-${index + 1}-girls`,
        level_id: 'level-primary',
        grade: grade,
        name: `${grade}`,
        supervisorName: '',
        servantNames: [],
    });
});

const PREP_GRADES = ['اولى اعدادى', 'ثانية اعدادى', 'ثالثة اعدادى'];
const prepClasses: Class[] = [];
PREP_GRADES.forEach((grade, index) => {
    // Boys
    prepClasses.push({
        id: `class-prep-${index + 1}-boys`,
        level_id: 'level-preparatory',
        grade: grade,
        name: `${grade} بنين`,
        supervisorName: '',
        servantNames: [],
    });
    // Girls
    prepClasses.push({
        id: `class-prep-${index + 1}-girls`,
        level_id: 'level-preparatory',
        grade: grade,
        name: `${grade} بنات`,
        supervisorName: '',
        servantNames: [],
    });
});

const SECONDARY_GRADES = ['اولى ثانوى', 'ثانية ثانوى', 'ثالثة ثانوى'];
const secondaryClasses: Class[] = [];
SECONDARY_GRADES.forEach((grade, index) => {
    // Boys
    secondaryClasses.push({
        id: `class-secondary-${index + 1}-boys`,
        level_id: 'level-secondary',
        grade: grade,
        name: `${grade} بنين`,
        supervisorName: '',
        servantNames: [],
    });
    // Girls
    secondaryClasses.push({
        id: `class-secondary-${index + 1}-girls`,
        level_id: 'level-secondary',
        grade: grade,
        name: `${grade} بنات`,
        supervisorName: '',
        servantNames: [],
    });
});

export const INITIAL_CLASSES: Class[] = [
    ...primaryClasses,
    ...prepClasses,
    ...secondaryClasses,
    { id: 'level-nursery-main', level_id: 'level-nursery', grade: 'حضانة', name: 'الفصل العام', supervisorName: '', servantNames: [] },
    { id: 'level-university-main', level_id: 'level-university', grade: 'جامعة', name: 'الفصل العام', supervisorName: '', servantNames: [] },
    { id: 'level-graduates-main', level_id: 'level-graduates', grade: 'خريجين', name: 'الفصل العام', supervisorName: '', servantNames: [] },
];

export const INITIAL_CHILDREN: Child[] = [];

export const INITIAL_SETTINGS: Settings = {
  churchName: 'كاتدرائية السيدة العذراء والشهيد مارمينا العجايبى',
  darkMode: false,
  schoolLogo: '',
  churchLogo: '',
  cardLogo: '',
  cardBackground: '',
  cardBackgroundStyle: 'color',
  cardBackgroundColor: '#ffffff',
  enableSounds: true,
  enableVibrations: true,
  enablePopups: true,
};

export const INITIAL_HYMNS: Hymn[] = [
];

export const INITIAL_POINTS_SETTINGS: PointsSettings = {
  attendance: 10,
  lateWithExcuse: 5,
  prayer: 5,
  psalm: 15,
  behavior: 5,
  scarf: 5,
};

export const INITIAL_USERS: User[] = [
  { id: 'user-1', username: 'mariamfahmy', password: '123456', displayName: 'مريم فهمي', nationalId: '29908241301363', roles: ['general_secretary'], servantId: 'servant-admin-1' },
  { id: 'priest-younis', username: 'fr.younis', password: 'password', displayName: 'ابونا يؤنس', roles: ['priest'], servantId: 'servant-priest-younis' },
  { id: 'priest-karas', username: 'fr.karas', password: 'password', displayName: 'ابونا كاراس', roles: ['priest'], servantId: 'servant-priest-karas' },
  { id: 'priest-bmwa', username: 'fr.bmwa', password: 'password', displayName: 'ابونا بموا', roles: ['priest'], servantId: 'servant-priest-bmwa' },
  { id: 'priest-tawadros', username: 'fr.tawadros', password: 'password', displayName: 'ابونا تواضروس', roles: ['priest'], servantId: 'servant-priest-tawadros' }
];