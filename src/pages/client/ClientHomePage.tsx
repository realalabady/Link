import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.jpeg';

// Mock categories for display
const mockCategories = [
  { id: '1', nameEn: 'Beauty', nameAr: 'الجمال', icon: '💄' },
  { id: '2', nameEn: 'Hair', nameAr: 'الشعر', icon: '💇‍♀️' },
  { id: '3', nameEn: 'Nails', nameAr: 'الأظافر', icon: '💅' },
  { id: '4', nameEn: 'Massage', nameAr: 'المساج', icon: '💆‍♀️' },
  { id: '5', nameEn: 'Fitness', nameAr: 'اللياقة', icon: '🏋️‍♀️' },
  { id: '6', nameEn: 'Photography', nameAr: 'التصوير', icon: '📷' },
];

const ClientHomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === 'ar';

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Link" className="h-10 w-10 rounded-lg object-cover" />
            <div>
              <p className="text-sm text-muted-foreground">{t('home.greeting')}</p>
              <h1 className="font-semibold text-foreground">{user?.name || 'Guest'}</h1>
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
          {/* Search */}
          <motion.div variants={fadeInUp} className="relative mb-8">
            <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('common.search') + '...'}
              className="h-14 rounded-2xl border-2 ps-12 text-lg"
            />
          </motion.div>

          {/* Categories */}
          <motion.section variants={fadeInUp} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t('home.categories')}</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                {t('common.seeAll')}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {mockCategories.map((category) => (
                <button
                  key={category.id}
                  className="flex flex-col items-center rounded-2xl bg-card p-4 transition-all hover:bg-accent card-glow"
                >
                  <span className="mb-2 text-3xl">{category.icon}</span>
                  <span className="text-sm font-medium text-card-foreground">
                    {isArabic ? category.nameAr : category.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </motion.section>

          {/* Featured Providers */}
          <motion.section variants={fadeInUp}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                <Sparkles className="me-2 inline h-5 w-5 text-primary" />
                {t('home.featuredProviders')}
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                {t('common.seeAll')}
              </Button>
            </div>
            
            {/* Empty state */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t('common.noResults')}</p>
              <p className="mt-1 text-sm text-muted-foreground">Connect to backend to see providers</p>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientHomePage;
