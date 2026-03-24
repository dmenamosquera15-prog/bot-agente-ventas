---
description: Iniciar el sistema completo (backend + dashboard)
---

## Paso Único — Iniciar el Sistema (Concurrente)

Abre una terminal PowerShell en la raíz del proyecto (`C:\Users\ADMIN\Downloads\davey\Intelligent-Agent-System`) y ejecuta:

```powershell
pnpm dev
```

Este comando iniciará el **Backend** en el puerto 5000 y el **Dashboard** en el puerto 5173 simultáneamente.

Si el comando falla porque los puertos están ocupados, puedes forzar el cierre de procesos antiguos con:
```powershell
taskkill /F /IM node.exe
```

Abre tu navegador en: **http://localhost:5173** 🚀

## Notas Importantes

- El **bot de WhatsApp** responde automáticamente al número `573042748687`.
- La **IA** usa GitHub Models (GPT-4o) con el token configurado en `.env`.
- La **base de datos** es PostgreSQL remoto en `164.68.122.5:6433`.
- Si el bot se desconecta de WhatsApp, escanea el QR en el Dashboard → "WhatsApp".

## Apagar el Sistema

Presiona `Ctrl+C` en la terminal para detener ambos procesos al mismo tiempo.

Si los puertos quedan bloqueados, puedes liberarlos con:
```powershell
Stop-Process -Id $(netstat -ano | findstr :5000 | ForEach-Object { $_.split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -First 1) -Force -ErrorAction SilentlyContinue;
Stop-Process -Id $(netstat -ano | findstr :5173 | ForEach-Object { $_.split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -First 1) -Force -ErrorAction SilentlyContinue;
```
