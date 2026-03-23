import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import clientsRouter from "./clients.js";
import productsRouter from "./products.js";
import conversationsRouter from "./conversations.js";
import metricsRouter from "./metrics.js";
import agentsRouter from "./agents.js";
import agentsEditorRouter from "./agentsEditor.js";
import botConfigRouter from "./botConfig.js";
import whatsappRouter from "./whatsapp.js";
import aiProvidersRouter from "./aiProviders.js";
import importProductsRouter from "./importProducts.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(clientsRouter);
router.use(productsRouter);
router.use(conversationsRouter);
router.use(metricsRouter);
router.use(agentsRouter);
router.use(agentsEditorRouter);
router.use(botConfigRouter);
router.use(whatsappRouter);
router.use(aiProvidersRouter);
router.use(importProductsRouter);

export default router;
