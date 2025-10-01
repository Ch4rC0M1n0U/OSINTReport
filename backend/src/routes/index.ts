import { Router } from "express";
import { authRouter } from "@modules/auth/auth.router";
import { reportRouter } from "@modules/reports/report.router";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/reports", reportRouter);

export { router };
