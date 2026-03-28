import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { aiProvidersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const MODELS: Record<string, string[]> = {
  openai: [
    "gpt-5-mini",
    "gpt-5",
    "gpt-5.2",
    "gpt-4o",
    "gpt-4o-mini",
    "o4-mini",
  ],
  groq: [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  grok: ["grok-3", "grok-3-mini", "grok-3-fast", "grok-2-1212", "grok-beta"],
  anthropic: [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ],
  openrouter: [
    "meta-llama/llama-3.1-8b-instruct",
    "mistralai/mistral-7b-instruct",
    "google/gemma-2-9b-it",
  ],
  github_copilot: [
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3.5-sonnet",
    "claude-3.7-sonnet",
    "claude-3.7-sonnet-thought",
    "gemini-2.0-flash",
    "o3-mini",
    "o1",
  ],
  github_models: [
    "gpt-4o",
    "gpt-4o-mini",
    "o3-mini",
    "o1",
    "phi-3-medium",
    "phi-3-mini",
    "mistral-large-2407",
    "command-r-plus-08-2024",
  ],
  ollama: [
    "claude-3.5-sonnet",
    "claude-3-haiku",
    "llama3.1",
    "mistral",
    "qwen2.5",
    "phi3",
    "kimi-k2.5:cloud",
    "glm-5:cloud",
    "minimax-m2.7:cloud",
    "qwen3.5:cloud",
    "glm-4.7-flash",
    "qwen3.5",
  ],
};

const BASE_URLS: Record<string, string> = {
  grok: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  anthropic: "https://api.anthropic.com/v1",
  github_models: "https://models.inference.ai.azure.com",
};

router.get("/ai-providers", async (_req, res) => {
  const providers = await db.select().from(aiProvidersTable);
  res.json({
    providers: providers.map((p) => ({
      ...p,
      id: String(p.id),
      apiKey: p.apiKey ? "••••••••" + p.apiKey.slice(-4) : "",
    })),
    availableModels: MODELS,
  });
});

router.get("/ai-providers/models", async (_req, res) => {
  res.json({ models: MODELS });
});

router.post("/ai-providers", async (req, res) => {
  const { name, provider, apiKey, baseUrl, model, isDefault } = req.body;
  if (isDefault) {
    await db.update(aiProvidersTable).set({ isDefault: false });
  }
  const [p] = await db
    .insert(aiProvidersTable)
    .values({
      name,
      provider,
      apiKey,
      baseUrl,
      model,
      isActive: true,
      isDefault: !!isDefault,
    })
    .returning();
  res.status(201).json({ ...p, id: String(p.id), apiKey: "••••" });
});

router.put("/ai-providers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, provider, apiKey, baseUrl, model, isActive, isDefault } =
    req.body;
  const updates: Record<string, unknown> = {
    name,
    provider,
    baseUrl,
    model,
    isActive,
  };
  if (apiKey && !apiKey.startsWith("••••")) updates.apiKey = apiKey;
  if (isDefault) {
    await db.update(aiProvidersTable).set({ isDefault: false });
    updates.isDefault = true;
  }
  const [p] = await db
    .update(aiProvidersTable)
    .set(updates)
    .where(eq(aiProvidersTable.id, id))
    .returning();
  res.json({ ...p, id: String(p.id), apiKey: "••••" });
});

router.delete("/ai-providers/:id", async (req, res) => {
  await db
    .delete(aiProvidersTable)
    .where(eq(aiProvidersTable.id, Number(req.params.id)));
  res.json({ success: true, message: "Deleted" });
});

router.post("/ai-providers/:id/set-default", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(aiProvidersTable).set({ isDefault: false });
  await db
    .update(aiProvidersTable)
    .set({ isDefault: true, isActive: true })
    .where(eq(aiProvidersTable.id, id));
  res.json({ success: true });
});

export default router;
