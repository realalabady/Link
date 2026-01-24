import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, CheckCircle, CreditCard, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: <Users className="h-6 w-6" />, label: 'Total Users', value: '0', color: 'bg-blue-500' },
    { icon: <CheckCircle className="h-6 w-6" />, label: 'Pending Verifications', value: '0', color: 'bg-amber-500' },
    { icon: <CreditCard className="h-6 w-6" />, label: 'Pending Payouts', value: '0', color: 'bg-green-500' },
    { icon: <Activity className="h-6 w-6" />, label: 'Active Bookings', value: '0', color: 'bg-primary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="mb-8 text-3xl font-bold text-foreground">Admin Dashboard</h1>

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg ${stat.color} p-2 text-white`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder content */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect to the backend to manage users, verifications, and payouts.
            This admin dashboard will show real data once Firebase is integrated.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDashboardPage;
