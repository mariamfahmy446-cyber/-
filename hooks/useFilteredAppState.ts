
import { useMemo } from 'react';
import type { AppState, Servant, UserRole } from '../types';

const useFilteredAppState = (appState: AppState): AppState => {
    const { currentUser, levels, classes, children, servants, ...rest } = appState;

    const filteredData = useMemo(() => {
        // Admins and priests see everything
        if (!currentUser || currentUser.roles.includes('general_secretary') || currentUser.roles.includes('priest')) {
            return { levels, classes, children, servants };
        }

        let visibleLevelIds = new Set<string>();
        let visibleClassIds = new Set<string>();

        const secretaryRoles: UserRole[] = ['secretary', 'assistant_secretary', 'level_secretary'];
        const hasLevelBasedAccess = secretaryRoles.some(role => currentUser.roles.includes(role));
        
        if (hasLevelBasedAccess && currentUser.levelIds && currentUser.levelIds.length > 0) {
            currentUser.levelIds.forEach(id => visibleLevelIds.add(id));
            classes.forEach(cls => {
                if (visibleLevelIds.has(cls.level_id)) {
                    visibleClassIds.add(cls.id);
                }
            });
        }

        const hasClassBasedAccess = currentUser.roles.includes('servant') || currentUser.roles.includes('class_supervisor');

        if (hasClassBasedAccess) {
             const currentUserServantName = currentUser.displayName;
             classes.forEach(cls => {
                 if (cls.supervisorName === currentUserServantName || (cls.servantNames && cls.servantNames.includes(currentUserServantName))) {
                     visibleClassIds.add(cls.id);
                     if (!visibleLevelIds.has(cls.level_id)) {
                         visibleLevelIds.add(cls.level_id);
                     }
                 }
             });
        }

        const visibleLevels = levels.filter(l => visibleLevelIds.has(l.id));
        const visibleClasses = classes.filter(c => visibleClassIds.has(c.id));
        const visibleChildren = children.filter(c => visibleClassIds.has(c.class_id));

        let visibleServants: Partial<Servant>[];

        if (hasClassBasedAccess) {
            const self = servants.find(s => s.id === currentUser.servantId || s.name === currentUser.displayName);
            visibleServants = self ? [self] : [];
        } else if (hasLevelBasedAccess) {
            const servantNamesInVisibleClasses = new Set<string>();
            visibleClasses.forEach(cls => {
                if (cls.supervisorName) servantNamesInVisibleClasses.add(cls.supervisorName.trim());
                (cls.servantNames || []).forEach(name => servantNamesInVisibleClasses.add(name.trim()));
            });
            const fullVisibleServants = servants.filter(s => servantNamesInVisibleClasses.has(s.name));
            
            visibleServants = fullVisibleServants.map(({ id, name, phone, phone2, image, serviceAssignments }) => ({
                id,
                name,
                phone,
                phone2,
                image,
                serviceAssignments,
            }));
        } else {
            visibleServants = [];
        }


        return {
            levels: visibleLevels,
            classes: visibleClasses,
            children: visibleChildren,
            servants: visibleServants as Servant[],
        };

    }, [currentUser, levels, classes, children, servants]);

    return {
        ...rest,
        currentUser,
        ...filteredData,
    };
};

export default useFilteredAppState;
