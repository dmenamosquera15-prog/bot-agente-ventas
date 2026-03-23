import { Router, type IRouter } from "express";
import { getStatus, connect, disconnect, sendMessage } from "../services/whatsappService.js";

const router: IRouter = Router();

router.get("/whatsapp/status", async (_req, res) => {
  res.json(getStatus());
});

router.post("/whatsapp/connect", async (req, res) => {
  const status = getStatus();
  if (status.connected) {
    res.json({ success: true, message: "Already connected", status });
    return;
  }
  connect().catch(() => {});
  res.json({ success: true, message: "Connecting...", status: getStatus() });
});

router.post("/whatsapp/disconnect", async (req, res) => {
  await disconnect();
  res.json({ success: true, message: "Disconnected" });
});

router.post("/whatsapp/send", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ error: "phone and message required" });
    return;
  }
  const ok = await sendMessage(phone, message);
  res.json({ success: ok });
});

export default router;
