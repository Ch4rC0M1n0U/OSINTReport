import { Router } from "express";

import { requireAuth, requirePermissions } from "@middleware/authenticate";
import { PermissionCode } from "@modules/auth/auth.constants";
import { UserController } from "@modules/users/user.controller";

import multer from "multer";

const userRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PNG et JPEG sont autorisés"));
    }
  },
});

// Upload avatar image
userRouter.post("/me/avatar", requireAuth, upload.single("avatar"), UserController.uploadAvatar);

// Update current user's profile (no special permission needed, just authentication)
userRouter.patch("/me/profile", requireAuth, UserController.updateProfile);

// Get all roles (requires users:read permission)
userRouter.get(
  "/roles",
  requireAuth,
  requirePermissions(PermissionCode.USERS_READ),
  UserController.getRoles
);

// List all users (requires users:read permission)
userRouter.get("/", requireAuth, requirePermissions(PermissionCode.USERS_READ), UserController.list);

// Get user by ID (requires users:read permission)
userRouter.get(
  "/:id",
  requireAuth,
  requirePermissions(PermissionCode.USERS_READ),
  UserController.getById
);

// Update user status (requires users:write permission)
userRouter.patch(
  "/:id/status",
  requireAuth,
  requirePermissions(PermissionCode.USERS_WRITE),
  UserController.updateStatus
);

// Update user (requires users:write permission)
userRouter.patch(
  "/:id",
  requireAuth,
  requirePermissions(PermissionCode.USERS_WRITE),
  UserController.update
);

export { userRouter };
