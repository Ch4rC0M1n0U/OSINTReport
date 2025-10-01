import { CookieOptions } from "express";

import { env, isProd } from "@config/env";
import { durationToMs } from "@shared/time";

export const cookieNames = {
  accessToken: "or_at",
  refreshToken: "or_rt",
} as const;

const cookieDomain = env.COOKIE_DOMAIN?.trim();
const shouldAttachDomain =
  cookieDomain !== undefined &&
  cookieDomain.length > 0 &&
  cookieDomain !== "localhost" &&
  cookieDomain !== "127.0.0.1";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  path: "/",
  ...(shouldAttachDomain ? { domain: cookieDomain } : {}),
};

export const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: durationToMs(env.JWT_ACCESS_EXPIRES_IN),
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
};

export const clearedCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 0,
};
