import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProviderBottomNav } from './ProviderBottomNav';

export const ProviderLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main>
        <Outlet />
      </main>
      <ProviderBottomNav />
    </div>
  );
};
