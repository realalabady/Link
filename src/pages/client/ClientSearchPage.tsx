import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useCategories } from "@/hooks/queries/useCategories";
import { useServices } from "@/hooks/queries/useServices";
import { useVerifiedProviders } from "@/hooks/queries/useProviders";
import { useAuth } from "@/contexts/AuthContext";
import { Service, ProviderProfile } from "@/types";

const ClientSearchPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isArabic = i18n.language === "ar";
  const { user } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"nearest" | "rating">("nearest");

  // Read category from URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Update URL when category changes
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  // Fetch data
  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const { data: services = [], isLoading: loadingServices } = useServices({
    isActive: true,
  });
  const { data: providers = [], isLoading: loadingProviders } =
    useVerifiedProviders();

  // Create provider lookup map
  const providerMap = useMemo(() => {
    const map: Record<string, ProviderProfile> = {};
    providers.forEach((p) => (map[p.uid] = p));
    return map;
  }, [providers]);

  const storedLocation = useMemo(() => {
    const raw = localStorage.getItem("link_location");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { lat: number; lng: number };
    } catch {
      return null;
    }
  }, []);

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

  const categoryLookup = useMemo(() => {
    const map: Record<string, { name: string; icon?: string }> = {};
    categoriesWithServices.forEach((category) => {
      map[category.id] = { name: category.name, icon: category.icon };
    });
    return map;
  }, [categoriesWithServices]);

  const distanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter services based on search, category, and price
  const filteredServices = useMemo(() => {
    const filtered = services.filter((service) => {
      const matchesSearch =
        !searchQuery ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || service.categoryId === selectedCategory;

      const matchesPrice =
        service.priceFrom >= priceRange[0] &&
        service.priceFrom <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy === "rating") {
      return [...filtered].sort((a, b) => {
        const ratingA = providerMap[a.providerId]?.ratingAvg || 0;
        const ratingB = providerMap[b.providerId]?.ratingAvg || 0;
        return ratingB - ratingA;
      });
    }

    const userRegion = user?.region || "";
    const userCity = user?.city || "";

    return [...filtered].sort((a, b) => {
      const providerA = providerMap[a.providerId];
      const providerB = providerMap[b.providerId];

      if (
        storedLocation &&
        providerA?.latitude &&
        providerA?.longitude &&
        providerB?.latitude &&
        providerB?.longitude
      ) {
        const distanceA = distanceKm(
          storedLocation.lat,
          storedLocation.lng,
          providerA.latitude,
          providerA.longitude,
        );
        const distanceB = distanceKm(
          storedLocation.lat,
          storedLocation.lng,
          providerB.latitude,
          providerB.longitude,
        );
        if (distanceA !== distanceB) return distanceA - distanceB;
      }

      const scoreA = providerA
        ? providerA.city === userCity
          ? 0
          : providerA.region === userRegion
            ? 1
            : 2
        : 3;
      const scoreB = providerB
        ? providerB.city === userCity
          ? 0
          : providerB.region === userRegion
            ? 1
            : 2
        : 3;

      if (scoreA !== scoreB) return scoreA - scoreB;

      const ratingA = providerA?.ratingAvg || 0;
      const ratingB = providerB?.ratingAvg || 0;
      return ratingB - ratingA;
    });
  }, [
    services,
    searchQuery,
    selectedCategory,
    priceRange,
    sortBy,
    providerMap,
    user?.region,
    user?.city,
    storedLocation,
  ]);

  const handleServiceClick = (service: Service) => {
    navigate(`/client/provider/${service.providerId}`);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container py-4">
          <h1 className="mb-4 text-xl font-semibold text-foreground">
            {t("nav.search")}
          </h1>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-xl ps-12"
              />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isArabic ? "left" : "right"}>
                <SheetHeader>
                  <SheetTitle>{t("common.filter")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Sort */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      {t("search.sortBy")}
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sortBy === "nearest" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSortBy("nearest")}
                      >
                        {t("search.nearest")}
                      </Button>
                      <Button
                        type="button"
                        variant={sortBy === "rating" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSortBy("rating")}
                      >
                        {t("search.topRated")}
                      </Button>
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      {t("search.priceRange")}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) =>
                        setPriceRange(value as [number, number])
                      }
                      min={0}
                      max={1000}
                      step={10}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0]} SAR</span>
                      <span>{priceRange[1]} SAR</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setFilterOpen(false)}
                  >
                    {t("search.applyFilters")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {/* Category Filter */}
          {categoriesWithServices.length > 0 && (
            <motion.section variants={fadeInUp} className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => handleCategoryChange(null)}
                >
                  {t("search.all")}
                </Button>
                {categoriesWithServices.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 gap-1.5 rounded-full"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span>{category.icon || "🎯"}</span>
                    <span>{category.name}</span>
                  </Button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Results */}
          <motion.section variants={fadeInUp}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-foreground">
                {t("search.results")} ({filteredServices.length})
              </h2>
            </div>

            {loadingServices || loadingProviders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("common.noResults")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("search.tryDifferent")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServices.map((service) => {
                  const provider = providerMap[service.providerId];
                  return (
                    <motion.button
                      key={service.id}
                      variants={fadeInUp}
                      onClick={() => handleServiceClick(service)}
                      className="w-full rounded-2xl bg-card p-4 text-start transition-all hover:bg-accent card-glow"
                    >
                      <div className="flex gap-4">
                        {/* Service Image */}
                        {service.mediaUrls?.[0] ? (
                          <img
                            src={service.mediaUrls[0]}
                            alt={service.title}
                            className="h-24 w-24 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <span className="text-3xl">
                              {categoryLookup[service.categoryId]?.icon || "🎯"}
                            </span>
                          </div>
                        )}

                        {/* Service Details */}
                        <div className="flex-1 overflow-hidden">
                          <h3 className="mb-1 truncate font-semibold text-foreground">
                            {service.title}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                            {service.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Provider Rating */}
                            {provider && (
                              <Badge variant="secondary" className="gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {provider.ratingAvg.toFixed(1)}
                              </Badge>
                            )}

                            {/* Duration */}
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {service.durationMin} {t("search.min")}
                            </Badge>

                            {/* Location */}
                            {provider && (
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="h-3 w-3" />
                                {provider.area}
                              </Badge>
                            )}
                          </div>

                          {/* Price */}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-semibold text-primary">
                              {service.priceFrom === service.priceTo
                                ? `${service.priceFrom} SAR`
                                : `${service.priceFrom} - ${service.priceTo} SAR`}
                            </span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientSearchPage;
