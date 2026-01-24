import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logo from '@/assets/logo.jpeg';

const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUserRole, user } = useAuth();

  const handleRoleSelect = async (role: 'CLIENT' | 'PROVIDER') => {
    await setUserRole(role);
    if (role === 'CLIENT') {
      navigate('/client');
    } else {
      navigate('/provider');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="w-full max-w-lg text-center"
        >
          {/* Logo */}
          <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
            <img src={logo} alt="Link" className="h-20 w-20 rounded-2xl object-cover" />
          </motion.div>

          {/* Welcome message */}
          <motion.div variants={fadeInUp} className="mb-2">
            <p className="text-lg text-muted-foreground">
              {t('home.greeting')}, {user?.name || 'there'}!
            </p>
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeInUp} className="mb-10 text-2xl font-bold text-foreground md:text-3xl">
            {t('onboarding.chooseRole')}
          </motion.h1>

          {/* Role cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Client card */}
            <motion.button
              variants={fadeInUp}
              onClick={() => handleRoleSelect('CLIENT')}
              className="group flex flex-col items-center rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg card-glow"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                {t('onboarding.roleClient')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.clientDescription')}
              </p>
            </motion.button>

            {/* Provider card */}
            <motion.button
              variants={fadeInUp}
              onClick={() => handleRoleSelect('PROVIDER')}
              className="group flex flex-col items-center rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg card-glow"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                {t('onboarding.roleProvider')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.providerDescription')}
              </p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
