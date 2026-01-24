import React from 'react';
import { Outlet } from 'react-router-dom';
import { ClientBottomNav } from './ClientBottomNav';

export const ClientLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main>
        <Outlet />
      </main>
      <ClientBottomNav />
    </div>
  );
};
