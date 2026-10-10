"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useLocalPreview } from "@/features/live-class/hooks/use-local-preview";
import { useMediaDevices } from "@/features/live-class/hooks/use-media-devices";
import type { LiveClassSessionPayload, PreJoinSettings } from "@/features/live-class/types";
import { cn } from "@/lib/utils";

type PreJoinScreenProps = {
  session: LiveClassSessionPayload;
  joining?: boolean;
  joinError?: string | null;
  onJoin: (settings: PreJoinSettings) => void;
};

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean | null;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5">
      <div>
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
      </div>
      {ok == null ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />
      ) : ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label={`${label} connected`} />
      ) : (
        <CircleAlert className="h-4 w-4 shrink-0 text-amber-400" aria-label={`${label} unavailable`} />
      )}
    </div>
  );
}

function formatSchedule(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PreJoinScreen({ session, joining = false, joinError, onJoin }: PreJoinScreenProps) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [videoDeviceId, setVideoDeviceId] = useState<string | undefined>();
  const [audioDeviceId, setAudioDeviceId] = useState<string | undefined>();
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string | undefined>();
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [speakerOk, setSpeakerOk] = useState<boolean | null>(null);

  const { cameras, microphones, speakers, cameraPermission, microphonePermission } =
    useMediaDevices();

  const selectedVideoId = videoDeviceId ?? cameras[0]?.deviceId;
  const selectedAudioId = audioDeviceId ?? microphones[0]?.deviceId;
  const selectedSpeakerId = audioOutputDeviceId ?? speakers[0]?.deviceId;

  const { videoRef, error: previewError, audioLevel, stop } = useLocalPreview({
    cameraEnabled,
    microphoneEnabled,
    videoDeviceId: selectedVideoId,
    audioDeviceId: selectedAudioId,
  });

  const cameraOk =
    cameraPermission === "unknown"
      ? null
      : cameraPermission === "granted" && (!cameraEnabled || !previewError);
  const micOk =
    microphonePermission === "unknown"
      ? null
      : microphonePermission === "granted" && (!microphoneEnabled || !previewError);

  const cameraDetail =
    cameraPermission === "denied"
      ? "Camera access is blocked. Please allow camera access in your browser settings."
      : cameraPermission === "unavailable"
        ? "No camera available on this device."
        : cameraEnabled
          ? cameras.find((c) => c.deviceId === selectedVideoId)?.label || "Ready"
          : "Camera off (you can still join)";

  const micDetail =
    microphonePermission === "denied"
      ? "Microphone access is blocked. Please allow microphone access in your browser settings."
      : microphonePermission === "unavailable"
        ? "No microphone available on this device."
        : microphoneEnabled
          ? microphones.find((m) => m.deviceId === selectedAudioId)?.label || "Ready"
          : "Microphone muted (you can still join)";

  const canAttemptJoin = session.canJoin && !joining;

  const joinLabel = useMemo(() => {
    if (joining) return "Joining…";
    if (session.canStart && session.status === "SCHEDULED") return "Start & Join Class";
    if (session.role === "host") return "Join Class as Host";
    return "Join Class";
  }, [joining, session.canStart, session.role, session.status]);

  const handleSpeakerTest = useCallback(async () => {
    setSpeakerTesting(true);
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const destination = ctx.destination as AudioDestinationNode & {
        setSinkId?: (id: string) => Promise<void>;
      };
      if (selectedSpeakerId && typeof destination.setSinkId === "function") {
        await destination.setSinkId(selectedSpeakerId);
      }

      oscillator.start();
      await new Promise((r) => setTimeout(r, 450));
      oscillator.stop();
      await ctx.close();
      setSpeakerOk(true);
    } catch {
      setSpeakerOk(false);
    } finally {
      setSpeakerTesting(false);
    }
  }, [selectedSpeakerId]);

  const handleJoin = () => {
    if (!canAttemptJoin) return;
    stop();
    onJoin({
      cameraEnabled,
      microphoneEnabled,
      videoDeviceId: selectedVideoId,
      audioDeviceId: selectedAudioId,
      audioOutputDeviceId: selectedSpeakerId,
    });
  };

  return (
    <main className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <Logo
            size="md"
            markClassName="brightness-110"
            className="[&_span:last-child_span:first-child]:text-white [&_span:last-child_span:last-child]:text-blue-400"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pre-join classroom
          </p>
        </header>

        <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
              {cameraEnabled && !previewError ? (
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                  aria-label="Your camera preview"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/20 text-2xl font-bold text-blue-300">
                    {session.viewerName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {cameraEnabled ? "Camera unavailable" : "Camera Off"}
                  </p>
                  {previewError ? (
                    <p className="max-w-md text-xs text-amber-300">{previewError}</p>
                  ) : null}
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={microphoneEnabled ? "secondary" : "danger"}
                  onClick={() => setMicrophoneEnabled((v) => !v)}
                  aria-pressed={microphoneEnabled}
                  aria-label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {microphoneEnabled ? "Mic On" : "Mic Off"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={cameraEnabled ? "secondary" : "danger"}
                  onClick={() => setCameraEnabled((v) => !v)}
                  aria-pressed={cameraEnabled}
                  aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  {cameraEnabled ? "Camera On" : "Camera Off"}
                </Button>
                {microphoneEnabled ? (
                  <div
                    className="ml-auto flex h-2 w-24 items-center overflow-hidden rounded-full bg-slate-800"
                    role="meter"
                    aria-label="Microphone level"
                    aria-valuenow={audioLevel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-emerald-400 transition-[width] duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300">Camera</span>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={selectedVideoId || ""}
                  onChange={(e) => setVideoDeviceId(e.target.value || undefined)}
                  disabled={!cameras.length}
                  aria-label="Select camera"
                >
                  {cameras.length === 0 ? (
                    <option value="">No cameras found</option>
                  ) : (
                    cameras.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300">Microphone</span>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={selectedAudioId || ""}
                  onChange={(e) => setAudioDeviceId(e.target.value || undefined)}
                  disabled={!microphones.length}
                  aria-label="Select microphone"
                >
                  {microphones.length === 0 ? (
                    <option value="">No microphones found</option>
                  ) : (
                    microphones.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300">Speaker</span>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={selectedSpeakerId || ""}
                  onChange={(e) => setAudioOutputDeviceId(e.target.value || undefined)}
                  aria-label="Select speaker"
                >
                  {speakers.length === 0 ? (
                    <option value="">System default</option>
                  ) : (
                    speakers.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                {session.course.code}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white">{session.course.title}</h1>
              <p className="text-sm font-medium text-slate-300">{session.title}</p>
              <dl className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between gap-3">
                  <dt>Lecturer</dt>
                  <dd className="font-semibold text-slate-200">{session.lecturerName || "Not assigned"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Scheduled</dt>
                  <dd className="font-semibold text-slate-200">{formatSchedule(session.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Status</dt>
                  <dd
                    className={cn(
                      "font-bold uppercase tracking-wide",
                      session.status === "LIVE" && "text-red-400",
                      session.status === "SCHEDULED" && "text-amber-300",
                      (session.status === "COMPLETED" || session.status === "CANCELLED") &&
                        "text-slate-400",
                    )}
                  >
                    {session.status}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Joining as</dt>
                  <dd className="font-semibold capitalize text-slate-200">{session.role}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Device status
              </h2>
              <StatusRow label="Camera" ok={cameraOk} detail={cameraDetail} />
              <StatusRow label="Microphone" ok={micOk} detail={micDetail} />
              <StatusRow
                label="Speaker"
                ok={speakerOk}
                detail={
                  speakerOk === true
                    ? "Test tone played successfully"
                    : speakerOk === false
                      ? "Could not play speaker test"
                      : speakers[0]?.label || "Click Test Speaker to verify"
                }
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
                onClick={() => void handleSpeakerTest()}
                disabled={speakerTesting}
                aria-label="Test speaker"
              >
                <Volume2 className="h-4 w-4" />
                {speakerTesting ? "Playing test…" : "Test Speaker"}
              </Button>
            </div>

            {session.blockReason ? (
              <div
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                role="status"
              >
                {session.blockReason}
              </div>
            ) : null}

            {joinError ? (
              <div
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                role="alert"
              >
                {joinError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="flex-1"
                disabled={!canAttemptJoin}
                onClick={handleJoin}
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {joinLabel}
              </Button>
              <Link
                href={session.backHref}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-6 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Leave
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
