"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getBusinessSettings, saveBusinessSettings } from "@/services/settings";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { BusinessSettings } from "@/types";
import { Loader2, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const data = await getBusinessSettings(user.uid);
          setSettings(data);
        } catch (error) {
          console.error("Error loading settings:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async (data: Partial<BusinessSettings>) => {
    if (!user) return;
    await saveBusinessSettings(user.uid, data);
    setSettings(
      (prev) =>
        ({
          ...((prev as BusinessSettings) || {}),
          ...data,
          userId: user.uid,
          updatedAt: Date.now(),
        } as BusinessSettings)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Administra tu información personal y de negocio
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.displayName || "Usuario"}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Información del Negocio
        </h2>
        <SettingsForm initialSettings={settings} onSave={handleSave} />
      </div>
    </div>
  );
}
