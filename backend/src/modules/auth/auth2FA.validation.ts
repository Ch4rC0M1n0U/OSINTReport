import { z } from "zod";

export const verify2FASchema = z.object({
  tempToken: z.string(),
  token: z.string().length(6),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;
