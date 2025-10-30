import { Router } from "express";

import { requireAuth, requirePermissions } from "@middleware/authenticate";
import { PermissionCode } from "@modules/auth/auth.constants";
import { AuthController } from "@modules/auth/auth.controller";

const authRouter = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/verify-2fa", AuthController.verify2FA);
authRouter.post("/refresh", AuthController.refresh);
authRouter.post("/logout", requireAuth, AuthController.logout);
authRouter.patch("/password", requireAuth, AuthController.changePassword);
authRouter.post("/forgot-password", AuthController.forgotPassword);
authRouter.post("/reset-password", AuthController.resetPassword);
authRouter.post(
  "/register",
  requireAuth,
  requirePermissions(PermissionCode.USERS_WRITE),
  AuthController.register
);
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export { authRouter };
