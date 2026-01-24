import React from 'react';
import { useTranslation } from 'react-i18next';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-muted" />
      <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
};

// Client placeholders
export const ClientSearchPage = () => <PlaceholderPage title="Search" />;
export const ClientBookingsPage = () => <PlaceholderPage title="Bookings" />;
export const ClientChatsPage = () => <PlaceholderPage title="Chats" />;
export const ClientProfilePage = () => <PlaceholderPage title="Profile" />;

// Provider placeholders
export const ProviderServicesPage = () => <PlaceholderPage title="My Services" />;
export const ProviderSchedulePage = () => <PlaceholderPage title="Schedule" />;
export const ProviderChatsPage = () => <PlaceholderPage title="Chats" />;
export const ProviderWalletPage = () => <PlaceholderPage title="Wallet" />;

// Admin placeholders
export const AdminUsersPage = () => <PlaceholderPage title="Users Management" />;
export const AdminVerificationsPage = () => <PlaceholderPage title="Verifications" />;
export const AdminPayoutsPage = () => <PlaceholderPage title="Payouts" />;
