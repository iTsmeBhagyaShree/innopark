import React from 'react';
import { Outlet } from 'react-router-dom';

const CRMLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <div className="flex-1 bg-transparent">
                <Outlet />
            </div>
        </div>
    );
};

export default CRMLayout;
