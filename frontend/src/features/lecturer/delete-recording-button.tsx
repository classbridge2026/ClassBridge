"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLecturerRecording } from "@/features/lecturer/actions";

export function DeleteRecordingButton({ recordingId }: { recordingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this recording permanently?")) return;
        startTransition(async () => {
          const result = await deleteLecturerRecording(recordingId);
          if (result.ok) {
            router.push("/lecturer/recordings");
            router.refresh();
          } else {
            window.alert(result.error ?? "Failed to delete recording.");
          }
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
