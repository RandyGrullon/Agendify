"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  checkAndSendReminders,
  requestNotificationPermission,
} from "@/services/reminders";
import { Bell, X } from "lucide-react";

export default function ReminderChecker() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
      setShowPrompt(Notification.permission === "default");
    }
  }, []);

  // Check for reminders every minute
  useEffect(() => {
    if (!user || !hasPermission) return;

    // Check immediately
    checkAndSendReminders(user.uid).catch(console.error);

    // Then check every minute
    const interval = setInterval(() => {
      checkAndSendReminders(user.uid).catch(console.error);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user, hasPermission]);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setHasPermission(permission === "granted");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Bell size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Habilitar Recordatorios
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Recibe notificaciones de tus citas próximas para que nunca te
            pierdas un evento importante.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRequestPermission}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Habilitar
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
