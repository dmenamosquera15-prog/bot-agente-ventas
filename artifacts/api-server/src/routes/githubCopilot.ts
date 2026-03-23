import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { aiProvidersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const COPILOT_TOKEN_URL = "https://api.github.com/copilot_internal/v2/token";
const COPILOT_BASE_URL = "https://api.githubcopilot.com";

// These client IDs are used by various open-source CLI tools for Copilot device auth
const CLIENT_IDS = [
  "Iv23li2OwkHfrTMFTcIG", // GitHub CLI (gh)
  "Iv1.b507a08c87ecfe98",  // common CLI tool
  "01ab8ac9400c4e429b23",  // VSCode
];

const pendingFlows = new Map<string, {
  deviceCode: string;
  clientId: string;
  interval: number;
  expiresAt: Date;
  lastPoll?: Date;
}>();

async function getCopilotToken(githubToken: string): Promise<{ token: string; expiresAt: number } | null> {
  const headers = {
    Authorization: `token ${githubToken}`,
    "Editor-Version": "vscode/1.91.1",
    "Editor-Plugin-Version": "copilot-chat/0.18.2",
    "User-Agent": "GitHubCopilotChat/0.18.2",
    "Copilot-Integration-Id": "vscode-chat",
    "Accept": "application/json",
  };
  const r = await fetch(COPILOT_TOKEN_URL, { headers });
  if (!r.ok) return null;
  const data = await r.json() as { token?: string; expires_at?: number };
  if (!data.token) return null;
  return { token: data.token, expiresAt: data.expires_at || 0 };
}

// Method 1: Connect using existing PAT (most reliable)
router.post("/github-copilot/connect-pat", async (req, res) => {
  const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!githubToken) { res.status(400).json({ error: "GITHUB_PERSONAL_ACCESS_TOKEN no configurado en los secretos" }); return; }

  try {
    const copilot = await getCopilotToken(githubToken);
    if (!copilot) {
      res.status(400).json({ error: "No se pudo obtener token de Copilot con tu PAT. Verifica que tengas suscripción activa a GitHub Copilot y que el token tenga los permisos necesarios." });
      return;
    }
    await saveCopilotProvider(copilot.token, "gpt-4o");
    res.json({ success: true, message: "GitHub Copilot conectado exitosamente con tu Personal Access Token" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Method 2: Device OAuth flow
router.post("/github-copilot/device-flow", async (req, res) => {
  // Try each client ID until one works
  for (const clientId of CLIENT_IDS) {
    try {
      const response = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, scope: "read:user copilot" }),
      });
      const data = await response.json() as Record<string, string>;
      if (data.error || !data.device_code) continue;

      const flowId = Math.random().toString(36).slice(2);
      pendingFlows.set(flowId, {
        deviceCode: data.device_code,
        clientId,
        interval: parseInt(data.interval || "5"),
        expiresAt: new Date(Date.now() + parseInt(data.expires_in || "900") * 1000),
      });

      res.json({
        flowId,
        userCode: data.user_code,
        verificationUri: data.verification_uri || "https://github.com/login/device",
        expiresIn: data.expires_in,
        interval: data.interval || 5,
        clientId,
      });
      return;
    } catch { continue; }
  }
  res.status(500).json({ error: "No se pudo iniciar el flujo de autorización con ningún cliente disponible" });
});

router.post("/github-copilot/poll/:flowId", async (req, res) => {
  const flow = pendingFlows.get(req.params.flowId);
  if (!flow) { res.status(404).json({ error: "Sesión no encontrada o expirada" }); return; }
  if (new Date() > flow.expiresAt) { pendingFlows.delete(req.params.flowId); res.json({ status: "expired" }); return; }

  // Respect slow_down interval
  const now = new Date();
  if (flow.lastPoll && (now.getTime() - flow.lastPoll.getTime()) < flow.interval * 900) {
    res.json({ status: "pending" }); return;
  }
  flow.lastPoll = now;

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: flow.clientId,
        device_code: flow.deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const tokenData = await tokenResponse.json() as Record<string, string>;
    req.log.info({ tokenData: JSON.stringify(tokenData) }, "Copilot poll response");

    if (tokenData.error === "authorization_pending") { res.json({ status: "pending" }); return; }
    if (tokenData.error === "slow_down") {
      flow.interval = (flow.interval || 5) + 5;
      res.json({ status: "pending", interval: flow.interval }); return;
    }
    if (tokenData.error === "access_denied") {
      pendingFlows.delete(req.params.flowId);
      res.json({ status: "error", error: "Acceso denegado. Asegúrate de aprobar en GitHub." }); return;
    }
    if (tokenData.error) {
      pendingFlows.delete(req.params.flowId);
      res.json({ status: "error", error: tokenData.error_description || tokenData.error }); return;
    }
    if (!tokenData.access_token) { res.json({ status: "pending" }); return; }

    const copilot = await getCopilotToken(tokenData.access_token);
    if (!copilot) {
      pendingFlows.delete(req.params.flowId);
      res.json({ status: "error", error: "Token de GitHub obtenido pero no tiene acceso a Copilot. ¿Tienes suscripción activa?" }); return;
    }

    await saveCopilotProvider(copilot.token, "gpt-4o");
    pendingFlows.delete(req.params.flowId);
    res.json({ status: "success", message: "GitHub Copilot conectado exitosamente" });
  } catch (err) {
    req.log.error({ err }, "Copilot poll failed");
    res.status(500).json({ status: "error", error: String(err) });
  }
});

async function saveCopilotProvider(token: string, model: string) {
  await db.update(aiProvidersTable).set({ isDefault: false });
  const existing = await db.query.aiProvidersTable.findFirst({ where: eq(aiProvidersTable.provider, "github_copilot") });
  const data = { name: "GitHub Copilot", provider: "github_copilot", apiKey: token, baseUrl: COPILOT_BASE_URL, model, isActive: true, isDefault: true };
  if (existing) await db.update(aiProvidersTable).set(data).where(eq(aiProvidersTable.id, existing.id));
  else await db.insert(aiProvidersTable).values(data);
}

router.get("/github-copilot/status", async (_req, res) => {
  const hasPat = !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const existing = await db.query.aiProvidersTable.findFirst({ where: eq(aiProvidersTable.provider, "github_copilot") });
  res.json({ connected: !!existing, hasPat, model: existing?.model, isDefault: existing?.isDefault });
});

export default router;
