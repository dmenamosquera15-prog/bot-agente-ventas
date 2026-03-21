import { Router, type IRouter } from "express";
import { handleMessage } from "../core/router.js";

const router: IRouter = Router();

router.post("/chat/message", async (req, res) => {
  const { phone, message, clientName } = req.body;

  if (!phone || !message) {
    res.status(400).json({ error: "phone and message are required" });
    return;
  }

  try {
    const result = await handleMessage(phone, message, clientName);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error handling chat message");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
