import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Search, LogOut, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/queries/useCategories";
import { useServices } from "@/hooks/queries/useServices";
import { useVerifiedProviders } from "@/hooks/queries/useProviders";
import logo from "@/assets/logo.jpeg";

const ClientHomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const { data: services = [], isLoading: loadingServices } = useServices({
    isActive: true,
  });
  const { data: providers = [], isLoading: loadingProviders } =
    useVerifiedProviders(6);

  const categoriesWithServices = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon?: string }>();

    services.forEach((service) => {
      if (!service.categoryId) return;
      if (map.has(service.categoryId)) return;

      const matchedCategory = categories.find(
        (category) => category.id === service.categoryId,
      );
      const nameFromCategory = matchedCategory
        ? isArabic
          ? matchedCategory.nameAr
          : matchedCategory.nameEn
        : "";
      const fallbackName = service.categoryName || service.categoryId;

      map.set(service.categoryId, {
        id: service.categoryId,
        name: nameFromCategory || fallbackName,
        icon: matchedCategory?.icon,
      });
    });

    return Array.from(map.values());
  }, [services, categories, isArabic]);

  const handleLogout = async () => {
    await logout();
  };

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
            <img
              src={logo}
              alt="Link"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("home.greeting")}
              </p>
              <h1 className="font-semibold text-foreground">
                {user?.name || "Guest"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title={t("auth.logout")}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
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
              placeholder={t("common.search") + "..."}
              className="h-14 rounded-2xl border-2 ps-12 text-lg"
            />
          </motion.div>

          {/* Categories */}
          <motion.section variants={fadeInUp} className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {t("home.categories")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate("/client/search")}
              >
                {t("common.seeAll")}
              </Button>
            </div>
            {loadingCategories || loadingServices ? (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : categoriesWithServices.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-muted-foreground">
                {t("home.noCategories")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                {categoriesWithServices.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      navigate(`/client/search?category=${category.id}`)
                    }
                    className="flex flex-col items-center rounded-2xl bg-card p-4 transition-all hover:bg-accent card-glow"
                  >
                    <span className="mb-2 text-3xl">
                      {category.icon || "🎯"}
                    </span>
                    <span className="text-sm font-medium text-card-foreground">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.section>

          {/* Featured Providers */}
          <motion.section variants={fadeInUp}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                <Sparkles className="me-2 inline h-5 w-5 text-primary" />
                {t("home.featuredProviders")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate("/client/search")}
              >
                {t("common.seeAll")}
              </Button>
            </div>

            {loadingProviders ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t("common.noResults")}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.map((provider) => (
                  <button
                    key={provider.uid}
                    onClick={() => navigate(`/client/provider/${provider.uid}`)}
                    className="flex items-start gap-4 rounded-2xl bg-card p-4 text-start transition-all hover:bg-accent card-glow"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
                      👩‍💼
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {provider.displayName || t("provider.provider")}
                        </h3>
                        {provider.isVerified && (
                          <Badge variant="secondary" className="shrink-0">
                            ✓ {t("provider.verified")}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{provider.ratingAvg.toFixed(1)}</span>
                        <span>
                          ({provider.ratingCount} {t("provider.reviews")})
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {provider.city}, {provider.area}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientHomePage;
