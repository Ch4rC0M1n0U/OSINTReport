import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { env } from "@config/env";
import { PermissionCode } from "@modules/auth/auth.constants";
import { durationToMs } from "@shared/time";

export type AccessTokenClaims = {
  sub: string;
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
};

export type RefreshTokenClaims = {
  sub: string;
  sessionId: string;
  jti: string;
};

const jwtIssuer = env.BACKEND_URL;
const jwtAudience = env.FRONTEND_URL;

const accessSecret: Secret = env.JWT_ACCESS_SECRET;
const refreshSecret: Secret = env.JWT_REFRESH_SECRET;

export function signAccessToken(claims: AccessTokenClaims): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: jwtIssuer,
    audience: jwtAudience,
  };

  return jwt.sign(claims, accessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, accessSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
  }) as AccessTokenClaims;
}

export function createRefreshToken(userId: string) {
  const sessionId = uuid();
  const jti = uuid();
  const expiresInMs = durationToMs(env.JWT_REFRESH_EXPIRES_IN);

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: jwtIssuer,
    audience: jwtAudience,
  };

  const token = jwt.sign({ sub: userId, sessionId, jti }, refreshSecret, options);

  const expiresAt = new Date(Date.now() + expiresInMs);

  return { token, sessionId, jti, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  return jwt.verify(token, refreshSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
  }) as RefreshTokenClaims;
}
