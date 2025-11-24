# Guía de Despliegue a Producción - Agendify

## ✅ Estado del Build

El proyecto se ha compilado exitosamente sin errores. Todos los problemas de TypeScript han sido resueltos.

### Errores Corregidos:
1. **next.config.ts → next.config.mjs**: Convertido el archivo de configuración de TypeScript a JavaScript, ya que Next.js 16 no soporta archivos de configuración .ts
2. **ServiceForm.tsx**: Corregido error de tipos en `createdAt` y `updatedAt` (cambiado de `string` a `number` para coincidir con la interfaz `Service`)

---

## 🚀 Opciones de Despliegue

### Opción 1: Vercel (Recomendado para Next.js)

Vercel es la plataforma nativa de Next.js y ofrece la mejor experiencia de despliegue.

**Pasos:**
1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Inicia sesión en Vercel:
   ```bash
   vercel login
   ```

3. Despliega el proyecto:
   ```bash
   vercel
   ```

4. Para despliegue a producción:
   ```bash
   vercel --prod
   ```

**Configuración de Variables de Entorno:**
- En el dashboard de Vercel, agrega tus variables de entorno de Firebase
- Las variables deben comenzar con `NEXT_PUBLIC_` para estar disponibles en el cliente

**Ventajas:**
- ✅ Configuración automática de Next.js
- ✅ Soporte completo para SSR y rutas dinámicas
- ✅ CDN global automático
- ✅ Despliegues automáticos desde Git
- ✅ Preview deployments para cada PR
- ✅ Gratis para proyectos personales

---

### Opción 2: Firebase Hosting + Cloud Functions

Para usar Firebase Hosting con Next.js SSR, necesitas Firebase Functions.

**Pasos:**

1. Instala las dependencias necesarias:
   ```bash
   npm install -g firebase-tools
   npm install firebase-functions firebase-admin
   ```

2. Inicializa Firebase Functions:
   ```bash
   firebase init functions
   ```

3. Instala el adaptador de Next.js para Firebase:
   ```bash
   npm install @firebase/next
   ```

4. Actualiza `firebase.json` para usar Functions:
   ```json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     },
     "hosting": {
       "public": "public",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "function": "nextjsFunc"
         }
       ]
     },
     "functions": {
       "source": "functions"
     }
   }
   ```

5. Despliega:
   ```bash
   firebase deploy
   ```

**Nota:** Esta opción requiere el plan Blaze (pago por uso) de Firebase.

---

### Opción 3: Netlify

Netlify también ofrece excelente soporte para Next.js.

**Pasos:**

1. Instala Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Inicia sesión:
   ```bash
   netlify login
   ```

3. Despliega:
   ```bash
   netlify deploy --prod
   ```

**Ventajas:**
- ✅ Soporte completo para Next.js
- ✅ Despliegues automáticos desde Git
- ✅ Gratis para proyectos personales

---

## 📋 Checklist Pre-Despliegue

Antes de desplegar a producción, asegúrate de:

- [ ] Configurar variables de entorno de Firebase en la plataforma de hosting
- [ ] Verificar que las reglas de Firestore estén configuradas correctamente
- [ ] Probar la aplicación localmente con `npm run build && npm start`
- [ ] Configurar un dominio personalizado (opcional)
- [ ] Configurar analytics (opcional)
- [ ] Revisar y actualizar las reglas de seguridad de Firebase

---

## 🔐 Variables de Entorno Necesarias

Asegúrate de configurar estas variables en tu plataforma de hosting:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

---

## 🧪 Probar el Build Localmente

Para probar el build de producción localmente:

```bash
# Hacer el build
npm run build

# Iniciar el servidor de producción
npm start
```

La aplicación estará disponible en `http://localhost:3000`

---

## 📝 Notas Adicionales

- El proyecto usa Next.js 16 con Turbopack
- Las rutas dinámicas (`/clients/[id]`, `/services/[id]`) requieren SSR
- Firebase se usa para autenticación y base de datos (Firestore)
- El proyecto está configurado para usar imágenes no optimizadas (`unoptimized: true`)

---

## 🆘 Solución de Problemas

### Error: "Module not found"
- Ejecuta `npm install` para asegurarte de que todas las dependencias estén instaladas

### Error de variables de entorno
- Verifica que todas las variables de entorno estén configuradas correctamente
- Las variables deben comenzar con `NEXT_PUBLIC_` para estar disponibles en el cliente

### Error de Firebase
- Verifica que las credenciales de Firebase sean correctas
- Asegúrate de que Firestore esté habilitado en tu proyecto de Firebase

---

## 📞 Soporte

Si encuentras algún problema durante el despliegue, revisa:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
