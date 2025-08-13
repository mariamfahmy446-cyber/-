import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MusicIcon, ImageIcon, TheaterMasksIcon, GamepadIcon, SunIcon, AwardIcon, ArrowLeftIcon } from '../components/Icons';

const activities = [
    { name: 'الكورال', link: '/app/activities/choir', Icon: MusicIcon, description: 'ألحان وترانيم ومتابعة فريق الكورال.', color: 'bg-red-500' },
    { name: 'المسرح', link: '/app/activities/theater', Icon: TheaterMasksIcon, description: 'فرق التمثيل والاسكتشات والمسرحيات.', color: 'bg-purple-500' },
    { name: 'وسائل الإيضاح', link: '/app/activities/teaching-aids', Icon: ImageIcon, description: 'صور وفيديوهات وملفات مساعدة للدروس.', color: 'bg-yellow-500' },
    { name: 'الألعاب', link: '/app/activities/games', Icon: GamepadIcon, description: 'ألعاب حركية وذهنية لتنمية المهارات.', color: 'bg-green-500' },
    { name: 'الكشافة', link: '/app/activities/scouts', Icon: AwardIcon, description: 'الفرق الكشفية والتدريبات والأنشطة.', color: 'bg-orange-500' },
    { name: 'أنشطة الصيف', link: '/app/activities/summer', Icon: SunIcon, description: 'مهرجان الكرازة والأنشطة الترفيهية والدينية.', color: 'bg-blue-500' },
];

const ActivitiesPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app/dashboard', { replace: true });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">الأنشطة</h1>
                    <p className="text-slate-500 mt-1">إدارة الأنشطة المختلفة للخدمة.</p>
                </div>
                 <button
                    onClick={handleBack}
                    className="btn btn-secondary"
                 >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activities.map(activity => (
                    <ActivityCard 
                        key={activity.name}
                        name={activity.name}
                        link={activity.link}
                        Icon={activity.Icon}
                        description={activity.description}
                        color={activity.color}
                    />
                ))}
            </div>
        </div>
    );
}

interface ActivityCardProps {
    name: string;
    link: string;
    Icon: React.ElementType;
    description: string;
    color: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ name, link, Icon, description, color }) => (
    <Link to={link} className="group block bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start">
            <div className={`p-4 rounded-lg text-white ${color}`}>
                <Icon className="w-8 h-8"/>
            </div>
        </div>
        <div className="mt-4">
            <h2 className="text-xl font-bold text-slate-800">{name}</h2>
            <p className="text-slate-500 mt-1 text-sm">{description}</p>
        </div>
    </Link>
);


export default ActivitiesPage;