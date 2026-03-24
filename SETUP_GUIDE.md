# Guía de Instalación y Configuración - Sistema de Agentes Inteligentes

## Parte 1: Configuración Local

### Requisitos Previos

- Node.js v24 (o superior)
- pnpm 10.29.1 (o superior)
- PostgreSQL 14+ (instalado localmente)
- Git

### 1. Instalar PostgreSQL

#### En Windows:

1. Descarga PostgreSQL desde https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Durante la instalación, recuerda la contraseña del usuario `postgres`
4. Asegúrate de que PostgreSQL se ejecute en el puerto `5432`

#### Verificar que PostgreSQL funciona:

```bash
psql --version
```

### 2. Crear la Base de Datos Local

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE intelligent_agent_db;

# Salir
\q
```

### 3. Configurar Variables de Entorno

El archivo `.env` ya ha sido creado. Actualiza los valores según tu configuración:

```bash
# Para Windows
$env:DATABASE_URL = "postgresql://postgres:tu_contraseña@localhost:5432/intelligent_agent_db"

# O edita el archivo .env directamente:
DATABASE_URL=postgresql://postgres:tu_contraseña@localhost:5432/intelligent_agent_db
PORT=3000
NODE_ENV=development
```

### 4. Variables de Entorno Importantes

```env
# Base de datos (REQUERIDO)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_bd

# API Server
PORT=3000                          # Puerto donde corre el servidor
NODE_ENV=development               # development o production

# Proveedores de IA (Configurar según necesites)
OPENAI_API_KEY=sk-...             # Para usar OpenAI
GROQ_API_KEY=...                  # Para usar Groq
ANTHROPIC_API_KEY=...             # Para usar Anthropic
GROK_API_KEY=...                  # Para usar Grok/xAI
OPENROUTER_API_KEY=...            # Para usar OpenRouter

# GitHub Integration (Opcional)
GITHUB_TOKEN=ghp_...              # Token personal de GitHub
GITHUB_REPO=tu_usuario/tu_repo    # Repositorio para sincronizar

# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER=+1234567890 # Tu número de WhatsApp

# Logging
LOG_LEVEL=info                     # debug, info, warn, error
```

### 5. Ejecutar Migraciones de Base de Datos

Primero, compila el proyecto:

```bash
pnpm run typecheck
pnpm --filter @workspace/db run push
```

Si tienes errores, usa force:

```bash
pnpm --filter @workspace/db run push-force
```

### 6. Construir el Proyecto

```bash
pnpm run build
```

### 7. Ejecutar el Servidor Localmente

Opción 1: Modo desarrollo (con rebuild automático):

```bash
pnpm --filter @workspace/api-server run dev
```

Opción 2: Modo producción:

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

El servidor estará disponible en: `http://localhost:3000`

### 8. Verificar la Salud del Servidor

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

---

## Parte 2: Desplegar en EasyPanel

### Preparación del Proyecto

#### 1. Actualizar package.json para EasyPanel

EasyPanel necesita un script `start` en el root que ejecute el servidor. Actualiza el `package.json` raíz:

```json
{
  "scripts": {
    "start": "pnpm --filter @workspace/api-server run start",
    "build": "pnpm run build"
  }
}
```

#### 2. Crear archivo `.easypanel.yaml` (Opcional)

```yaml
version: "1.0"
services:
  api:
    type: "nodejs"
    buildCommand: "pnpm install && pnpm run build"
    startCommand: "pnpm --filter @workspace/api-server run start"
    port: 3000
    env:
      NODE_ENV: "production"
```

#### 3. Requerimientos de EasyPanel

- **Runtime**: Node.js 24+
- **Gestor de paquetes**: pnpm
- **Base de datos**: PostgreSQL (que EasyPanel provisiona)
- **Variables de entorno**: Se configuran desde el panel

### Pasos para Deploy en EasyPanel

#### 1. Preparar el Repositorio en GitHub

```bash
# Asegúrate de que todo esté en Git
git add .
git commit -m "Setup proyecto para EasyPanel"
git push origin main
```

#### 2. Conectar EasyPanel

1. Accede a tu panel de EasyPanel
2. Crea una nueva aplicación
3. Selecciona "Node.js" como runtime
4. Conecta tu repositorio de GitHub
5. Configura el build command:
   ```
   pnpm install && pnpm run build
   ```
6. Configura el start command:
   ```
   pnpm --filter @workspace/api-server run start
   ```

#### 3. Configurar Variables de Entorno

En EasyPanel, ve a "Environment Variables" y configura:

```
DATABASE_URL=postgresql://...    # EasyPanel proporciona su propia BD
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-...            # Tus claves
GITHUB_TOKEN=ghp_...
# ... otras variables
```

#### 4. Configurar Base de Datos

1. EasyPanel proporciona automáticamente una BD PostgreSQL
2. Copia la `DATABASE_URL` que EasyPanel genera
3. Pégala en las variables de entorno
4. Las migraciones se ejecutarán automáticamente

#### 5. Deploy

```bash
# Desde tu terminal local:
git push origin main

# EasyPanel detectará el cambio y iniciará el deploy automáticamente
# O manualmente desde el panel: Deploy → Redeploy
```

### Troubleshooting en EasyPanel

#### Build falla con `pnpm not found`

- EasyPanel debería detectar `pnpm-lock.yaml` automáticamente
- Si no lo hace, ve a Settings y marca "Use pnpm"

#### Base de datos no funciona

```bash
# Verifica que la DATABASE_URL sea correcta
# Ejecuta las migraciones manualmente:
pnpm --filter @workspace/db run push
```

#### Puerto incorrecto

- EasyPanel asigna dinámicamente el puerto
- Use `process.env.PORT` en tu configuración (ya está hecho)

#### Servidor no inicia

```bash
# Verifica los logs en EasyPanel
# Asegúrate de que NODE_ENV=production
# Compila localmente: pnpm run build
```

---

## Estructura del Proyecto

```
.
├── artifacts/              # Aplicaciones desplegables
│   ├── api-server/        # API Express (PRINCIPAL)
│   ├── bot-dashboard/     # React dashboard
│   └── mockup-sandbox/    # Sandbox de UI
├── lib/                   # Librerías compartidas
│   ├── db/               # Capa de base de datos
│   ├── api-spec/         # Especificación OpenAPI
│   ├── api-zod/          # Esquemas Zod generados
│   └── api-client-react/ # Hooks React generados
├── scripts/              # Scripts de utilidad
├── package.json          # Root workspace
├── pnpm-workspace.yaml   # Configuración workspace
└── .env                  # Variables de entorno
```

## Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Typecheck
pnpm run typecheck

# Build completo
pnpm run build

# Ejecutar servidor en desarrollo
pnpm --filter @workspace/api-server run dev

# Build servidor producción
pnpm --filter @workspace/api-server run build

# Ejecutar servidor producción
pnpm --filter @workspace/api-server run start

# Migraciones DB
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run push-force
pnpm --filter @workspace/db run generate

# Ver logs
pnpm --filter @workspace/api-server run logs

# Test (si existen)
pnpm run test
```

---

## Verificación Final

Antes de hacer deploy, verifica:

```bash
# 1. Typecheck
✓ pnpm run typecheck

# 2. Build
✓ pnpm run build

# 3. Servidor local
✓ pnpm --filter @workspace/api-server run dev

# 4. Salud del servidor
✓ curl http://localhost:3000/api/health

# 5. BD conectada
✓ Verificar que puedas conectar a PostgreSQL

# 6. Variables de entorno
✓ .env configurado correctamente
```

¡Listo para deploy! 🚀
