import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { join } from "path";

import { env } from "@config/env";
import { logger } from "@config/logger";
import { errorHandler } from "@middleware/errorHandler";
import { notFound } from "@middleware/notFound";
import { router } from "@routes/index";

const allowedOrigins = env.FRONTEND_URL.split(",").map((origin) => origin.trim());

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine non autorisée : ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Trop de requêtes, veuillez réessayer plus tard.",
});

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Servir les fichiers statiques (logos, avatars, etc.)
app.use("/uploads", express.static(join(__dirname, "../uploads")));

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
