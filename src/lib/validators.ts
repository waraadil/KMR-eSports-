import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username needs at least 3 characters")
    .max(20, "Username max 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password needs at least 8 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

export const registrationInputSchema = z.object({
  tournamentId: z.string().min(1),
  ign: z.string().min(2, "In-game name is required").max(30),
  teamName: z.string().max(40).optional().nullable(),
});

export const createTournamentSchema = z.object({
  title: z.string().min(4).max(80),
  gameId: z.string().min(1),
  description: z.string().min(10).max(2000),
  format: z.string().min(1).max(24),
  mode: z.string().max(24).default(""),
  map: z.string().max(60).default(""),
  platform: z.enum(["Mobile", "PC", "Console"]),
  entryFeePaise: z.number().int().min(0).max(10_000_000),
  prizePoolPaise: z.number().int().min(0).max(1_000_000_000),
  maxSlots: z.number().int().min(2).max(512),
  startsAt: z.string().min(4),
  rules: z.array(z.string().max(300)).max(12).default([]),
  featured: z.boolean().default(false),
});

export const resultsSchema = z.object({
  results: z
    .array(
      z.object({
        userId: z.string().min(1),
        placement: z.number().int().min(1).max(512).nullable(),
        kills: z.number().int().min(0).max(999),
      })
    )
    .min(1)
    .max(512),
});

export const matchCreateSchema = z.object({
  round: z.string().min(1).max(40),
  label: z.string().min(2).max(80),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3, "Enter your email or username").max(120),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8, "Password needs at least 8 characters").max(100),
});

export const supportThreadSchema = z.object({
  subject: z.string().min(3, "Give it a short subject").max(120),
  message: z.string().min(1, "Describe the issue").max(2000),
});

export const supportMessageSchema = z.object({
  body: z.string().min(1, "Message can't be empty").max(2000),
});
