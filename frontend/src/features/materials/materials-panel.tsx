"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitDeleteMaterial,
  submitUploadMaterial,
  type MaterialFormState,
} from "@/features/materials/actions";
import type { MaterialListItem } from "@/features/materials/types";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";

const initialState: MaterialFormState | null = null;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DeleteMaterialButton({
  materialId,
  courseId,
  title,
}: {
  materialId: string;
  courseId: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    startTransition(async () => {
      await submitDeleteMaterial(materialId, courseId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition"
      title="Delete material"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span>{isPending ? "Deleting…" : "Delete"}</span>
    </button>
  );
}

export function MaterialsPanel({
  courseId,
  materials,
  modules = [],
  canManage = false,
}: {
  courseId: string;
  materials: MaterialListItem[];
  modules?: { id: string; title: string }[];
  canManage?: boolean;
}) {
  const [state, action, pending] = useActionState(submitUploadMaterial, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state?.ok]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Learning Materials</h2>
            <p className="text-xs text-slate-500">
              {materials.length} file{materials.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>
      </div>

      {canManage ? (
        <form ref={formRef} action={action} className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-xs">
          <input type="hidden" name="courseId" value={courseId} />

          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Upload className="h-4 w-4 text-amber-600" />
            <span>Upload material</span>
          </div>

          {state?.ok && state.message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{state.message}</span>
            </div>
          ) : null}

          {state?.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900 font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{state.error}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="material-title" className="text-slate-700 font-semibold text-xs">
                Title
              </Label>
              <Input
                id="material-title"
                name="title"
                placeholder="e.g. Week 1 lecture slides"
                required
                className="h-10 border-slate-300 text-slate-900 focus:border-amber-600"
              />
              {state?.fieldErrors?.title ? (
                <p className="text-red-600 font-semibold">{state.fieldErrors.title}</p>
              ) : null}
            </div>

            {modules.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="material-module" className="text-slate-700 font-semibold text-xs">
                  Module (optional)
                </Label>
                <select
                  id="material-module"
                  name="moduleId"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  defaultValue=""
                >
                  <option value="">Course-level (no module)</option>
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={`space-y-1.5 ${modules.length > 0 ? "" : "sm:col-span-2"}`}>
              <Label htmlFor="material-file" className="text-slate-700 font-semibold text-xs">
                File (max 20MB)
              </Label>
              <Input
                id="material-file"
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip"
                className="h-10 border-slate-300 text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-amber-700"
              />
              {state?.fieldErrors?.file ? (
                <p className="text-red-600 font-semibold">{state.fieldErrors.file}</p>
              ) : null}
              <p className="text-[11px] text-slate-500">
                Allowed: pdf, doc, docx, ppt, pptx, png, jpg, txt, zip
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={pending}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-9"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{pending ? "Uploading…" : "Upload"}</span>
            </Button>
          </div>
        </form>
      ) : null}

      {materials.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 italic">
          {canManage
            ? "No learning materials yet. Upload a file above to share with students."
            : "No learning materials have been published for this course yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <h3 className="text-xs font-bold text-slate-900 truncate">{material.title}</h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {material.fileName} · {formatBytes(material.byteSize)} ·{" "}
                  {new Date(material.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[11px] text-slate-400">Uploaded by {material.createdBy.fullName}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={material.downloadUrl}
                  download={material.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                {canManage ? (
                  <DeleteMaterialButton
                    materialId={material.id}
                    courseId={courseId}
                    title={material.title}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
