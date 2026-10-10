"use client";

import { useTransition } from "react";
import { submitRemoveStudent } from "@/features/courses/actions";
import { Trash2 } from "lucide-react";

export function RemoveStudentButton({
  enrollmentId,
  courseId,
  studentName,
}: {
  enrollmentId: string;
  courseId: string;
  studentName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    if (confirm(`Are you sure you want to unenroll ${studentName} from this course?`)) {
      startTransition(async () => {
        await submitRemoveStudent(enrollmentId, courseId);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition"
      title="Unenroll student"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span>{isPending ? "Removing…" : "Unenroll"}</span>
    </button>
  );
}
