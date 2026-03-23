import { Router, type IRouter } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const router: IRouter = Router();
const exec = promisify(execFile);
const REPO_ROOT = path.resolve("/home/runner/workspace");

async function run(cmd: string, args: string[], env?: Record<string, string>): Promise<{ stdout: string; stderr: string }> {
  const result = await exec(cmd, args, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env, HOME: "/home/runner" },
    timeout: 60000,
  });
  return { stdout: result.stdout || "", stderr: result.stderr || "" };
}

router.get("/git/status", async (_req, res) => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const repoUrl = process.env.GIT_REPO_URL || "https://github.com/daveymena/bot-agente-ventas3.git";
  res.json({
    configured: !!token,
    repoUrl,
    ready: !!token && !!repoUrl,
  });
});

router.post("/git/push", async (req, res) => {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const repoUrl = process.env.GIT_REPO_URL || "https://github.com/daveymena/bot-agente-ventas3.git";

  if (!token) { res.status(400).json({ error: "GITHUB_PERSONAL_ACCESS_TOKEN not configured" }); return; }

  const repoWithToken = repoUrl.replace("https://", `https://${token}@`);
  const branch = req.body.branch || "main";
  const message = req.body.message || `feat: update bot - ${new Date().toLocaleString("es-MX")}`;
  const logs: string[] = [];

  try {
    const gitEnv = {
      GIT_AUTHOR_NAME: "Bot Inteligente",
      GIT_AUTHOR_EMAIL: "bot@botinteligente.app",
      GIT_COMMITTER_NAME: "Bot Inteligente",
      GIT_COMMITTER_EMAIL: "bot@botinteligente.app",
    };

    // Set remote
    try {
      await run("git", ["remote", "set-url", "origin", repoWithToken], gitEnv);
      logs.push("✓ Remote actualizado");
    } catch {
      await run("git", ["remote", "add", "origin", repoWithToken], gitEnv);
      logs.push("✓ Remote añadido");
    }

    // Stage all changes
    await run("git", ["add", "-A"], gitEnv);
    logs.push("✓ Cambios añadidos al staging");

    // Check if anything to commit
    const { stdout: statusOut } = await run("git", ["status", "--porcelain"], gitEnv);
    if (!statusOut.trim()) {
      logs.push("ℹ️ No hay cambios nuevos");
      res.json({ success: true, message: "No hay cambios para subir", logs });
      return;
    }

    // Commit
    await run("git", ["commit", "-m", message], gitEnv);
    logs.push(`✓ Commit: "${message}"`);

    // Push
    await run("git", ["push", "-u", "origin", branch, "--force-with-lease"], gitEnv);
    logs.push(`✓ Push exitoso → ${branch}`);

    res.json({ success: true, message: "Código subido exitosamente", logs, branch, repoUrl: repoUrl.replace(/\/\/.*@/, "//") });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logs.push(`❌ Error: ${errMsg}`);
    req.log.error({ err }, "Git push failed");
    res.status(500).json({ success: false, error: errMsg, logs });
  }
});

export default router;
