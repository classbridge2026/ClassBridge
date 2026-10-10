"use client";

import Swal from "sweetalert2";

/** Plain-language fallback when a technical error string is not safe to show. */
const FALLBACK_ERROR =
  "Something went wrong. Please try again. If it keeps happening, contact your administrator.";

/**
 * Turn technical / raw JS errors into short messages a non-technical user can understand.
 */
export function toUserMessage(input: unknown, fallback = FALLBACK_ERROR): string {
  if (input == null) return fallback;

  const raw =
    typeof input === "string"
      ? input
      : input instanceof Error
        ? input.message
        : typeof input === "object" && "message" in input && typeof (input as { message: unknown }).message === "string"
          ? (input as { message: string }).message
          : "";

  const message = raw.trim();
  if (!message) return fallback;

  // Already written for humans (our server actions)
  if (
    message.length < 220 &&
    !/^(Error:|TypeError|ReferenceError|SyntaxError|Prisma|ECONN|ENOENT|fetch failed)/i.test(message) &&
    !/at\s+\S+\s+\(/.test(message) &&
    !/node_modules|webpack|turbopack|\.tsx?:/i.test(message)
  ) {
    return message;
  }

  const lower = message.toLowerCase();
  if (lower.includes("unique constraint") || lower.includes("already exists")) {
    return "That record already exists. Please use a different value.";
  }
  if (lower.includes("foreign key") || lower.includes("constraint")) {
    return "This action conflicts with related records. Check your selections and try again.";
  }
  if (lower.includes("unauthorized") || lower.includes("permission") || lower.includes("forbidden")) {
    return "You do not have permission to do that.";
  }
  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("failed to fetch")) {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  if (lower.includes("timeout")) {
    return "The request took too long. Please try again.";
  }

  return fallback;
}

export function showError(message: unknown, title = "Something went wrong") {
  return Swal.fire({
    icon: "error",
    title,
    text: toUserMessage(message),
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
  });
}

export function showSuccess(message: string, title = "Done") {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
    timer: 2800,
    timerProgressBar: true,
  });
}

export function showInfo(message: string, title = "Notice") {
  return Swal.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
  });
}

export async function showConfirm(options: {
  title?: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  const result = await Swal.fire({
    icon: "warning",
    title: options.title ?? "Are you sure?",
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? "Yes, continue",
    cancelButtonText: options.cancelText ?? "Cancel",
    confirmButtonColor: options.danger ? "#dc2626" : "#2563eb",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export { Swal };
