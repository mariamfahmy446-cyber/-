import type { Child, AppState, Servant, EducationLevel, Class, Settings, User, Hymn, SyllabusItem, ClassMaterial, LessonAid, AttendanceRecord, PointsSettings, LevelSubgroup } from '../types';

// This is a simulated API layer.
// In a real app, these functions would make network requests to a backend.

type AllSetters = Pick<AppState, Extract<keyof AppState, `set${Capitalize<string>}`>>;

// State setters from the main App component, to be initialized once.
let setters: AllSetters | null = null;

const SIMULATED_DELAY = 700;

export const api = {
    initApi: (appStateSetters: AllSetters) => {
        setters = appStateSetters;
    },
    
    // Child Management
    addChild: async (newChildData: Omit<Child, 'id' | 'age'> & { age: number | string }): Promise<Child> => {
        if (!setters?.setChildren) throw new Error("API not initialized for Children");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        
        const newChild: Child = {
            id: Date.now().toString(),
            ...newChildData,
            age: Number(newChildData.age),
        };

        setters.setChildren(prev => [...prev, newChild]);
        return newChild;
    },

    updateChild: async (childId: string, updatedChildData: Omit<Child, 'id' | 'age'> & { age: number | string }): Promise<Child> => {
        if (!setters?.setChildren) throw new Error("API not initialized for Children");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));

        const updatedChild: Child = { 
            id: childId, 
            ...updatedChildData,
            age: Number(updatedChildData.age),
        };
        setters.setChildren(prev => prev.map(c => (c.id === childId ? updatedChild : c)));
        return updatedChild;
    },

    deleteChild: async (childId: string): Promise<{ success: true }> => {
        if (!setters?.setChildren) throw new Error("API not initialized for Children");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        
        setters.setChildren(prev => prev.filter(c => c.id !== childId));
        return { success: true };
    },
    
    // Servant Management
    addServant: async (newServantData: Omit<Servant, 'id'>): Promise<Servant> => {
        if (!setters?.setServants) throw new Error("API not initialized for Servants");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const newServant: Servant = { id: `servant-${Date.now()}`, ...newServantData };
        setters.setServants(prev => [...prev, newServant]);
        return newServant;
    },
    updateServant: async (servantId: string, updatedServantData: Omit<Servant, 'id'>): Promise<Servant> => {
        if (!setters?.setServants) throw new Error("API not initialized for Servants");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const updatedServant: Servant = { id: servantId, ...updatedServantData };
        setters.setServants(prev => prev.map(s => s.id === servantId ? updatedServant : s));
        return updatedServant;
    },
    deleteServant: async (servantId: string): Promise<{ success: true }> => {
        if (!setters?.setServants) throw new Error("API not initialized for Servants");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setServants(prev => prev.filter(s => s.id !== servantId));
        return { success: true };
    },

    // Level Management
    addLevel: async (newLevelData: Omit<EducationLevel, 'id'>): Promise<EducationLevel> => {
        if (!setters?.setLevels) throw new Error("API not initialized for Levels");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const newLevel: EducationLevel = { id: `level-${Date.now()}`, ...newLevelData };
        setters.setLevels(prev => [...prev, newLevel]);
        return newLevel;
    },
    updateLevel: async (levelId: string, updatedLevelData: Partial<EducationLevel>): Promise<EducationLevel> => {
        if (!setters?.setLevels) throw new Error("API not initialized for Levels");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let updatedLevel: EducationLevel | null = null;
        setters.setLevels(prev => prev.map(l => {
            if (l.id === levelId) {
                updatedLevel = { ...l, ...updatedLevelData };
                return updatedLevel;
            }
            return l;
        }));
        if (!updatedLevel) throw new Error("Level not found");
        return updatedLevel;
    },
    deleteLevel: async (levelId: string, associatedClassIds: string[]): Promise<{ success: true }> => {
        if (!setters?.setLevels || !setters.setClasses || !setters.setChildren) throw new Error("API not initialized");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const classIdsToDelete = new Set(associatedClassIds);
        setters.setLevels(prev => prev.filter(l => l.id !== levelId));
        setters.setClasses(prev => prev.filter(c => c.level_id !== levelId));
        setters.setChildren(prev => prev.filter(child => !classIdsToDelete.has(child.class_id)));
        return { success: true };
    },
    updateLevelSubgroup: async (levelId: string, subgroupName: string, subgroupData: { secretaryName: string; logo: string; }): Promise<EducationLevel> => {
        if (!setters?.setLevels) throw new Error("API not initialized for Levels");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let updatedLevel: EducationLevel | null = null;
        setters.setLevels(prev => prev.map(l => {
            if (l.id === levelId) {
                const updatedSubgroups = (l.subgroups || []).map(sg => 
                    sg.name === subgroupName ? { ...sg, ...subgroupData } : sg
                );
                 updatedLevel = { ...l, subgroups: updatedSubgroups };
                 return updatedLevel
            }
            return l;
        }));
        if (!updatedLevel) throw new Error("Level not found for subgroup update");
        return updatedLevel;
    },

    // Class Management
    addClass: async (newClassData: Omit<Class, 'id'>): Promise<Class> => {
        if (!setters?.setClasses) throw new Error("API not initialized for Classes");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const newClass: Class = { id: `class-${Date.now()}`, ...newClassData };
        setters.setClasses(prev => [...prev, newClass]);
        return newClass;
    },
    updateClass: async (classId: string, updatedClassData: Partial<Class>): Promise<Class> => {
        if (!setters?.setClasses) throw new Error("API not initialized for Classes");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let updatedClass: Class | null = null;
        setters.setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                updatedClass = { ...c, ...updatedClassData };
                return updatedClass;
            }
            return c;
        }));
        if (!updatedClass) throw new Error("Class not found");
        return updatedClass;
    },

    // User Management
    updateUser: async (userId: string, updatedUserData: Partial<User>): Promise<User> => {
        if (!setters?.setUsers) throw new Error("API not initialized for Users");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let updatedUser: User | null = null;
        setters.setUsers(prev => prev.map(u => {
            if (u.id === userId) {
                updatedUser = { ...u, ...updatedUserData };
                return updatedUser;
            }
            return u;
        }));
        if (!updatedUser) throw new Error("User not found");
        return updatedUser;
    },
     deleteUser: async (userId: string): Promise<{ success: true }> => {
        if (!setters?.setUsers) throw new Error("API not initialized for Users");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setUsers(prev => prev.filter(u => u.id !== userId));
        return { success: true };
    },

    // Settings
    updateSettings: async (updateAction: React.SetStateAction<Settings>): Promise<void> => {
        if (!setters?.setSettings) throw new Error("API not initialized for Settings");
        await new Promise(resolve => setTimeout(resolve, 50));
        setters.setSettings(updateAction);
    },

    // Hymns
    addHymn: async (newHymnData: Omit<Hymn, 'id'>): Promise<Hymn> => {
        if (!setters?.setHymns) throw new Error("API not initialized for Hymns");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const newHymn: Hymn = { id: Date.now().toString(), ...newHymnData };
        setters.setHymns(prev => [newHymn, ...prev]);
        return newHymn;
    },
    updateHymn: async (hymnId: string, updatedHymnData: Omit<Hymn, 'id'>): Promise<Hymn> => {
        if (!setters?.setHymns) throw new Error("API not initialized for Hymns");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const updatedHymn = { id: hymnId, ...updatedHymnData };
        setters.setHymns(prev => prev.map(h => h.id === hymnId ? updatedHymn : h));
        return updatedHymn;
    },
    deleteHymn: async (hymnId: string): Promise<{ success: true }> => {
        if (!setters?.setHymns) throw new Error("API not initialized for Hymns");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setHymns(prev => prev.filter(h => h.id !== hymnId));
        return { success: true };
    },

    // Attendance
    saveAttendanceRecord: async (record: AttendanceRecord): Promise<AttendanceRecord> => {
        if (!setters?.setAttendanceHistory) throw new Error("API not initialized for Attendance");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setAttendanceHistory(prev => {
            const recordExists = prev.some(r => r.id === record.id);
            if (recordExists) {
                return prev.map(r => r.id === record.id ? record : r);
            }
            return [...prev, record];
        });
        return record;
    },
    
    // Syllabus
    addSyllabusItem: async (newItemData: Omit<SyllabusItem, 'id'>): Promise<SyllabusItem> => {
        if (!setters?.setSyllabus) throw new Error("API not initialized for Syllabus");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        const newItem: SyllabusItem = { id: Date.now().toString(), ...newItemData };
        setters.setSyllabus(prev => [...prev, newItem]);
        return newItem;
    },
    updateSyllabusItem: async (itemId: string, updatedItemData: Partial<SyllabusItem>): Promise<SyllabusItem> => {
        if (!setters?.setSyllabus) throw new Error("API not initialized for Syllabus");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let updatedItem: SyllabusItem | null = null;
        setters.setSyllabus(prev => prev.map(item => {
            if (item.id === itemId) {
                updatedItem = { ...item, ...updatedItemData };
                return updatedItem;
            }
            return item;
        }));
        if (!updatedItem) throw new Error("Syllabus item not found");
        return updatedItem;
    },
     deleteSyllabusItem: async (itemId: string): Promise<{ success: true }> => {
        if (!setters?.setSyllabus) throw new Error("API not initialized for Syllabus");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setSyllabus(prev => prev.filter(item => item.id !== itemId));
        return { success: true };
    },

    // Class Materials
     addClassMaterial: async (newMaterialData: Omit<ClassMaterial, 'id'>): Promise<ClassMaterial> => {
        if (!setters?.setClassMaterials) throw new Error("API not initialized for Class Materials");
        await new Promise(resolve => setTimeout(resolve, 1200)); // Longer for "uploads"
        const newMaterial: ClassMaterial = { id: Date.now().toString(), ...newMaterialData };
        setters.setClassMaterials(prev => [...prev, newMaterial]);
        return newMaterial;
    },
    deleteClassMaterial: async (materialId: string): Promise<{ success: true }> => {
        if (!setters?.setClassMaterials) throw new Error("API not initialized for Class Materials");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setClassMaterials(prev => prev.filter(item => item.id !== materialId));
        return { success: true };
    },

    // Lesson Aids
    addLessonAid: async (newAidData: Omit<LessonAid, 'id'>): Promise<LessonAid> => {
        if (!setters?.setLessonAids) throw new Error("API not initialized for Lesson Aids");
        await new Promise(resolve => setTimeout(resolve, 1200));
        const newAid: LessonAid = { id: Date.now().toString(), ...newAidData };
        setters.setLessonAids(prev => [...prev, newAid]);
        return newAid;
    },
    deleteLessonAid: async (aidId: string): Promise<{ success: true }> => {
        if (!setters?.setLessonAids) throw new Error("API not initialized for Lesson Aids");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        setters.setLessonAids(prev => prev.filter(aid => aid.id !== aidId));
        return { success: true };
    },
    
    // Points Settings
    updatePointsSettings: async (classId: string, newSettings: PointsSettings): Promise<Record<string, PointsSettings>> => {
        if (!setters?.setPointsSettings) throw new Error("API not initialized for Points Settings");
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        let newAllSettings: Record<string, PointsSettings> = {};
        setters.setPointsSettings(prev => {
            newAllSettings = { ...prev, [classId]: newSettings };
            return newAllSettings;
        });
        return newAllSettings;
    },
};
