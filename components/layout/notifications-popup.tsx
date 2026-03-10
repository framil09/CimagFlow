"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Eye, AlertCircle, FileText, Users, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

interface NotificationsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUpdate: () => void;
  collapsed?: boolean;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  DOCUMENT_SIGNED: FileText,
  DOCUMENT_PENDING: Clock,
  DOCUMENT_CANCELLED: AlertCircle,
  MENTION: Users,
  SYSTEM: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  DOCUMENT_SIGNED: "bg-emerald-100 text-emerald-600",
  DOCUMENT_PENDING: "bg-amber-100 text-amber-600",
  DOCUMENT_CANCELLED: "bg-red-100 text-red-600",
  MENTION: "bg-blue-100 text-blue-600",
  SYSTEM: "bg-gray-100 text-gray-600",
};

export default function NotificationsPopup({ isOpen, onClose, unreadCount, onUpdate, collapsed = false }: NotificationsPopupProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        onUpdate();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onUpdate();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed ${collapsed ? 'left-20' : 'left-64'} top-20 z-50 w-96 max-w-[calc(100vw-280px)]`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#1E3A5F] to-[#0D2340]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="px-5 py-3 border-b border-gray-100 bg-blue-50">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Marcar todas como lidas
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-500 text-sm mt-3">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhuma notificação</p>
                  <p className="text-gray-400 text-sm mt-1">Você está em dia!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                    const colorClass = NOTIFICATION_COLORS[notification.type] || "bg-gray-100 text-gray-600";

                    return (
                      <div
                        key={notification.id}
                        className={`px-5 py-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium text-gray-900 ${!notification.read ? "font-semibold" : ""}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                                  title="Marcar como lida"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <Link
                  href="/notificacoes"
                  onClick={onClose}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Ver todas as notificações
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
