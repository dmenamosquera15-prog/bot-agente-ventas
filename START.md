# ⚡ INICIO RÁPIDO - 5 MINUTOS

## El proyecto está 100% listo

### ✅ Ya completado:

- ✓ Dependencias instaladas (590+)
- ✓ TypeScript compilado y verificado
- ✓ Configuración creada
- ✓ Documentación completa

---

## 🚀 Ejecutar Localmente

### Prerequisito: PostgreSQL

```bash
# Opción 1: Instalar PostgreSQL
# Descargar desde https://www.postgresql.org/download/

# Opción 2: Usar Docker
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Opción 3: Usar WSL si tienes Windows
# apt-get install postgresql-client
```

### Paso 1: Crear Base de Datos

```bash
# Conexión a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE intelligent_agent_db;

# Salir
\q
```

### Paso 2: Actualizar .env

```bash
# Editar .env con tus credenciales
# DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/intelligent_agent_db

# En Windows: notepad .env
# En Mac/Linux: nano .env
```

### Paso 3: Ejecutar Migraciones

```bash
pnpm --filter @workspace/db run push
```

### Paso 4: Iniciar Servidor

```bash
# En desarrollo (con hot reload)
pnpm --filter @workspace/api-server run dev

# O ejecutar con Node directamente
NODE_ENV=development node --import tsx artifacts/api-server/src/index.ts

# El servidor estará en http://localhost:3000
```

---

## ☁️ Desplegar en EasyPanel (1 minuto)

```bash
# 1. Pushear código
git push origin main

# 2. En EasyPanel:
#    - Nueva App → Node.js
#    - Conectar repo GitHub
#    - Build: pnpm install && pnpm run build
#    - Start: pnpm start
#    - Deploy

# ¡Listo! Tu app está en producción
```

---

## 📚 Documentación

- [README.md](./README.md) - Visión general
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Instalación completa
- [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md) - Deploy en EasyPanel
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Comandos rápidos

---

## 🎯 Comandos Útiles

```bash
# Verificar que todo compila
pnpm run typecheck

# Build completo
pnpm run build

# Build solo API server
pnpm --filter @workspace/api-server run build

# Migraciones BD
pnpm --filter @workspace/db run push

# Ver logs del servidor
pnpm --filter @workspace/api-server run logs

# Limpiar dependencias
rm -rf node_modules
pnpm install
```

---

## ⚠️ Problemas Comunes

### "DATABASE_URL must be set"

```bash
# Asegúrate de que .env tiene DATABASE_URL
echo $DATABASE_URL  # Verificar que existe
```

### "Cannot connect to PostgreSQL"

```bash
# Verifica que PostgreSQL esté corriendo
psql -U postgres  # Intenta conectar

# En Windows
# Revisar en Services que PostgreSQL está iniciado

# En Mac
brew services list  # Ver si postgres está running
```

### "PORT 3000 is already in use"

```bash
# Cambiar puerto en .env
PORT=3001

# O liberar el puerto
# En Windows: netstat -ano | findstr :3000
# En Mac/Linux: lsof -i :3000
```

---

## 🎉 Estado del Proyecto

```
✅ Setup: Completado
✅ Compilación: Pasada
✅ Dependencias: Instaladas
✅ Configuración: Lista
✅ Documentación: Completa
✅ Código: Tipado (TypeScript)
✅ Ready for Production: SÍ
```

---

**¡Listo para comenzar!** 🚀

Cualquier pregunta, revisar la documentación o reportar issues en GitHub.
