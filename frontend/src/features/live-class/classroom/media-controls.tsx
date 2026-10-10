"use client";

import { Camera, CameraOff, Loader2, Mic, MicOff, Settings2 } from "lucide-react";
import { useState } from "react";
import { ControlButton } from "@/features/live-class/classroom/control-button";
import { DeviceSettings } from "@/features/live-class/classroom/device-settings";
import {
  mediaStateLabel,
  useRoomMediaControls,
  type MediaToggleState,
} from "@/features/live-class/hooks/use-room-media-controls";

function shortLabel(kind: "mic" | "camera", state: MediaToggleState): string {
  if (state === "connecting") return "…";
  if (state === "denied") return "Blocked";
  if (state === "unavailable") return "N/A";
  if (kind === "mic") return state === "on" ? "Mic" : "Muted";
  return state === "on" ? "Camera" : "Cam Off";
}

export function MediaControls() {
  const media = useRoomMediaControls();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Allow retry when permission was denied; block only while connecting or no device.
  const micDisabled =
    media.microphoneState === "connecting" || media.microphoneState === "unavailable";
  const camDisabled =
    media.cameraState === "connecting" || media.cameraState === "unavailable";

  const statusMessage = media.micError || media.camError;

  return (
    <>
      <ControlButton
        label={mediaStateLabel("mic", media.microphoneState)}
        pressed={media.microphoneState === "on"}
        onClick={() => void media.toggleMicrophone()}
        disabled={micDisabled}
      >
        {media.microphoneState === "connecting" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : media.microphoneState === "on" ? (
          <Mic className="h-5 w-5" aria-hidden />
        ) : (
          <MicOff className="h-5 w-5" aria-hidden />
        )}
        <span>{shortLabel("mic", media.microphoneState)}</span>
      </ControlButton>

      <ControlButton
        label={mediaStateLabel("camera", media.cameraState)}
        pressed={media.cameraState === "on"}
        onClick={() => void media.toggleCamera()}
        disabled={camDisabled}
      >
        {media.cameraState === "connecting" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : media.cameraState === "on" ? (
          <Camera className="h-5 w-5" aria-hidden />
        ) : (
          <CameraOff className="h-5 w-5" aria-hidden />
        )}
        <span>{shortLabel("camera", media.cameraState)}</span>
      </ControlButton>

      <ControlButton
        label="Audio and video settings"
        onClick={() => {
          media.clearDeviceError();
          void media.refreshDevices();
          setSettingsOpen(true);
        }}
      >
        <Settings2 className="h-5 w-5" aria-hidden />
        <span>Settings</span>
      </ControlButton>

      {statusMessage ? (
        <p
          className="basis-full text-center text-[11px] text-amber-300"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      ) : null}

      <DeviceSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        cameras={media.cameras}
        microphones={media.microphones}
        speakers={media.speakers}
        activeCamId={media.activeCamId}
        activeMicId={media.activeMicId}
        activeSpeakerId={media.activeSpeakerId}
        error={media.deviceError}
        onSelectCamera={(id) => void media.switchCamera(id)}
        onSelectMicrophone={(id) => void media.switchMicrophone(id)}
        onSelectSpeaker={(id) => void media.switchSpeaker(id)}
      />
    </>
  );
}
