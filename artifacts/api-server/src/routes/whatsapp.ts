import { Router, type IRouter } from "express";
import { getStatus, connect, disconnect, sendMessage, connectWithPhone, forceReset } from "../services/whatsappService.js";

const router: IRouter = Router();

router.get("/whatsapp/status", async (_req, res) => {
  res.json(getStatus());
});

router.post("/whatsapp/reset", async (req, res) => {
  await forceReset();
  res.json({ success: true, message: "System reset initiated" });
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

router.post("/whatsapp/pairing-code", async (req, res) => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  
  // Call connect with phone to trigger generation
  connect(phone).catch(() => {});
  
  // Wait a bit for it to generate and then return the status
  await new Promise(r => setTimeout(r, 4500));
  
  const status = getStatus();
  if (!status.pairingCode) {
    res.status(400).json({ error: "No se pudo generar el código. Asegúrate de que el número sea correcto y que no estés ya conectado." });
    return;
  }
  res.json({ pairingCode: status.pairingCode });
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
