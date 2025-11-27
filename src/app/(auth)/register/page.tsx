"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";

const schema = z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            // 1. Create Authentication User
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            
            // 2. Update Profile Name
            await updateProfile(userCredential.user, {
                displayName: data.name,
            });

            // 3. Create User Document in Firestore
            try {
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: data.email,
                    displayName: data.name,
                    role: 'owner',
                    createdAt: Date.now(),
                    settings: {
                        currency: 'USD',
                        language: 'es',
                        theme: 'light'
                    }
                });
            } catch (firestoreError) {
                console.error("Error creating user document:", firestoreError);
                // Continue even if Firestore fails, as Auth is successful
                // We can retry creating the document later or handle it in the dashboard
            }

            toast.success("Cuenta creada exitosamente");
            router.replace("/dashboard"); // Use replace to prevent going back to register
        } catch (error: unknown) {
            console.error("Registration error:", error);
            let errorMessage = "Error al registrarse";
            const err = error as { code?: string } | null;
            const code = err?.code;
            if (code === "auth/email-already-in-use") {
                errorMessage = "Este correo electrónico ya está registrado";
            } else if (code === "auth/invalid-email") {
                errorMessage = "El correo electrónico no es válido";
            } else if (code === "auth/weak-password") {
                errorMessage = "La contraseña es muy débil";
            } else if (code === "auth/network-request-failed") {
                errorMessage = "Error de conexión. Verifica tu internet";
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-center text-2xl font-bold text-gray-900">Crear Cuenta</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input
                        {...register("name")}
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-gray-900"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        {...register("email")}
                        type="email"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-gray-900"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                        {...register("password")}
                        type="password"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-gray-900"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                    <input
                        {...register("confirmPassword")}
                        type="password"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-gray-900"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Registrarse"}
                </button>
            </form>

            <div className="text-center text-sm">
                <span className="text-gray-600">¿Ya tienes cuenta? </span>
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Inicia Sesión
                </Link>
            </div>
        </div>
    );
}
