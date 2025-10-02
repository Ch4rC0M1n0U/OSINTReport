import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

import { AuthService } from "@modules/auth/auth.service";
import { prisma } from "@shared/prisma";

export class UserController {
  static async me(req: Request, res: Response) {
    const user = req.user;
    res.json({ user });
  }

  static async profile(req: Request, res: Response) {
    const user = await AuthService.getAuthenticatedUser(req.params.userId);
    res.json({ user });
  }

  static async list(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sessions: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include last login
    const usersWithLastLogin = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      matricule: user.matricule,
      email: user.email,
      role: user.role.name,
      status: user.status,
      lastLoginAt: user.sessions[0]?.createdAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({ users: usersWithLastLogin });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    res.json({ user });
  }

  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    // Check if user exists and get their role
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingUser) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    // Prevent suspension of admin users
    if (existingUser.role.name === "admin" && status === "SUSPENDED") {
      res.status(403).json({ 
        message: "Impossible de suspendre un administrateur. Veuillez d'abord rétrograder l'utilisateur." 
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
    });

    res.json({ user });
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { firstName, lastName, email, roleId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        roleId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ user });
  }

  static async getRoles(req: Request, res: Response) {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ roles });
  }

  static async updateProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const { firstName, lastName, email, avatarUrl } = req.body;

    // Check if email is already used by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        res.status(409).json({ message: "Cet email est déjà utilisé" });
        return;
      }
    }

    let finalAvatarUrl = avatarUrl;

    // If avatarUrl is an external URL, download it and save as file
    if (avatarUrl && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://"))) {
      try {
        const response = await fetch(avatarUrl);
        if (!response.ok) {
          res.status(400).json({ message: "Impossible de télécharger l'image depuis l'URL" });
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
          res.status(400).json({ message: "L'URL ne pointe pas vers une image" });
          return;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const sharp = require("sharp");

        // Resize and convert to PNG
        const resizedImage = await sharp(buffer)
          .resize(512, 512, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        // Generate unique filename
        const filename = `${userId}-${crypto.randomBytes(8).toString("hex")}.png`;
        const avatarDir = path.join(__dirname, "../../../..", "frontend", "public", "images", "avatars");
        const avatarPath = path.join(avatarDir, filename);
        finalAvatarUrl = `/images/avatars/${filename}`;

        // Ensure directory exists
        await fs.mkdir(avatarDir, { recursive: true });

        // Delete old avatar file if exists
        const oldUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });

        if (oldUser?.avatarUrl && oldUser.avatarUrl.startsWith("/images/avatars/")) {
          const oldFilename = path.basename(oldUser.avatarUrl);
          const oldPath = path.join(avatarDir, oldFilename);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            // Ignore if file doesn't exist
          }
        }

        // Save new file
        await fs.writeFile(avatarPath, resizedImage);
      } catch (error) {
        console.error("Error downloading/processing remote avatar:", error);
        res.status(500).json({ message: "Erreur lors du téléchargement de l'image" });
        return;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(finalAvatarUrl !== undefined && { avatarUrl: finalAvatarUrl }),
      },
    });

    // Return full user data with permissions
    const user = await AuthService.getAuthenticatedUser(userId);
    res.json({ user });
  }

  static async uploadAvatar(req: Request, res: Response) {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "Aucun fichier fourni" });
      return;
    }

    try {
      const sharp = require("sharp");
      
      // Resize image to 512x512 and convert to PNG
      const resizedImage = await sharp(file.buffer)
        .resize(512, 512, {
          fit: "cover",
          position: "center",
        })
        .png()
        .toBuffer();

      // Generate unique filename
      const filename = `${userId}-${crypto.randomBytes(8).toString("hex")}.png`;
      
      // Define paths
      const avatarDir = path.join(__dirname, "../../../..", "frontend", "public", "images", "avatars");
      const avatarPath = path.join(avatarDir, filename);
      const avatarUrl = `/images/avatars/${filename}`;

      // Ensure directory exists
      await fs.mkdir(avatarDir, { recursive: true });

      // Delete old avatar file if exists
      const oldUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });

      if (oldUser?.avatarUrl && oldUser.avatarUrl.startsWith("/images/avatars/")) {
        const oldFilename = path.basename(oldUser.avatarUrl);
        const oldPath = path.join(avatarDir, oldFilename);
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          // Ignore if file doesn't exist
        }
      }

      // Save new file
      await fs.writeFile(avatarPath, resizedImage);

      // Update user avatar URL in database
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      // Return full user data with permissions
      const user = await AuthService.getAuthenticatedUser(userId);
      res.json({ user, message: "Avatar mis à jour avec succès" });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ message: "Erreur lors du traitement de l'image" });
    }
  }
}
