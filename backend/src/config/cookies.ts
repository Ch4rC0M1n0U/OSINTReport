import { CookieOptions } from "express";

import { env, isProd } from "@config/env";
import { durationToMs } from "@shared/time";

export const cookieNames = {
  accessToken: "or_at",
  refreshToken: "or_rt",
} as const;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  path: "/",
};

if (env.COOKIE_DOMAIN) {
  baseCookieOptions.domain = env.COOKIE_DOMAIN;
}

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
