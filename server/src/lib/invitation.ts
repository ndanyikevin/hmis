export function generateInvitationToken() {
  return crypto.randomUUID() + crypto.randomUUID();
}