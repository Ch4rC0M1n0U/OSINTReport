import { Router } from "express";
import { authRouter } from "@modules/auth/auth.router";
import { reportRouter } from "@modules/reports/report.router";
import { entityRouter } from "@modules/reports/entity.router";
import { userRouter } from "@modules/users/user.router";
import { smtpRouter } from "@modules/smtp/smtp.router";
import correlationRouter from "@modules/correlations/correlation.router";
import searchRouter from "@modules/search/search.router";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/reports", reportRouter);
router.use("/entities", entityRouter);
router.use("/users", userRouter);
router.use("/smtp", smtpRouter);
router.use("/correlations", correlationRouter);
router.use("/search", searchRouter);

export { router };
