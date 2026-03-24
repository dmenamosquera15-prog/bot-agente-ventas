import { db } from './lib/db/src/index.js';
import { aiProvidersTable } from './lib/db/src/schema/index.js';
import { eq } from 'drizzle-orm';

async function run() {
  const token = "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";
  const model = "gpt-4o";
  const baseUrl = "https://models.inference.ai.azure.com";

  try {
    // Set all other providers as not default
    await db.update(aiProvidersTable).set({ isDefault: false });

    const existing = await db.query.aiProvidersTable.findFirst({
      where: eq(aiProvidersTable.provider, "github_models"),
    });

    const data = {
      name: "GitHub Models (Free Beta)",
      provider: "github_models",
      apiKey: token,
      baseUrl: baseUrl,
      model: model,
      isActive: true,
      isDefault: true,
    };

    if (existing) {
      console.log("Updating existing GitHub Models provider...");
      await db.update(aiProvidersTable).set(data).where(eq(aiProvidersTable.id, existing.id));
    } else {
      console.log("Inserting new GitHub Models provider...");
      await db.insert(aiProvidersTable).values(data);
    }
    console.log("GitHub Models provider setup complete!");
  } catch (err) {
    console.error("Error setting up provider:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
