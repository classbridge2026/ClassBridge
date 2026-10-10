"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type UseLocalPreviewArgs = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
};

type UseLocalPreviewResult = {
  videoRef: RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  error: string | null;
  audioLevel: number;
  restart: () => Promise<void>;
  stop: () => void;
};

export function useLocalPreview({
  cameraEnabled,
  microphoneEnabled,
  videoDeviceId,
  audioDeviceId,
}: UseLocalPreviewArgs): UseLocalPreviewResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const stopMeter = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const stop = useCallback(() => {
    stopMeter();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopMeter]);

  const startMeter = useCallback(
    (mediaStream: MediaStream) => {
      stopMeter();
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) return;

      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(mediaStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((sum, n) => sum + n, 0) / data.length;
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Meter is optional; preview can continue without it.
      }
    },
    [stopMeter],
  );

  const restart = useCallback(async () => {
    stop();

    if (!cameraEnabled && !microphoneEnabled) {
      setError(null);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support camera and microphone access.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled
          ? {
              deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
        audio: microphoneEnabled
          ? {
              deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);

      if (videoRef.current && cameraEnabled) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => undefined);
      }

      if (microphoneEnabled) {
        startMeter(mediaStream);
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Camera or microphone access is blocked. Please allow access in your browser settings.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera or microphone was found on this device.");
      } else if (name === "OverconstrainedError") {
        setError("The selected device is unavailable. Try another camera or microphone.");
      } else {
        setError("We couldn't start your camera or microphone preview.");
      }
    }
  }, [audioDeviceId, cameraEnabled, microphoneEnabled, startMeter, stop, videoDeviceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void restart();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [restart, stop]);

  return { videoRef, stream, error, audioLevel, restart, stop };
}
