import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProviderServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/hooks/queries/useServices";
import { useCategories } from "@/hooks/queries/useCategories";
import { Service, LocationType } from "@/types";

const ProviderServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === "ar";

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    priceFrom: "",
    priceTo: "",
    durationMin: "",
    locationType: "AT_PROVIDER" as LocationType,
  });

  // Fetch data
  const { data: services = [], isLoading } = useProviderServices(
    user?.uid || "",
  );
  const { data: categories = [] } = useCategories();

  // Mutations
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      priceFrom: "",
      priceTo: "",
      durationMin: "",
      locationType: "AT_PROVIDER",
    });
    setEditingService(null);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      categoryId: service.categoryId,
      priceFrom: service.priceFrom.toString(),
      priceTo: service.priceTo.toString(),
      durationMin: service.durationMin.toString(),
      locationType: service.locationType,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    const serviceData = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      priceFrom: parseFloat(formData.priceFrom) || 0,
      priceTo:
        parseFloat(formData.priceTo) || parseFloat(formData.priceFrom) || 0,
      durationMin: parseInt(formData.durationMin) || 60,
      locationType: formData.locationType,
      providerId: user.uid,
      isActive: true,
      mediaUrls: [],
    };

    try {
      if (editingService) {
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          updates: serviceData,
        });
      } else {
        await createServiceMutation.mutateAsync(serviceData);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save service:", error);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteServiceMutation.mutateAsync(serviceToDelete.id);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateServiceMutation.mutateAsync({
        id: service.id,
        updates: { isActive: !service.isActive },
      });
    } catch (error) {
      console.error("Failed to toggle service:", error);
    }
  };

  const getLocationTypeLabel = (type: LocationType) => {
    switch (type) {
      case "AT_PROVIDER":
        return t("services.atProvider");
      case "AT_CLIENT":
        return t("services.atClient");
      case "BOTH":
        return t("services.both");
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {t("nav.services")}
          </h1>
          <Button onClick={openAddForm} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("services.addService")}
          </Button>
        </div>
      </header>

      <main className="container py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("services.noServices")}</p>
            <Button onClick={openAddForm} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              {t("services.addFirst")}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-4"
          >
            {services.map((service) => {
              const category = categories.find(
                (c) => c.id === service.categoryId,
              );
              return (
                <motion.div
                  key={service.id}
                  variants={fadeInUp}
                  className="rounded-2xl bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {service.title}
                        </h3>
                        {!service.isActive && (
                          <Badge variant="secondary">
                            {t("services.inactive")}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {service.description}
                      </p>

                      {/* Category */}
                      {category && (
                        <Badge variant="outline" className="mt-2">
                          {category.icon}{" "}
                          {isArabic ? category.nameAr : category.nameEn}
                        </Badge>
                      )}

                      {/* Details */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {service.priceFrom === service.priceTo
                            ? `${service.priceFrom} SAR`
                            : `${service.priceFrom} - ${service.priceTo} SAR`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.durationMin} {t("search.min")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getLocationTypeLabel(service.locationType)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditForm(service)}
                          >
                            <Edit2 className="me-2 h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setServiceToDelete(service);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Add/Edit Service Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent
          side={isArabic ? "left" : "right"}
          className="overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {editingService
                ? t("services.editService")
                : t("services.addService")}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">{t("services.title")}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={t("services.titlePlaceholder")}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t("services.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("services.descriptionPlaceholder")}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Category */}
            <div>
              <Label>{t("services.category")}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("services.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon}{" "}
                      {isArabic ? category.nameAr : category.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceFrom">{t("services.priceFrom")}</Label>
                <Input
                  id="priceFrom"
                  type="number"
                  value={formData.priceFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, priceFrom: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="priceTo">{t("services.priceTo")}</Label>
                <Input
                  id="priceTo"
                  type="number"
                  value={formData.priceTo}
                  onChange={(e) =>
                    setFormData({ ...formData, priceTo: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">{t("services.duration")}</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMin}
                onChange={(e) =>
                  setFormData({ ...formData, durationMin: e.target.value })
                }
                placeholder="60"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("services.durationHint")}
              </p>
            </div>

            {/* Location Type */}
            <div>
              <Label>{t("services.locationType")}</Label>
              <Select
                value={formData.locationType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    locationType: value as LocationType,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT_PROVIDER">
                    {t("services.atProvider")}
                  </SelectItem>
                  <SelectItem value="AT_CLIENT">
                    {t("services.atClient")}
                  </SelectItem>
                  <SelectItem value="BOTH">{t("services.both")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={
                !formData.title ||
                !formData.categoryId ||
                !formData.priceFrom ||
                createServiceMutation.isPending ||
                updateServiceMutation.isPending
              }
            >
              {editingService ? t("common.save") : t("services.addService")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("services.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("services.deleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteServiceMutation.isPending}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderServicesPage;
