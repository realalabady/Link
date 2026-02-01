import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderChats } from "@/hooks/queries/useChats";
import { useClientName } from "@/hooks/queries/useUsers";
import { Chat } from "@/types";

// Chat item component that fetches client name
const ChatItem: React.FC<{
  chat: Chat;
  onClick: () => void;
  formatTime: (date: Date | undefined) => string;
}> = ({ chat, onClick, formatTime }) => {
  const { t } = useTranslation();
  const { data: fetchedClientName, isLoading } = useClientName(chat.clientId);

  // Get client name with fallbacks
  const clientName =
    chat.clientName ||
    fetchedClientName ||
    (isLoading ? "..." : t("chat.client"));

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-start transition-all hover:bg-accent"
    >
      {/* Avatar */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
        👩
      </div>

      {/* Chat Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{clientName}</h3>
          <span className="text-xs text-muted-foreground">
            {formatTime(chat.lastMessageAt)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <p className="truncate text-sm text-muted-foreground">
            {chat.lastMessage || t("chat.noMessages")}
          </p>
          {chat.unreadCount > 0 && (
            <Badge className="ms-2 h-5 min-w-5 rounded-full px-1.5">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground rtl:rotate-180" />
    </motion.button>
  );
};

const ProviderChatsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  // Fetch chats
  const { data: chats = [], isLoading } = useProviderChats(user?.uid || "");

  // Sort chats by last message time
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });
  }, [chats]);

  const handleChatClick = (chat: Chat) => {
    navigate(`/provider/chats/${chat.id}`);
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    const now = new Date();
    const messageDate = new Date(date);
    const diffDays = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return t("chat.yesterday");
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        weekday: "short",
      });
    } else {
      return messageDate.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      });
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
        <div className="container py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {t("nav.chats")}
          </h1>
        </div>
      </header>

      <main className="container py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl bg-card p-4"
              >
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center"
          >
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("chat.noChats")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("chat.chatsWillAppear")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-2"
          >
            {sortedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                onClick={() => handleChatClick(chat)}
                formatTime={formatTime}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ProviderChatsPage;
