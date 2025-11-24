import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Agendify</h1>
                        <p className="mt-2 text-sm text-gray-600">Gestión inteligente para tu negocio</p>
                    </div>
                    {children}
                </div>
            </div>

            {/* Right Side - Image/Background */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900">
                    <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
                    <div className="flex items-center justify-center h-full text-white p-12">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-bold mb-6">Tu agenda, simplificada.</h2>
                            <p className="text-lg text-blue-100">
                                Únete a miles de profesionales que han transformado la manera en que gestionan sus citas y clientes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
