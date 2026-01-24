import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.jpeg';

const ProviderDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stats = [
    { icon: <Calendar className="h-6 w-6" />, label: 'Bookings today', value: '0' },
    { icon: <Clock className="h-6 w-6" />, label: 'Pending requests', value: '0' },
    { icon: <CheckCircle className="h-6 w-6" />, label: 'Completed', value: '0' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Link" className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <p className="text-sm text-muted-foreground">{t('home.greeting')}</p>
              <h1 className="font-semibold text-foreground">{user?.name || 'Provider'}</h1>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Stats */}
          <motion.div variants={fadeInUp} className="mb-8 grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-2xl bg-card p-4 text-center card-glow"
              >
                <div className="mb-2 text-primary">{stat.icon}</div>
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Quick actions */}
          <motion.section variants={fadeInUp} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl">
                <Plus className="h-6 w-6" />
                Add Service
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl">
                <Clock className="h-6 w-6" />
                Set Availability
              </Button>
            </div>
          </motion.section>

          {/* Recent bookings */}
          <motion.section variants={fadeInUp}>
            <h2 className="mb-4 text-lg font-semibold text-foreground">{t('nav.requests')}</h2>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No booking requests yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Connect to backend to receive bookings</p>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default ProviderDashboardPage;
