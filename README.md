# 🤖 Sistema de Agentes Inteligentes para WhatsApp

Bot inteligente multiperador con 4 agentes IA (Ventas, Soporte, Técnico, Admin), integración real con WhatsApp via Baileys, gestión de CRM, catálogo de productos y dashboard React.

**Stack:** Node.js 24 | Express 5 | PostgreSQL | React 19 | TypeScript 5.9 | pnpm workspace

## 🚀 Empezar Rápido

### Instalación Local

```bash
# 1. Clonar el proyecto
git clone https://github.com/tu-usuario/bot-agente-ventas.git
cd bot-agente-ventas

# 2. Instalar dependencias
pnpm install

# 3. Configurar base de datos
# - Crear BD PostgreSQL localmente
# - Actualizar DATABASE_URL en .env

# 4. Ejecutar migraciones
pnpm --filter @workspace/db run push

# 5. Iniciar servidor
pnpm --filter @workspace/api-server run dev

# Server estará en http://localhost:3000
```

### Despliegue en EasyPanel

```bash
# 1. Git push del proyecto
git push origin main

# 2. En EasyPanel:
# - Nueva Aplicación → Node.js
# - Conectar repositorio GitHub
# - Build: pnpm install && pnpm run build
# - Start: pnpm --filter @workspace/api-server run start
# - Agregar variables de entorno
# - Deploy

# ¡Listo! 🎉
```

**[Ver guía completa de EasyPanel →](./EASYPANEL_DEPLOY.md)**

## 📚 Documentación

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Instalación completa, local y cloud
- **[EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md)** - Despliegue paso a paso en EasyPanel
- **[replit.md](./replit.md)** - Estructura del proyecto y arquitectura

## ✨ Características

- ✅ **4 Agentes IA Inteligentes:**
  - Agente Ventas - Conversión de clientes
  - Agente Soporte - Resolución de problemas
  - Agente Técnico - Información técnica
  - Agente Admin - Gestión del negocio

- ✅ **WhatsApp Real** via Baileys
  - Autenticación por QR
  - Auto-reconexión
  - Manejo de mensajes en tiempo real

- ✅ **Proveedores IA Intercambiables:**
  - OpenAI (GPT-4)
  - Groq
  - Anthropic
  - Grok (xAI)
  - OpenRouter

- ✅ **CRM Completo:**
  - Gestión de clientes
  - Lead scoring
  - Historial de conversaciones
  - Seguimiento de interacciones

- ✅ **Catálogo de Productos:**
  - Importar desde Excel/CSV/JSON
  - Sincronización con WooCommerce
  - Imágenes y stock
  - Categorías y marcas

- ✅ **Dashboard React Intuitivo:**
  - Monitoreo de agentes
  - Métricas y analytics
  - Editor de prompts
  - Configuración en tiempo real

- ✅ **GitHub Sync:**
  - Push automático
  - Historial de cambios
  - Control de versiones

- ✅ **Todo en Español** sin datos demo

## 🏗️ Estructura

```
.
├── artifacts/              # Apps desplegables
│   ├── api-server/         # API Express (PRINCIPAL)
│   ├── bot-dashboard/      # Dashboard React
│   └── mockup-sandbox/     # Sandbox de UI
├── lib/                    # Librerías compartidas
│   ├── db/                # Base de datos (Drizzle ORM)
│   ├── api-spec/          # OpenAPI + Orval
│   ├── api-zod/           # Schemas Zod generados
│   └── api-client-react/  # Hooks React generados
├── scripts/               # Scripts de utilidad
├── .env                   # Variables de entorno (local)
├── .env.example           # Plantilla de .env
├── pnpm-workspace.yaml    # Configuración workspace
└── package.json           # Root workspace
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Base de datos (REQUERIDO)
DATABASE_URL=postgresql://user:pass@host:5432/db

# API Server
PORT=3000
NODE_ENV=development|production

# Proveedores IA (al menos uno)
OPENAI_API_KEY=sk-...        # OpenAI
GROQ_API_KEY=...             # Groq
ANTHROPIC_API_KEY=...        # Anthropic
# ... otros
```

**[Ver todas las variables →](./SETUP_GUIDE.md#4-variables-de-entorno-importantes)**

## 📦 Comandos Principales

```bash
# Instalación
pnpm install

# Build y typecheck
pnpm run build
pnpm run typecheck

# Servidor API
pnpm --filter @workspace/api-server run dev    # Desarrollo
pnpm --filter @workspace/api-server run build  # Build
pnpm --filter @workspace/api-server run start  # Producción

# Base de datos
pnpm --filter @workspace/db run push           # Migraciones
pnpm --filter @workspace/db run generate       # Generar nuevas

# OpenAPI Codegen
pnpm --filter @workspace/api-spec run codegen
```

**[Ver más comandos →](./SETUP_GUIDE.md#comandos-útiles)**

## 🚢 Despliegue

### Local

```bash
pnpm install
pnpm run build
pnpm --filter @workspace/api-server run dev
```

### Producción (EasyPanel)

1. [Configura el repo en GitHub](https://github.com/new)
2. [Sigue la guía de EasyPanel](./EASYPANEL_DEPLOY.md)
3. Deploy automático con cada push

### Otros servicios

- Vercel: Node.js compatible
- Railway: Soporta pnpm workspace
- Render: Requiere script de build custom
- Heroku: Legacy (no recomendado)

## 🔐 Seguridad

- ✅ Validación Zod en todas las APIs
- ✅ CORS configurado
- ✅ Rate limiting (implementable)
- ✅ Hashing de contraseñas (si aplica)
- ✅ Variables de entorno sensibles en `.env`
- ✅ No incluir `.env` en Git

## 📊 Stack Técnico

- **Runtime:** Node.js 24
- **Gestor paquetes:** pnpm 10.29.1
- **Lenguaje:** TypeScript 5.9
- **API Framework:** Express 5
- **Base de datos:** PostgreSQL + Drizzle ORM
- **Validation:** Zod v4
- **ORM:** Drizzle ORM
- **WhatsApp:** Baileys 7.0
- **UI:** React 19 + Vite
- **Styling:** Tailwind CSS 4
- **Build:** esbuild + tsx
- **Codegen:** Orval

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m "Add: mi-feature"`
4. Push: `git push origin feature/mi-feature`
5. PR: Abre un Pull Request

## 📝 Licencia

MIT

## 🆘 Soporte

- 📖 [Documentación](./SETUP_GUIDE.md)
- 🚀 [Despliegue](./EASYPANEL_DEPLOY.md)
- 🐛 [Issues](https://github.com/tu-usuario/bot-agente-ventas/issues)
- 💬 [Discussions](https://github.com/tu-usuario/bot-agente-ventas/discussions)

## 🎯 Roadmap

- [ ] Integración con Shopify
- [ ] Analytics avanzado
- [ ] Webhooks para eventos
- [ ] Multi-idioma en prompts
- [ ] Integración con Telegram
- [ ] Exportación de datos
- [ ] Backup automático
- [ ] Testing automatizado

---

**Versión:** 0.0.0  
**Última actualización:** Marzo 2024  
**Autor:** [Tu Nombre]

¿Necesitas ayuda? [Abre una issue](https://github.com/tu-usuario/bot-agente-ventas/issues) 🚀
