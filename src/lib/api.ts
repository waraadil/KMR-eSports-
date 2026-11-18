import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RegistrationError } from "@/lib/registration";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues[0]?.message ?? "Invalid input", 422);
  }
  if (err instanceof RegistrationError) {
    return jsonError(err.message, err.status);
  }
  console.error("[KMR API]", err);
  return jsonError("Something went wrong on our side. Try again.", 500);
}
