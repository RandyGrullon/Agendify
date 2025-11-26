"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Home, Users, Settings, X, Package, FileText, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Citas', href: '/appointments', icon: Calendar },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Catálogo', href: '/services', icon: Package },
    { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));

        // Dispatch custom event for layout to listen
        window.dispatchEvent(new CustomEvent('sidebar-toggle', {
            detail: { collapsed: newState }
        }));
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Sesión cerrada exitosamente');
            router.push('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            toast.error('Error al cerrar sesión');
        }
    };

    return (
        <>
            {/* Mobile sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-50 bg-gray-900/80 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white px-6 pb-4 overflow-y-auto lg:hidden"
                        >
                            <div className="flex h-16 shrink-0 items-center justify-between">
                                <span className="text-2xl font-bold text-blue-600">Agendify</span>
                                <button onClick={() => setIsOpen(false)} className="-m-2.5 p-2.5 text-gray-700">
                                    <span className="sr-only">Close sidebar</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                            <nav className="flex flex-1 flex-col mt-8">
                                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul role="list" className="-mx-2 space-y-1">
                                            {navigation.map((item) => (
                                                <li key={item.name}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={cn(
                                                            pathname === item.href
                                                                ? 'bg-gray-50 text-blue-600'
                                                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={cn(
                                                                pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                                                                'h-6 w-6 shrink-0'
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        {item.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                    <li className="mt-auto">
                                        <button
                                            onClick={handleSignOut}
                                            className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut
                                                className="h-6 w-6 shrink-0"
                                                aria-hidden="true"
                                            />
                                            Cerrar Sesión
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop sidebar */}
            <motion.div
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '18rem' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col"
            >
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center justify-between">
                        {!isCollapsed && <span className="text-2xl font-bold text-blue-600">Agendify</span>}
                        <button
                            onClick={toggleCollapse}
                            className={cn(
                                "p-2 rounded-md hover:bg-gray-100 transition-colors",
                                isCollapsed && "mx-auto"
                            )}
                            title={isCollapsed ? "Expandir sidebar" : "Compactar sidebar"}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            ) : (
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    pathname === item.href
                                                        ? 'bg-gray-50 text-blue-600'
                                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                                                    isCollapsed && 'justify-center'
                                                )}
                                                title={isCollapsed ? item.name : undefined}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                                                        'h-6 w-6 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {!isCollapsed && item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="mt-auto">
                                <button
                                    onClick={handleSignOut}
                                    className={cn(
                                        "group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-600 hover:bg-red-50 transition-colors",
                                        isCollapsed && 'justify-center'
                                    )}
                                    title={isCollapsed ? "Cerrar Sesión" : undefined}
                                >
                                    <LogOut
                                        className="h-6 w-6 shrink-0"
                                        aria-hidden="true"
                                    />
                                    {!isCollapsed && "Cerrar Sesión"}
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </motion.div>
        </>
    );
}
