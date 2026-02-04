import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import logo from "@/assets/logo.jpeg";

const SignupPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const isRTL = i18n.dir() === "rtl";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isStrongPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!acceptedPrivacy) {
      setError(t("auth.acceptPrivacyRequired"));
      return;
    }

    if (!isStrongPassword(password)) {
      setError(t("auth.passwordRequirements"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
      navigate("/onboarding");
    } catch (err) {
      if ((err as any)?.code === "auth/email-not-verified") {
        setSuccess(t("auth.verifyEmailSent"));
        navigate("/auth/login");
        return;
      }
      setError(getAuthErrorMessage(err, t));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative (shown on desktop) */}
      <div className="hidden flex-1 hero-gradient lg:flex lg:items-center lg:justify-center">
        <div className="p-12 text-center">
          <img
            src={logo}
            alt="Link"
            className="mx-auto h-40 w-40 rounded-3xl object-cover shadow-2xl float"
          />
          <h2 className="mt-8 text-3xl font-bold text-primary-foreground">
            {t("common.appName")}
          </h2>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80">
            {t("common.tagline")}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Link to="/">
              <img
                src={logo}
                alt="Link"
                className="h-16 w-16 rounded-xl object-cover"
              />
            </Link>
          </div>
          <div className="mb-8 text-center lg:text-start">
            <h1 className="text-2xl font-bold text-foreground">
              {t("auth.createAccount")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("auth.getStarted")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="ps-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ps-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-10 pe-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("auth.passwordRequirements")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("auth.confirmPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-10"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                {t("auth.iAccept")}{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {t("auth.privacyPolicy")}
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !acceptedPrivacy}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {t("auth.signup")}
                  <ArrowIcon className="ms-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              to="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
