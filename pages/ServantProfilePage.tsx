
import React, { useMemo } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import type { AppState, Servant, UserRole } from '../types';
import { UserIcon, PhoneIcon, MailIcon, BriefcaseIcon, BookOpenIcon, ArrowLeftIcon, CalendarIcon, FileTextIcon, UsersIcon } from '../components/Icons';

interface OutletContextType {
  appState: AppState;
}

const InfoCard: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-3">
            <Icon className="w-6 h-6 text-blue-500"/>
            <span>{title}</span>
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{label: string, value?: string, icon?: React.ElementType}> = ({ label, value, icon: Icon }) => (
    value ? (
        <div className="flex items-start gap-3">
            {Icon && <Icon className="w-5 h-5 text-slate-400 mt-1 shrink-0"/>}
            <div className="flex-grow">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-md font-semibold text-slate-800 whitespace-pre-wrap">{value}</p>
            </div>
        </div>
    ) : null
);

const ServantProfilePage: React.FC = () => {
    const { appState } = useOutletContext<OutletContextType>();
    const { servants, classes, levels, currentUser } = appState;
    const { servantId } = useParams<{ servantId: string }>();
    const navigate = useNavigate();

    const servant = useMemo(() => servants.find(s => s.id === servantId), [servants, servantId]);
    
    const isSecretary = useMemo(() => {
        if (!currentUser) return false;
        const secretaryRoles: UserRole[] = ['secretary', 'assistant_secretary', 'level_secretary'];
        return secretaryRoles.some(role => currentUser.roles.includes(role));
    }, [currentUser]);

    const handleBack = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate('/app/settings', { replace: true });
        }
    };

    const assignedClasses = useMemo(() => {
        if (!servant) return [];
        return classes
            .filter(c => c.supervisorName === servant.name || (c.servantNames && c.servantNames.includes(servant.name)))
            .map(c => ({
                ...c,
                levelName: levels.find(l => l.id === c.level_id)?.name || 'مرحلة غير معروفة'
            }));
    }, [classes, servant, levels]);
    
    if (isSecretary) {
        return (
            <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg">
                <h3 className="font-bold text-lg">وصول غير مسموح</h3>
                <p>لا تملك الصلاحية لعرض التفاصيل الكاملة للخدام.</p>
            </div>
        );
    }

    if (!servant) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-md">
                <UserIcon className="w-24 h-24 text-red-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">لم يتم العثور على الخادم</h2>
                <p className="text-slate-500 mt-2">قد يكون الرابط غير صحيح أو تم حذف الخادم.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 flex items-center gap-2 text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>
        );
    }
    
    const getMaritalStatusText = (status: Servant['maritalStatus']) => {
        const map = { single: 'أعزب', engaged: 'خاطب', married: 'متزوج' };
        return status ? map[status] : '';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold text-slate-900">ملف الخادم: {servant.name}</h1>
                <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>رجوع</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                        <img 
                            src={servant.image || `https://i.pravatar.cc/150?u=${servant.id}`} 
                            alt={servant.name}
                            className="w-48 h-48 mx-auto rounded-full object-cover border-8 border-slate-100 shadow-sm mb-4"
                        />
                        <h2 className="text-2xl font-extrabold text-slate-800">{servant.name}</h2>
                        {servant.age && <p className="text-slate-500">{servant.age} سنة</p>}
                    </div>
                     <Link to={`/app/servant/${servant.id}`} className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        تعديل بيانات الخادم
                    </Link>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <InfoCard title="معلومات الاتصال" icon={PhoneIcon}>
                        <InfoRow label="رقم الهاتف الأساسي" value={servant.phone} />
                        <InfoRow label="رقم هاتف إضافي" value={servant.phone2} />
                        <InfoRow label="البريد الإلكتروني" value={servant.email} />
                        <InfoRow label="العنوان" value={servant.address} />
                    </InfoCard>

                     <InfoCard title="بيانات روحية وشخصية" icon={UserIcon}>
                        <InfoRow label="تاريخ الميلاد" value={servant.birthDate ? new Date(servant.birthDate).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''} />
                        <InfoRow label="أب الاعتراف" value={servant.confessionFather} />
                        <InfoRow label="الحالة الاجتماعية" value={getMaritalStatusText(servant.maritalStatus)} />
                    </InfoCard>

                    <InfoCard title="الحالة المهنية" icon={BriefcaseIcon}>
                        {servant.professionalStatus === 'working' && (
                            <>
                                <InfoRow label="الوظيفة" value={servant.jobTitle} />
                                <InfoRow label="مكان العمل" value={servant.workplace} />
                            </>
                        )}
                         {servant.professionalStatus === 'student' && (
                            <InfoRow label="الكلية / المدرسة" value={servant.college} />
                        )}
                        {servant.professionalStatus === 'not_working' && <p className="text-slate-600">لا يعمل حالياً.</p>}
                        {servant.professionalStatus === 'other' && <InfoRow label="ملاحظات" value={servant.professionalStatusNotes} />}
                    </InfoCard>

                    <InfoCard title="الخدمات المسجل بها" icon={UsersIcon}>
                        {assignedClasses.length > 0 ? (
                            <ul className="space-y-2">
                                {assignedClasses.map(c => (
                                    <li key={c.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800">{c.levelName}</p>
                                            <p className="text-sm text-slate-600">{c.name}</p>
                                        </div>
                                        <Link to={`/app/class/${c.id}`} className="text-xs text-blue-600 hover:underline">
                                            عرض الفصل
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-center text-slate-500 py-4">هذا الخادم غير مسجل في أي فصول حالياً.</p>
                        )}
                    </InfoCard>

                    {servant.notes && (
                        <InfoCard title="ملاحظات" icon={FileTextIcon}>
                            <p className="text-slate-700">{servant.notes}</p>
                        </InfoCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServantProfilePage;