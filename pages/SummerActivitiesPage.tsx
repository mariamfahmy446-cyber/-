import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ToyBrickIcon, BookOpenIcon, AwardIcon } from '../components/Icons';

const summerActivities = [
    { name: 'أنشطة ترفيهية', link: '/app/activities/summer/recreational', Icon: ToyBrickIcon, description: 'رحلات، أيام رياضية، وأنشطة ممتعة.', color: 'bg-teal-500' },
    { name: 'أنشطة دينية', link: '/app/activities/summer/religious', Icon: BookOpenIcon, description: 'مسابقات دينية، دراسات، وأيام روحية.', color: 'bg-sky-500' },
    { name: 'مهرجان الكرازة', link: '/app/activities/summer/keraza', Icon: AwardIcon, description: 'متابعة مسابقات مهرجان الكرازة المرقسية.', color: 'bg-amber-500' },
];

const SummerActivitiesPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app/activities', { replace: true });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">أنشطة الصيف</h1>
                    <p className="text-slate-500 mt-1">اختر نوع النشاط الصيفي لعرض التفاصيل.</p>
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
                {summerActivities.map(activity => (
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

export default SummerActivitiesPage;