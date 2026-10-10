export function isHostParticipant(participant: {
  metadata?: string;
}): boolean {
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata) as { isHost?: boolean };
      if (typeof meta.isHost === "boolean") return meta.isHost;
    }
  } catch {
    // ignore malformed metadata
  }
  return false;
}
