import React from "react";
import { Outlet } from "react-router-dom";
import { ProviderBottomNav } from "./ProviderBottomNav";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { GuestBanner } from "@/components/GuestBanner";

export const ProviderLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <GuestBanner />
      <SubscriptionBanner />
      <main>
        <Outlet />
      </main>
      <ProviderBottomNav />
    </div>
  );
};
