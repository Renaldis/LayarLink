export function createPublicId() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function rotatePublicId(previousPublicId: string) {
  let nextPublicId = createPublicId();
  while (nextPublicId === previousPublicId) nextPublicId = createPublicId();
  return nextPublicId;
}

export function getExpiresAt(now: Date, retentionDays: number) {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + retentionDays);
  return expiresAt;
}
