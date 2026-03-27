# Configuración de API Keys - BotVentas

## ⚠️ Error Actual

Tu API key de GitHub Models está **inválida o expirada**.

Error: `401 Incorrect API key provided`

## 🔧 Soluciones

### Opción 1: GitHub Models (GRATIS - Recomendado)

GitHub ofrece acceso GRATIS a modelos de IA a través de GitHub Models.

#### Pasos:

1. Ve a: https://github.com/settings/personal-access-tokens/new
2. Crea un nuevo token Personal Access Token (Fine-grained)
3. Dale estos permisos:
   - `read:packages`
   - `write:packages`
   - `repo` (si lo necesitas)
4. Copia el token generado
5. Reemplaza en `.env`:
   ```
   AI_INTEGRATIONS_OPENAI_API_KEY=[TU_NUEVO_TOKEN_AQUI]
   AI_INTEGRATIONS_OPENAI_BASE_URL=https://models.inference.ai.azure.com
   GITHUB_MODEL=gpt-4o
   ```

#### Modelos disponibles en GitHub Models:

- `gpt-4o` (Recomendado - mejor para IA conversacional)
- `gpt-4-turbo`
- `claude-3.5-sonnet`
- `llama-3.1-405b`

### Opción 2: OpenAI API Key (Pago)

Si prefieres usar OpenAI directamente:

1. Ve a: https://platform.openai.com/api/keys
2. Crea una nueva API key
3. Copia la clave
4. Reemplaza en `.env`:
   ```
   AI_INTEGRATIONS_OPENAI_API_KEY=[TU_API_KEY_OPENAI]
   AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
   GITHUB_MODEL=gpt-4o-mini
   ```

### Opción 3: Usar la IA disponible en Copilot (lo que mencionaste)

Si tienes Copilot con modelos disponibles, podemos:

1. Configurar un endpoint personalizado para Copilot
2. Usar la API de Copilot en lugar de OpenAI

## ✅ Verificar que funciona

Después de actualizar la API key:

```bash
# 1. Actualiza .env con la nueva key
# 2. Reinicia el servidor
npm run dev

# 3. Prueba con un mensaje de WhatsApp pidiendo un link de pago
# El bot debe responder con el link correctamente
```

## 📝 Qué hace la API Key

La API key se usa en varias partes del bot:

1. **Clasificación de intención** - Entender qué quiere el usuario
2. **Generación de respuestas** - Responder de forma natural
3. **Extracción de productos** - Identificar el producto exacto para pagos
4. **Extracción de datos de envío** - Para crear órdenes en WooCommerce
5. **Transcripción de audio** - Si envían notas de voz

## 🆘 Si aún falla

El bot ahora tiene un **fallback automático**:

- Si la API key falla, usará un método simple de regex
- Los links de pago se generarán pero menos precisos
- Una vez arregles la API key, vuelve al funcionamiento normal

Commit: f31a5d99 incluye este fallback automático.

---

**¿Qué opción prefieres usar?** Dime y te ayudaré a configurarlo.
