export interface AuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}
