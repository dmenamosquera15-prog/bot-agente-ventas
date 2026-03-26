import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { connect } from "./services/whatsappService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// --- SERVIDOR TODO-EN-UNO (API + DASHBOARD) ---
// Apuntamos a la carpeta donde Vite dejará los archivos estáticos compilados
const dashboardPath = path.resolve(
  __dirname,
  "../../bot-dashboard/dist/public",
);
app.use(express.static(dashboardPath));

app.use((req, res) => {
  res.sendFile(path.join(dashboardPath, "index.html"));
});
// Auto-connect WhatsApp on startup
connect().catch((err) =>
  logger.warn({ err }, "WhatsApp initial connect failed"),
);

export default app;
