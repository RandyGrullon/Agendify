# Agendify

Aplicación comercial PWA construida con Next.js 14, Firebase y Tailwind CSS.

## Características

- **Autenticación**: Email/Password y Google Auth.
- **Agenda**: Gestión completa de citas (CRUD).
- **Multi-tenant**: Datos aislados por usuario.
- **PWA**: Instalable en móvil y desktop, funciona offline.
- **Exportación**: Exportar datos a Excel.

## Configuración

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Configurar Firebase:
    - El proyecto ya está configurado con las credenciales proporcionadas en `src/lib/firebase.ts`.
    - Asegúrate de habilitar **Authentication** (Email/Password y Google) en tu consola de Firebase.
    - Crea la base de datos **Firestore** en modo producción y aplica las reglas de `firestore.rules`.

3.  Correr en desarrollo:
    ```bash
    npm run dev
    ```

## Despliegue en Vercel

1.  Sube el código a GitHub.
2.  Importa el proyecto en Vercel.
3.  Vercel detectará automáticamente Next.js.
4.  Deploy!

## Reglas de Firestore

Copia el contenido de `firestore.rules` en la pestaña "Rules" de Firestore en la consola de Firebase.
