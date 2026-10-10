import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/config/env";
import type { RoleKey } from "@prisma/client";

export const SESSION_COOKIE_NAME = "classbridge_session";

export type SessionMembership = {
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  roleKey: RoleKey;
  institutionUserId: string;
};

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  isPlatformSuperAdmin: boolean;
  activeMembership?: SessionMembership;
  memberships: SessionMembership[];
  createdAtTimestamp: number;
};

const DEFAULT_SECRET = "classbridge-development-auth-secret-key-32chars";

function getSecretKey(): Uint8Array {
  const secret = serverEnv.AUTH_SECRET || DEFAULT_SECRET;
  const encoder = new TextEncoder();
  return encoder.encode(secret.padEnd(32, "0").slice(0, 32));
}

/** Simple AES-GCM encryption using Web Crypto API */
async function encryptPayload(data: object): Promise<string> {
  const keyBuffer = getSecretKey();
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    encodedData as unknown as BufferSource,
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString("base64url");
}

/** AES-GCM decryption */
async function decryptPayload<T>(token: string): Promise<T | null> {
  try {
    const combined = Buffer.from(token, "base64url");
    if (combined.length < 13) return null;

    const iv = new Uint8Array(combined.subarray(0, 12));
    const encrypted = new Uint8Array(combined.subarray(12));

    const keyBuffer = getSecretKey();
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer.buffer as ArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      encrypted as unknown as BufferSource,
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error("Failed to decrypt session payload:", error);
    return null;
  }
}

/**
 * Encrypt and set HTTP-only session cookie.
 */
export async function createSessionCookie(userPayload: Omit<SessionUser, "createdAtTimestamp">): Promise<void> {
  const cookieStore = await cookies();
  const fullUser: SessionUser = {
    ...userPayload,
    createdAtTimestamp: Date.now(),
  };

  const encryptedToken = await encryptPayload(fullUser);

  cookieStore.set(SESSION_COOKIE_NAME, encryptedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Retrieve and decrypt current session user.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;
  return decryptPayload<SessionUser>(token);
}

/**
 * Destroy session cookie (Logout).
 */
export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
