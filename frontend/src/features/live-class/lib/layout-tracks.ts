import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { isHostParticipant } from "@/features/live-class/lib/participant-meta";
import type { LiveClassRole } from "@/features/live-class/types";

export type ClassroomLayout = {
  main: TrackReferenceOrPlaceholder | undefined;
  filmstrip: TrackReferenceOrPlaceholder[];
  localSelf: TrackReferenceOrPlaceholder | undefined;
  awaitingLecturer: boolean;
  mode: "spotlight" | "screen" | "waiting";
};

function trackKey(t: TrackReferenceOrPlaceholder) {
  return `${t.participant.identity}:${t.source}`;
}

function sortBySpeaking(
  tracks: TrackReferenceOrPlaceholder[],
  speakingIds: Set<string>,
): TrackReferenceOrPlaceholder[] {
  return [...tracks].sort((a, b) => {
    const aSpeak = speakingIds.has(a.participant.identity) ? 1 : 0;
    const bSpeak = speakingIds.has(b.participant.identity) ? 1 : 0;
    if (aSpeak !== bSpeak) return bSpeak - aSpeak;
    const aHost = isHostParticipant(a.participant) ? 1 : 0;
    const bHost = isHostParticipant(b.participant) ? 1 : 0;
    if (aHost !== bHost) return bHost - aHost;
    return (a.participant.name || a.participant.identity).localeCompare(
      b.participant.name || b.participant.identity,
    );
  });
}

/**
 * Educational spotlight layout:
 * 1) Active screen share dominates the main stage
 * 2) Lecturer camera is preferred over students
 * 3) Students never take the main stage when a lecturer is present
 * 4) Filmstrip is ordered by active speakers
 */
export function buildClassroomLayout(input: {
  cameraTracks: TrackReferenceOrPlaceholder[];
  screenTracks: TrackReferenceOrPlaceholder[];
  viewerRole: LiveClassRole;
  speakingIdentities: string[];
}): ClassroomLayout {
  const { cameraTracks, screenTracks, viewerRole } = input;
  const speakingIds = new Set(input.speakingIdentities);
  const isStudentView = viewerRole === "student" || viewerRole === "observer";

  const cameras = [...cameraTracks];
  // Prefer an active (unmuted) share. Do not require publication.track — remote
  // viewers often have the publication before the track is subscribed; VideoTrack
  // with manageSubscription will attach it once the tile is on the main stage.
  const screenMain =
    screenTracks.find((t) => Boolean(t.publication) && !t.publication?.isMuted) ??
    screenTracks.find((t) => Boolean(t.publication));

  const hostCam = cameras.find((t) => isHostParticipant(t.participant));
  const localCam = cameras.find((t) => t.participant.isLocal);

  if (screenMain) {
    const filmstrip = sortBySpeaking(
      cameras.filter((t) => {
        if (isStudentView && t.participant.isLocal) return false;
        return trackKey(t) !== trackKey(screenMain);
      }),
      speakingIds,
    );
    return {
      main: screenMain,
      filmstrip,
      localSelf: isStudentView ? localCam : undefined,
      awaitingLecturer: false,
      mode: "screen",
    };
  }

  if (isStudentView) {
    if (hostCam) {
      return {
        main: hostCam,
        filmstrip: sortBySpeaking(
          cameras.filter((t) => !t.participant.isLocal && t !== hostCam),
          speakingIds,
        ),
        localSelf: localCam,
        awaitingLecturer: false,
        mode: "spotlight",
      };
    }

    return {
      main: undefined,
      filmstrip: sortBySpeaking(
        cameras.filter((t) => !t.participant.isLocal),
        speakingIds,
      ),
      localSelf: localCam,
      awaitingLecturer: true,
      mode: "waiting",
    };
  }

  // Host: keep self (or host cam) on the main stage so teaching stays primary.
  const hostMain = hostCam ?? localCam ?? cameras[0];
  return {
    main: hostMain,
    filmstrip: sortBySpeaking(
      cameras.filter((t) => t !== hostMain),
      speakingIds,
    ),
    localSelf: undefined,
    awaitingLecturer: false,
    mode: "spotlight",
  };
}

export function filmstripGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1 sm:max-w-[220px]";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count <= 6) return "grid-cols-3 sm:grid-cols-3 lg:grid-cols-4";
  return "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5";
}
