"use client";

import { useCallback, useEffect, useState } from "react";

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

type PermissionState = "unknown" | "granted" | "denied" | "unavailable";

type UseMediaDevicesOptions = {
  /** When true (default), briefly request media to unlock device labels + permission state. */
  requestPermissions?: boolean;
};

type UseMediaDevicesResult = {
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
  speakers: MediaDeviceOption[];
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  refreshDevices: () => Promise<void>;
};

function mapDevices(devices: MediaDeviceInfo[], kind: MediaDeviceKind): MediaDeviceOption[] {
  return devices
    .filter((d) => d.kind === kind)
    .map((d, index) => ({
      deviceId: d.deviceId,
      label: d.label || `${kind} ${index + 1}`,
    }));
}

export function useMediaDevices(options: UseMediaDevicesOptions = {}): UseMediaDevicesResult {
  const requestPermissions = options.requestPermissions !== false;
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceOption[]>([]);
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("unknown");
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState>("unknown");

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setCameraPermission("unavailable");
      setMicrophonePermission("unavailable");
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(mapDevices(devices, "videoinput"));
      setMicrophones(mapDevices(devices, "audioinput"));
      setSpeakers(mapDevices(devices, "audiooutput"));
    } catch {
      setCameraPermission("unavailable");
      setMicrophonePermission("unavailable");
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      void refreshDevices();
    };

    const timer = window.setTimeout(() => {
      void refreshDevices();
    }, 0);

    navigator.mediaDevices?.addEventListener?.("devicechange", handler);
    return () => {
      window.clearTimeout(timer);
      navigator.mediaDevices?.removeEventListener?.("devicechange", handler);
    };
  }, [refreshDevices]);

  useEffect(() => {
    if (!requestPermissions) {
      // Infer permission from Permissions API when available (no new getUserMedia).
      let cancelled = false;
      async function readPermissions() {
        try {
          const perms = navigator.permissions;
          if (!perms?.query) return;
          const cam = await perms.query({ name: "camera" as PermissionName });
          const mic = await perms.query({ name: "microphone" as PermissionName });
          if (cancelled) return;
          setCameraPermission(cam.state === "granted" ? "granted" : cam.state === "denied" ? "denied" : "unknown");
          setMicrophonePermission(
            mic.state === "granted" ? "granted" : mic.state === "denied" ? "denied" : "unknown",
          );
        } catch {
          // Permissions API unsupported for camera/mic in some browsers.
        }
      }
      void readPermissions();
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;

    async function probePermissions() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraPermission("unavailable");
          setMicrophonePermission("unavailable");
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) {
          setCameraPermission("granted");
          setMicrophonePermission("granted");
          await refreshDevices();
        }
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        const denied = name === "NotAllowedError" || name === "PermissionDeniedError";

        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioOnly.getTracks().forEach((t) => t.stop());
          if (!cancelled) setMicrophonePermission("granted");
        } catch {
          if (!cancelled) setMicrophonePermission(denied ? "denied" : "unavailable");
        }

        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true });
          videoOnly.getTracks().forEach((t) => t.stop());
          if (!cancelled) setCameraPermission("granted");
        } catch {
          if (!cancelled) setCameraPermission(denied ? "denied" : "unavailable");
        }

        await refreshDevices();
      }
    }

    const timer = window.setTimeout(() => {
      void probePermissions();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [refreshDevices, requestPermissions]);

  return {
    cameras,
    microphones,
    speakers,
    cameraPermission,
    microphonePermission,
    refreshDevices,
  };
}
