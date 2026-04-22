import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CRMLayout = () => {
    const location = useLocation();

    const { t } = useLanguage();

    const isEmployee = location.pathname.startsWith('/app/employee');
    const basePath = isEmployee ? '/app/employee' : '/app/admin';

    const tabs = [
        { name: t('Leads'), path: `${basePath}/leads` },
        { name: t('Deals'), path: `${basePath}/deals` },
        { name: t('Contacts'), path: `${basePath}/contacts` },
        { name: t('Companies'), path: `${basePath}/companies` },
        { name: t('Offers'), path: `${basePath}/offers` },
        { name: t('Invoices'), path: `${basePath}/invoices` },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-10 overflow-x-auto scrollbar-hide">
                <div className="flex px-4 space-x-6 min-w-max">
                    {tabs.map((tab) => {
                        const isActive = location.pathname.startsWith(tab.path);
                        return (
                            <NavLink
                                key={tab.name}
                                to={tab.path}
                                className={`py-4 px-2 whitespace-nowrap border-b-2 font-medium text-sm transition-colors ${isActive
                                    ? 'border-primary-accent text-primary-accent'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span className="notranslate">{tab.name}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
            <div className="flex-1 bg-transparent">
                <Outlet />
            </div>
        </div>
    );
};

export default CRMLayout;
