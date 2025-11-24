# Agendify

Aplicación comercial PWA construida con Next.js 16, Firebase y Tailwind CSS.

## ✅ Estado del Proyecto

- **Build Status**: ✅ Compilando correctamente sin errores
- **Next.js Version**: 16.0.3 (con Turbopack)
- **Última actualización**: Noviembre 2025

## Características

- **Autenticación**: Email/Password y Google Auth
- **Agenda**: Gestión completa de citas (CRUD)
- **Clientes**: Gestión de clientes con historial
- **Servicios**: Catálogo de servicios con estadísticas
- **Multi-tenant**: Datos aislados por usuario
- **PWA**: Instalable en móvil y desktop, funciona offline
- **Exportación**: Exportar datos a Excel y PDF
- **Dashboard**: Visualización de métricas y estadísticas

## Configuración

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar Firebase:
   - El proyecto ya está configurado con las credenciales en `src/lib/firebase.ts`
   - Asegúrate de habilitar **Authentication** (Email/Password y Google) en tu consola de Firebase
   - Crea la base de datos **Firestore** en modo producción y aplica las reglas de `firestore.rules`

3. Correr en desarrollo:
   ```bash
   npm run dev
   ```

4. Hacer build de producción:
   ```bash
   npm run build
   ```

5. Correr en modo producción:
   ```bash
   npm start
   ```

## 🚀 Despliegue a Producción

Para instrucciones detalladas de despliegue, consulta **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Opciones de despliegue disponibles:
- **Vercel** (Recomendado) - Plataforma nativa de Next.js
- **Firebase Hosting + Cloud Functions** - Requiere configuración adicional
- **Netlify** - Alternativa con buen soporte para Next.js

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   └── (dashboard)/       # Rutas del dashboard
├── components/            # Componentes React
│   ├── dashboard/        # Componentes del dashboard
│   └── providers/        # Context providers
├── lib/                  # Utilidades y configuración
├── services/             # Servicios de Firebase
└── types/               # Definiciones de TypeScript
```

## Reglas de Firestore

Copia el contenido de `firestore.rules` en la pestaña "Rules" de Firestore en la consola de Firebase.

## Tecnologías Utilizadas

- **Next.js 16** - Framework React con Turbopack
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **Firebase** - Backend (Auth + Firestore)
- **Framer Motion** - Animaciones
- **React Hook Form + Zod** - Formularios y validación
- **jsPDF** - Generación de PDFs
- **XLSX** - Exportación a Excel

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Soporte

Para problemas o preguntas, consulta la documentación en:
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Guía de Despliegue](./DEPLOYMENT.md)

