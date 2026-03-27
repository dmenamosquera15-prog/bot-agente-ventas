# WhatsApp Connection Conflict Error Fix

## El Problema: "Stream Errored (conflict)"

### Error Observado

```
[BACKEND] [19:32:30.092] INFO (18888): connection errored
[BACKEND]     trace: "Error: Stream Errored (conflict)
```

### ¿Qué causa este error?

El error `Stream Errored (conflict)` en Baileys ocurre cuando hay conflictos en la conexión WebSocket con WhatsApp. Las causas principales son:

1. **Múltiples conexiones simultáneas**: Varias instancias del bot intentan conectar con las mismas credenciales de autenticación.

2. **Conflictos de sincronización**: WhatsApp detecta que la misma sesión intenta conectar desde múltiples lugares o dispositivos.

3. **Credenciales corruptas**: El archivo de autenticación se daña o se intenta usar con datos inconsistentes.

4. **Timeouts de red**: La conexión se pierde durante puntos críticos de sincronización del protocolo Noise/Signal de WhatsApp.

5. **Pre-keys agotadas**: El servidor reporta falta de pre-keys para encriptación.

---

## La Solución Implementada

### Cambios en `artifacts/api-server/src/services/whatsappService.ts`

#### 1. **Error Tracking** (Líneas 87-90)

```typescript
let lastErrorTime = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
const ERROR_RESET_WINDOW = 30000; // 30 segundos
```

Rastreamos errores consecutivos para detectar cuando hay conflictos repetitivos.

#### 2. **Detección Explícita de Conflictos** (Líneas 217-249)

```typescript
sock.ev.on("connection.update", async (update) => {
  if (connection === "close") {
    // ...
    const isConflict =
      errorMessage.includes("conflict") ||
      errorMessage.includes("Stream Errored");

    if (isConflict) {
      // Track consecutive errors
      // Si hay 3+ conflictos en 30s, hacer reset forzado
      // Si no, intentar reconexión con backoff exponencial
    }
  }
});
```

#### 3. **Health Check Mejorado** (Líneas 94-111)

```typescript
await sock.query({
  tag: "iq",
  attrs: { to: S_WHATSAPP_NET, type: "get", xmlns: "w:p", id: "ping" },
});
```

En lugar de solo verificar si existe `sock.user`, ahora hacemos un ping real para verificar que la conexión está viva. Esto detecta "conexiones zombie" que están abiertas pero no funcionales.

#### 4. **Socket Cleanup Mejorado** (Líneas 149-166)

```typescript
if (phoneForPairing && sock && !isConnected) {
  logger.info("Forcing reconnection for pairing code...");
  try {
    sock.end(undefined);
  } catch {}
  sock = null;
}

if (sock) {
  try {
    sock.end(undefined);
  } catch {}
  sock = null;
}
```

Aseguramos limpiar completamente el socket anterior antes de crear uno nuevo, evitando conflictos.

#### 5. **Manejo de Credenciales Seguro** (Líneas 343-350)

```typescript
sock.ev.on("creds.update", async (data) => {
  try {
    await saveCreds();
  } catch (err) {
    logger.error({ err }, "Failed to save credentials");
    // No lanzar excepción - las credenciales se guardarán en la próxima actualización
  }
});
```

Evitamos que un error en guardado de credenciales quiebre la conexión completa.

---

## Flujo de Recuperación

### Escenario 1: Primer Conflicto

1. Se detecta `Stream Errored (conflict)`
2. `consecutiveErrors = 1`
3. `SafeReconnectManager` registra desconexión
4. Espera backoff exponencial (1-2 segundos)
5. Intenta reconectar con socket limpio

### Escenario 2: Múltiples Conflictos (2-3 en 30 segundos)

1. Cada conflicto incrementa `consecutiveErrors`
2. Los retries continúan con backoff creciente
3. Si alcanza 3 conflictos, se activa reset forzado

### Escenario 3: Reset Forzado

1. Se limpia completamente el directorio `whatsapp_auth`
2. Se genera nuevo QR code
3. Se requiere reescaneado manual
4. Contador de errores se resetea

---

## Cómo Investigar si Persiste

### 1. Verificar logs

```bash
# Ver últimas líneas de logs
tail -50 server.log | grep -i "conflict\|stream\|whatsapp"
```

### 2. Verificar directorio de auth

```bash
# El directorio debe existir con archivos
ls -la whatsapp_auth/
```

### 3. Verificar múltiples procesos

```bash
# Asegurarse de que solo hay UNA instancia corriendo
ps aux | grep "api-server\|node"
```

### 4. Verificar archivos de credenciales corruptos

```bash
# Si hay error persistente, limpiar y comenzar de nuevo
rm -rf whatsapp_auth/
# Luego reiniciar el bot y escanear QR
```

---

## Commit Relacionado

- **Commit 1** (`7aef7b18`): Export SaaS schema tables (error de build)
- **Commit 2** (`ac7f8a97`): WhatsApp conflict handling improvements

---

## Próximos Pasos si Persiste

Si el error continúa después de estos cambios:

1. **Verificar que solo hay una instancia**: Si hay múltiples procesos Node corriendo, causarán conflictos automáticos.

2. **Limpiar base de datos de auth**:

   ```bash
   rm -rf whatsapp_auth/
   ```

3. **Reiniciar desde cero**:
   - Generar nuevo QR
   - Escanear con teléfono
   - Esperar 30 segundos para sincronización completa

4. **Revisar logs de WhatsApp**: A veces WhatsApp requiere verificación de dos factores o hay cambios de sesión en la app.

---

## Monitoreo Continuo

El sistema ahora registra:

- ✅ Cada conflicto detectado
- ✅ Número de reconexiones intentadas
- ✅ Cuando se activa reset forzado
- ✅ Estado del socket (zombie vs. healthy)

Estos logs ayudan a identificar patrones y problemas de fondo.
