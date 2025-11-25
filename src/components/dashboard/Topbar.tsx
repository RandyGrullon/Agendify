"use client";

import { Menu as MenuIcon, User } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={onMenuClick}>
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1" /> {/* Spacer */}
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    <div className="relative flex items-center gap-3">
                        <span className="hidden lg:flex lg:items-center">
                            <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                {user?.displayName || user?.email}
                            </span>
                        </span>
                        <button
                            onClick={() => router.push('/profile')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Mi Perfil"
                        >
                            <User className="h-5 w-5 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
