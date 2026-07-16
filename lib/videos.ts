export function createPublicId() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function getExpiresAt(now: Date, retentionDays: number) {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + retentionDays);
  return expiresAt;
}
