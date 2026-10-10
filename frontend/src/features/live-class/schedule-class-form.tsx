"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CourseOption = {
  id: string;
  code: string;
  title: string;
};

type ScheduleClassFormProps = {
  courses: CourseOption[];
};

export function ScheduleClassForm({ courses }: ScheduleClassFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!courseId || !title.trim()) {
      setError("Course and title are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: title.trim() }),
      });
      const body = (await res.json()) as { session?: { id: string }; error?: string };
      if (!res.ok || !body.session) {
        throw new Error(body.error || "Could not schedule class.");
      }
      setTitle("");
      router.refresh();
      router.push(`/class/${body.session.id}/live`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule class.");
    } finally {
      setSubmitting(false);
    }
  }

  if (courses.length === 0) {
    return (
      <p className="text-xs font-medium text-amber-700">
        Assign a course to your lecturer profile before scheduling classes.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Course</span>
        <select
          className="block h-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-xs"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label="Course"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.title}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs">
        <span className="font-semibold text-slate-600">Class title</span>
        <input
          className="block h-10 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-xs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Week 3 — HTML Forms"
          aria-label="Class title"
          required
        />
      </label>
      <Button type="submit" size="sm" disabled={submitting} className="h-10">
        {submitting ? "Scheduling…" : "Schedule Class"}
      </Button>
      {error ? <p className="text-xs text-red-600 sm:col-span-full">{error}</p> : null}
    </form>
  );
}
