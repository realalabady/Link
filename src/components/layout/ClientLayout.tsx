import React from "react";
import { Outlet } from "react-router-dom";
import { ClientBottomNav } from "./ClientBottomNav";
import { GuestBanner } from "@/components/GuestBanner";

export const ClientLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <GuestBanner />
      <main>
        <Outlet />
      </main>
      <ClientBottomNav />
    </div>
  );
};
