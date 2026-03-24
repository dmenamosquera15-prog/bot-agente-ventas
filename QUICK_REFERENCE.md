# 🎯 Referencias Rápidas

## 📖 Documentación

- **[README.md](./README.md)** - Visión general y descripción del proyecto
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Instalación local completa + deploy a la nube
- **[EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md)** - Guía paso a paso para despliegue en EasyPanel
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Checklist de configuración y próximos pasos
- **[replit.md](./replit.md)** - Arquitectura del proyecto y documentación técnica

## ⚡ Primeros Pasos

### 1. Instalación

```bash
git clone <repo>
cd <repo>
pnpm install
```

### 2. Configurar BD Local

```bash
# Crear BD PostgreSQL
createdb intelligent_agent_db

# Actualizar .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/intelligent_agent_db

# Ejecutar migraciones
pnpm --filter @workspace/db run push
```

### 3. Ejecutar Localmente

```bash
# Servidor en desarrollo
pnpm --filter @workspace/api-server run dev

# Acceder a http://localhost:3000
```

## 🚀 Despliegue EasyPanel

### 1. GitHub

```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

### 2. EasyPanel

- Nueva Aplicación → Node.js
- Conectar repositorio
- Build: `pnpm install && pnpm run build`
- Start: `pnpm --filter @workspace/api-server run start`
- Agregar variables de entorno
- Deploy

### 3. Verificar

```
https://tu-dominio.easypanel.io/api/health
```

## 🛠️ Comandos Comunes

### Desarrollo

| Comando                                         | Descripción                |
| ----------------------------------------------- | -------------------------- |
| `pnpm install`                                  | Instalar dependencias      |
| `pnpm run build`                                | Build completo             |
| `pnpm run typecheck`                            | Verificar tipos TypeScript |
| `pnpm --filter @workspace/api-server run dev`   | Servidor en desarrollo     |
| `pnpm --filter @workspace/api-server run build` | Build servidor             |
| `pnpm --filter @workspace/api-server run start` | Ejecutar servidor          |

### Base de Datos

| Comando                                    | Descripción                |
| ------------------------------------------ | -------------------------- |
| `pnpm --filter @workspace/db run push`     | Ejecutar migraciones       |
| `pnpm --filter @workspace/db run generate` | Generar nuevas migraciones |
| `pnpm --filter @workspace/db run drop`     | Limpiar BD (cuidado!)      |

### Codegen

| Comando                                         | Descripción                     |
| ----------------------------------------------- | ------------------------------- |
| `pnpm --filter @workspace/api-spec run codegen` | Generar tipos Zod y hooks React |

## 📁 Estructura

```
.
├── artifacts/api-server/      ← API principal (Express)
├── artifacts/bot-dashboard/   ← Dashboard React
├── lib/db/                    ← Base de datos
├── lib/api-spec/              ← Especificación OpenAPI
├── lib/api-zod/               ← Schemas Zod
├── lib/api-client-react/      ← Hooks React
├── scripts/                   ← Utilidades
├── .env                       ← Configuración local
├── .env.example               ← Plantilla
├── pnpm-workspace.yaml        ← Config workspace
└── package.json               ← Root scripts
```

## 🔧 Variables de Entorno

```env
# Base de datos (REQUERIDO)
DATABASE_URL=postgresql://user:pass@host:5432/db

# API
PORT=3000
NODE_ENV=development

# IA (al menos uno)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...

# Opcional
GITHUB_TOKEN=ghp_...
WHATSAPP_PHONE_NUMBER=+1234567890
LOG_LEVEL=info
```

[Ver todas →](./SETUP_GUIDE.md#4-variables-de-entorno-importantes)

## 🚨 Troubleshooting

### Build falla

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### PostgreSQL no conecta

```bash
# Verificar BD existe
psql -U postgres -l | grep intelligent_agent_db

# Verificar DATABASE_URL
cat .env | grep DATABASE_URL

# Conectar directamente
psql postgresql://postgres:password@localhost:5432/intelligent_agent_db
```

### Migraciones fallan

```bash
pnpm --filter @workspace/db run push-force
```

### Puerto en uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

## 📞 Recursos

- [Express.js](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod](https://zod.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [EasyPanel](https://docs.easypanel.io/)

## ✅ Checklist Pre-Deploy

- [ ] `pnpm run build` sin errores
- [ ] `pnpm run typecheck` sin errores
- [ ] `pnpm --filter @workspace/api-server run dev` funciona localmente
- [ ] `curl http://localhost:3000/api/health` responde
- [ ] `DATABASE_URL` configurada correctamente
- [ ] `.env` no está en Git (revisar `.gitignore`)
- [ ] Último commit pusheado a GitHub
- [ ] Variables de entorno configuradas en EasyPanel
- [ ] Deploy iniciado en EasyPanel
- [ ] Aplicación responde en `https://tu-dominio.easypanel.io/api/health`

## 📝 Git Workflow

```bash
# Ver cambios
git status

# Agregar cambios
git add .
git add archivo.ts

# Commit
git commit -m "Tipo: descripción"

# Push
git push origin main

# Ver historial
git log --oneline -10

# Ver cambios sin stagear
git diff
```

## 🎓 Guías Recomendadas

1. **Instalación local:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Despliegue:** [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md)
3. **Próximos pasos:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
4. **Arquitectura:** [replit.md](./replit.md)

## 🆘 ¿Necesitas Ayuda?

1. Revisa la documentación relevante
2. Busca en los logs: `pnpm --filter @workspace/api-server run logs`
3. Intenta reproducir localmente
4. Abre un issue en GitHub

---

**¡Listo para comenzar!** 🚀

Para empezar, lee [SETUP_GUIDE.md](./SETUP_GUIDE.md)
