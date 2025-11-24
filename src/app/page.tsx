"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 lg:px-8">
        <h1 className="text-2xl font-bold text-blue-600">Agendify</h1>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-900 hover:text-blue-600">
            Iniciar Sesión
          </Link>
          <Link href="/register" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Gestión comercial simplificada
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Organiza tu agenda, controla tus ganancias y gestiona tus clientes en un solo lugar. Diseñado para profesionales que quieren crecer.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register" className="inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500">
              Comenzar Gratis
            </Link>
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-blue-600">
              Acceder a mi cuenta <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Todo lo que necesitas</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Potencia tu productividad
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-xl gap-8 md:grid-cols-3 lg:max-w-none">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Agenda Inteligente
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Gestiona tus citas con facilidad, evita conflictos y mantén tu día organizado.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
                  </svg>
                </div>
                Control Financiero
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Visualiza tus ganancias, pagos a colaboradores y montos cotizados en tiempo real.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M12 12a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                </div>
                Gestión de Clientes
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Mantén un registro detallado de tus clientes y sus servicios históricos.
              </dd>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-4">
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Agendify. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
