"use client";

import { useEffect, useId, useRef } from "react";
import type { MediaDeviceOption } from "@/features/live-class/hooks/use-media-devices";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceSettingsProps = {
  open: boolean;
  onClose: () => void;
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
  speakers: MediaDeviceOption[];
  activeCamId: string;
  activeMicId: string;
  activeSpeakerId: string;
  error?: string | null;
  onSelectCamera: (deviceId: string) => void;
  onSelectMicrophone: (deviceId: string) => void;
  onSelectSpeaker: (deviceId: string) => void;
};

function DeviceSelect({
  id,
  label,
  value,
  options,
  onChange,
  emptyLabel,
}: {
  id: string;
  label: string;
  value: string;
  options: MediaDeviceOption[];
  onChange: (deviceId: string) => void;
  emptyLabel: string;
}) {
  return (
    <label className="block space-y-1.5 text-xs" htmlFor={id}>
      <span className="font-semibold text-slate-300">{label}</span>
      {options.length === 0 ? (
        <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-500">
          {emptyLabel}
        </p>
      ) : (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {options.map((opt) => (
            <option key={opt.deviceId} value={opt.deviceId}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

export function DeviceSettings({
  open,
  onClose,
  cameras,
  microphones,
  speakers,
  activeCamId,
  activeMicId,
  activeSpeakerId,
  error,
  onSelectCamera,
  onSelectMicrophone,
  onSelectSpeaker,
}: DeviceSettingsProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              Audio & video settings
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Switch devices without leaving the classroom.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <DeviceSelect
            id="live-class-camera"
            label="Camera"
            value={activeCamId}
            options={cameras}
            onChange={onSelectCamera}
            emptyLabel="No camera available"
          />
          <DeviceSelect
            id="live-class-microphone"
            label="Microphone"
            value={activeMicId}
            options={microphones}
            onChange={onSelectMicrophone}
            emptyLabel="No microphone available"
          />
          <DeviceSelect
            id="live-class-speaker"
            label="Speaker"
            value={activeSpeakerId}
            options={speakers}
            onChange={onSelectSpeaker}
            emptyLabel="No speaker devices listed (browser may use the system default)"
          />
        </div>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
