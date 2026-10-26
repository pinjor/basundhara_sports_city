import { Role, type AuthUserDto } from "@bsc/shared";

export function displayName(user: AuthUserDto | null | undefined, fallback = "User") {
  if (user?.role === Role.CHAIRMAN) return "Chairman";
  return user?.name ?? fallback;
}
