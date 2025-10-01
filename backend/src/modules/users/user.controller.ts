import { Request, Response } from "express";

import { AuthService } from "@modules/auth/auth.service";

export class UserController {
  static async me(req: Request, res: Response) {
    const user = req.user;
    res.json({ user });
  }

  static async profile(req: Request, res: Response) {
    const user = await AuthService.getAuthenticatedUser(req.params.userId);
    res.json({ user });
  }
}
