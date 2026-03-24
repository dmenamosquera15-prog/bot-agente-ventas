# Despliegue en EasyPanel - Guía Rápida

## 🚀 Resumen Rápido

Este proyecto es un sistema de Agentes IA para WhatsApp con un API Express y dashboard React. Sigue estos pasos para desplegarlo en EasyPanel.

## 📋 Requisitos Previos en EasyPanel

- Repositorio GitHub público o privado
- Acceso a EasyPanel
- Base de datos PostgreSQL (EasyPanel lo provisiona automáticamente)

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Verificar que el repositorio esté limpio

```bash
# Asegúrate de que no hay archivos sensibles
git status

# Hacer commit de los cambios finales
git add .
git commit -m "Setup para EasyPanel deployment"
git push origin main
```

### 1.2 Verificar archivos clave

Estos archivos DEBEN estar en el repositorio:

- ✅ `pnpm-lock.yaml` (EasyPanel lo usa para detectar pnpm)
- ✅ `package.json` (root workspace)
- ✅ `pnpm-workspace.yaml` (configuración del workspace)
- ✅ `artifacts/api-server/` (aplicación principal)
- ✅ `.env` (plantilla - **NO incluir datos sensibles**)

Estos archivos NO deben estar en el repositorio:

- ❌ `.env.local` (usar .env sin datos sensibles)
- ❌ `node_modules/` (ya está en .gitignore)
- ❌ `dist/` (se genera en el build)
- ❌ `whatsapp_auth/` (datos de WhatsApp)

## 📱 Paso 2: Configurar EasyPanel

### 2.1 Crear Nueva Aplicación

1. Inicia sesión en tu panel de EasyPanel
2. Ve a **Aplicaciones** → **+ Nueva Aplicación**
3. Selecciona **Node.js** como runtime
4. Conecta tu repositorio GitHub

### 2.2 Configurar Build

**Build Command:**

```
pnpm install && pnpm run build
```

**Start Command:**

```
pnpm --filter @workspace/api-server run start
```

**Importante:**

- La carpeta raíz es `/` (la raíz del repositorio)
- EasyPanel detectará automáticamente `pnpm` desde `pnpm-lock.yaml`

### 2.3 Configurar Variables de Entorno

En la sección **Environment Variables** de EasyPanel, agrega:

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Base de datos - EasyPanel proporciona DATABASE_URL automáticamente
# Solo copia y pega la que EasyPanel genera

# Proveedores de IA (configurar según tus necesidades)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=
ANTHROPIC_API_KEY=
GROK_API_KEY=
OPENROUTER_API_KEY=

# GitHub (opcional, para sincronización)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=tu_usuario/tu_repo

# WhatsApp (opcional)
WHATSAPP_PHONE_NUMBER=
```

### 2.4 Base de Datos

1. EasyPanel proporciona automáticamente PostgreSQL
2. Copia el `DATABASE_URL` que genera EasyPanel
3. Pégalo en las variables de entorno
4. Las migraciones se ejecutarán automáticamente en el primer deploy

## 🔄 Paso 3: Realizar el Primer Deploy

### Opción A: Desde GitHub (Recomendado)

```bash
# En tu terminal local
git push origin main

# EasyPanel detectará el cambio automáticamente e iniciará el deploy
```

### Opción B: Desde EasyPanel

1. Ve a tu aplicación en EasyPanel
2. Haz clic en **Deploy** → **Deploy Ahora**
3. Espera a que termine el build

## ✅ Verificar el Deployment

Cuando el deploy esté completo:

1. **Accede a la URL del sitio** que proporciona EasyPanel
2. **Verifica la salud del servidor:**

   ```
   https://tu-dominio.easypanel.io/api/health
   ```

   Deberías ver:

   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-20T10:30:00Z"
   }
   ```

3. **Revisa los logs:**
   - En EasyPanel: **Logs** → busca mensajes de "Server listening"

## 🐛 Troubleshooting

### El build falla con "pnpm not found"

**Solución:**

- Asegúrate de que `pnpm-lock.yaml` esté en el repositorio
- En EasyPanel, ve a **Configuración** y verifica que esté usando pnpm
- Si no, selecciona manualmente "pnpm" como gestor de paquetes

### El servidor no inicia

**Revisa los logs:**

```
Error: DATABASE_URL must be set
```

→ Verifica que `DATABASE_URL` esté configurada en Environment Variables

```
Error: PORT environment variable is required
```

→ Asegúrate de que `PORT=3000` esté en las variables de entorno

### Las migraciones de BD fallan

**Solución:**

1. Verifica que `DATABASE_URL` sea correcta
2. Intenta hacer un redeploy completo desde EasyPanel
3. Si persiste, contacta a EasyPanel para verificar la conexión a BD

### Erro de permisos en node_modules

**Solución:**

```bash
# En tu terminal local
rm -rf node_modules pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "Update pnpm lock"
git push origin main
```

## 📊 Monitoring y Logs

### Ver logs en tiempo real

En EasyPanel:

1. Ve a tu aplicación
2. Haz clic en **Logs**
3. Verás los logs del servidor en tiempo real

### Niveles de log

Puedes cambiar el nivel en Environment Variables:

- `LOG_LEVEL=debug` - Muy detallado
- `LOG_LEVEL=info` - Normal (recomendado)
- `LOG_LEVEL=warn` - Solo advertencias
- `LOG_LEVEL=error` - Solo errores

## 🔐 Seguridad

### Cambios importantes antes de producción

1. **Cambiar contraseña de BD** en EasyPanel
2. **Crear un nuevo OPENAI_API_KEY** si es necesario
3. **Crear un nuevo GITHUB_TOKEN** con permisos limitados
4. **Habilitar HTTPS** (EasyPanel lo hace automáticamente)
5. **Configurar CORS** si tienes un frontend separado

### Archivos sensibles

Estos archivos NO deben estar en GitHub:

- `.env` (solo la plantilla sin valores)
- `whatsapp_auth/` (datos de autenticación)
- Cualquier token o clave API

## 🔄 Redeploys Futuros

Para hacer redeploy después de cambios:

```bash
# Opción 1: Git push automático
git add .
git commit -m "tu mensaje"
git push origin main
# EasyPanel lo detecta automáticamente

# Opción 2: Desde EasyPanel manualmente
# Ve a tu aplicación → Deploy → Deploy Ahora
```

## 📚 Recursos Útiles

- [EasyPanel Docs](https://docs.easypanel.io/)
- [pnpm Documentation](https://pnpm.io/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 💡 Consejos

1. **Haz commits frecuentes** con mensajes descriptivos
2. **Prueba localmente primero** antes de hacer push
3. **Revisa los logs** de EasyPanel después de cada deploy
4. **Ten un .env.local** en desarrollo local (no en repo)
5. **Documenta las variables de entorno** que necesites

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en EasyPanel
2. Compila localmente: `pnpm run build`
3. Verifica que `DATABASE_URL` sea correcta
4. Contacta a EasyPanel con los detalles del error

---

**¡Listo para producción!** 🎉

Tu aplicación está lista para escalar en EasyPanel.
