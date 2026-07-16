export function isAdmin(email: string | null | undefined, adminEmail = process.env.ADMIN_EMAIL) {
  return Boolean(email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase());
}

export function canDeleteComment(input: {
  actorId: string;
  commentAuthorId: string;
  videoOwnerId: string;
  admin: boolean;
}) {
  return input.admin || input.actorId === input.commentAuthorId || input.actorId === input.videoOwnerId;
}
