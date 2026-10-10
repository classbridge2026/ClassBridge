"use client";

import { useSpeakingParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useMemo } from "react";
import { ScreenShareView } from "@/features/live-class/classroom/screen-share-view";
import { VideoTile } from "@/features/live-class/classroom/video-tile";
import { WaitingForLecturer } from "@/features/live-class/classroom/waiting-for-lecturer";
import {
  buildClassroomLayout,
  filmstripGridClass,
} from "@/features/live-class/lib/layout-tracks";
import { isHostParticipant } from "@/features/live-class/lib/participant-meta";
import type { LiveClassRole } from "@/features/live-class/types";
import { cn } from "@/lib/utils";

type VideoGridProps = {
  className?: string;
  viewerRole: LiveClassRole;
  lecturerName: string | null;
};

export function VideoGrid({ className, viewerRole, lecturerName }: VideoGridProps) {
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );
  // Include unsubscribed publications so remote viewers can promote the share
  // to the main stage and let VideoTrack subscribe via manageSubscription.
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const speakers = useSpeakingParticipants();

  const speakingIdentities = useMemo(
    () => speakers.map((p) => p.identity),
    [speakers],
  );

  const layout = useMemo(
    () =>
      buildClassroomLayout({
        cameraTracks,
        screenTracks,
        viewerRole,
        speakingIdentities,
      }),
    [cameraTracks, screenTracks, speakingIdentities, viewerRole],
  );

  const { main, filmstrip, localSelf, awaitingLecturer, mode } = layout;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4", className)}>
      <div className="flex min-h-0 flex-1 flex-col">
        {awaitingLecturer || mode === "waiting" ? (
          <WaitingForLecturer lecturerName={lecturerName} />
        ) : mode === "screen" && main ? (
          <ScreenShareView trackRef={main} className="flex min-h-0 flex-1 flex-col" />
        ) : main ? (
          <VideoTile
            trackRef={main}
            isMain
            isHost={
              isHostParticipant(main.participant) && main.source !== Track.Source.ScreenShare
            }
            allowFullscreen
            className="min-h-0 flex-1"
          />
        ) : (
          <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-sm text-slate-400">
            Waiting for video…
          </div>
        )}
      </div>

      {filmstrip.length > 0 ? (
        <div
          className={cn(
            "grid shrink-0 gap-2 overflow-x-auto pb-0.5",
            filmstripGridClass(filmstrip.length),
          )}
          aria-label="Participant filmstrip"
        >
          {filmstrip.map((trackRef) => (
            <VideoTile
              key={`${trackRef.participant.identity}-${trackRef.source}`}
              trackRef={trackRef}
              isHost={isHostParticipant(trackRef.participant)}
              className="aspect-video max-h-40 min-w-0"
            />
          ))}
        </div>
      ) : null}

      {localSelf ? (
        <div className="pointer-events-auto absolute bottom-4 right-4 z-10 w-[28%] max-w-[168px] min-w-[104px] sm:bottom-5 sm:right-5">
          <VideoTile
            trackRef={localSelf}
            isHost={false}
            className="aspect-video shadow-lg ring-2 ring-slate-700/80"
          />
        </div>
      ) : null}
    </div>
  );
}
