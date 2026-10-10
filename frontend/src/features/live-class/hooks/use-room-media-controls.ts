"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useCallback, useMemo, useState } from "react";
import { useMediaDevices } from "@/features/live-class/hooks/use-media-devices";

export type MediaToggleState = "on" | "off" | "connecting" | "denied" | "unavailable";

function classifyMediaError(error: unknown): "denied" | "unavailable" {
  const name =
    error instanceof DOMException
      ? error.name
      : error && typeof error === "object" && "name" in error
        ? String((error as { name: unknown }).name)
        : "";

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return "denied";
  }
  return "unavailable";
}

export function useRoomMediaControls() {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const { cameras, microphones, speakers, cameraPermission, microphonePermission, refreshDevices } =
    useMediaDevices({ requestPermissions: false });

  const [micBusy, setMicBusy] = useState(false);
  const [camBusy, setCamBusy] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
  const camPub = localParticipant.getTrackPublication(Track.Source.Camera);
  const micOn = isMicrophoneEnabled && !micPub?.isMuted;
  const camOn = isCameraEnabled && !camPub?.isMuted;

  const microphoneState: MediaToggleState = useMemo(() => {
    if (micBusy) return "connecting";
    if (microphonePermission === "denied" || micError?.includes("blocked")) return "denied";
    if (microphonePermission === "unavailable" || (microphones.length === 0 && !micOn)) {
      return "unavailable";
    }
    return micOn ? "on" : "off";
  }, [micBusy, micError, micOn, microphonePermission, microphones.length]);

  const cameraState: MediaToggleState = useMemo(() => {
    if (camBusy) return "connecting";
    if (cameraPermission === "denied" || camError?.includes("blocked")) return "denied";
    if (cameraPermission === "unavailable" || (cameras.length === 0 && !camOn)) {
      return "unavailable";
    }
    return camOn ? "on" : "off";
  }, [camBusy, camError, camOn, cameraPermission, cameras.length]);

  const toggleMicrophone = useCallback(async () => {
    if (micBusy) return;
    setMicBusy(true);
    setMicError(null);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      const kind = classifyMediaError(error);
      setMicError(
        kind === "denied"
          ? "Microphone access is blocked. Please allow microphone access in your browser settings."
          : "Microphone is unavailable on this device.",
      );
    } finally {
      setMicBusy(false);
      void refreshDevices();
    }
  }, [isMicrophoneEnabled, localParticipant, micBusy, refreshDevices]);

  const toggleCamera = useCallback(async () => {
    if (camBusy) return;
    setCamBusy(true);
    setCamError(null);
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (error) {
      const kind = classifyMediaError(error);
      setCamError(
        kind === "denied"
          ? "Camera access is blocked. Please allow camera access in your browser settings."
          : "Camera is unavailable on this device.",
      );
    } finally {
      setCamBusy(false);
      void refreshDevices();
    }
  }, [camBusy, isCameraEnabled, localParticipant, refreshDevices]);

  const switchMicrophone = useCallback(
    async (deviceId: string) => {
      setDeviceError(null);
      try {
        await room.switchActiveDevice("audioinput", deviceId);
        if (!isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(true);
        }
      } catch (error) {
        const kind = classifyMediaError(error);
        setDeviceError(
          kind === "denied"
            ? "Microphone access is blocked. Please allow microphone access in your browser settings."
            : "We couldn't switch microphones.",
        );
      }
    },
    [isMicrophoneEnabled, localParticipant, room],
  );

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setDeviceError(null);
      try {
        await room.switchActiveDevice("videoinput", deviceId);
        if (!isCameraEnabled) {
          await localParticipant.setCameraEnabled(true);
        }
      } catch (error) {
        const kind = classifyMediaError(error);
        setDeviceError(
          kind === "denied"
            ? "Camera access is blocked. Please allow camera access in your browser settings."
            : "We couldn't switch cameras.",
        );
      }
    },
    [isCameraEnabled, localParticipant, room],
  );

  const switchSpeaker = useCallback(
    async (deviceId: string) => {
      setDeviceError(null);
      try {
        await room.switchActiveDevice("audiooutput", deviceId);
      } catch {
        setDeviceError("Speaker selection is not supported in this browser.");
      }
    },
    [room],
  );

  const activeMicId =
    room.getActiveDevice("audioinput") || microphones[0]?.deviceId || "";
  const activeCamId = room.getActiveDevice("videoinput") || cameras[0]?.deviceId || "";
  const activeSpeakerId =
    room.getActiveDevice("audiooutput") || speakers[0]?.deviceId || "";

  return {
    microphoneState,
    cameraState,
    micError,
    camError,
    deviceError,
    clearDeviceError: () => setDeviceError(null),
    toggleMicrophone,
    toggleCamera,
    switchMicrophone,
    switchCamera,
    switchSpeaker,
    cameras,
    microphones,
    speakers,
    activeMicId,
    activeCamId,
    activeSpeakerId,
    refreshDevices,
  };
}

export function mediaStateLabel(kind: "mic" | "camera", state: MediaToggleState): string {
  if (kind === "mic") {
    switch (state) {
      case "on":
        return "Mute microphone";
      case "off":
        return "Unmute microphone";
      case "connecting":
        return "Connecting microphone";
      case "denied":
        return "Microphone access blocked";
      case "unavailable":
        return "Microphone unavailable";
    }
  }
  switch (state) {
    case "on":
      return "Turn camera off";
    case "off":
      return "Turn camera on";
    case "connecting":
      return "Connecting camera";
    case "denied":
      return "Camera access blocked";
    case "unavailable":
      return "Camera unavailable";
  }
}
