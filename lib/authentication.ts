import { whop } from "@/lib/whop-sdk";

/**
 * Verify the current user from the Whop iframe JWT token.
 * The `x-whop-user-token` header is automatically injected by the Whop iframe.
 *
 * @param headers - Request headers (from `headers()` in server components or `request.headers` in API routes)
 * @returns The verified user payload containing `userId` and `appId`
 * @throws If the token is invalid or missing
 */
export async function verifyUser(headers: Headers) {
  return whop.verifyUserToken(headers);
}

/**
 * Fetch the Whop user's public profile (display name, profile picture).
 * Used to auto-populate OPTIZ profiles on first visit.
 */
export async function fetchWhopUserProfile(userId: string): Promise<{
  displayName: string | null;
  avatarUrl: string | null;
}> {
  try {
    const user = await whop.users.retrieve(userId);
    const u = user as unknown as Record<string, unknown>;
    return {
      displayName: (u.name as string | null) ?? (u.username as string | null) ?? null,
      avatarUrl: (u.profile_pic_url as string | null) ?? null,
    };
  } catch (err) {
    console.error("[OPTIZ] fetchWhopUserProfile failed:", err);
    return { displayName: null, avatarUrl: null };
  }
}

/**
 * Check if a user has access to a specific experience.
 * Used in Experience views to gate content behind membership access.
 *
 * @param experienceId - The experience ID from the URL (e.g., `exp_xxxxx`)
 * @param userId - The Whop user ID from `verifyUser()`
 * @returns Object with `has_access` (boolean) and `access_level` ("customer" | "admin")
 */
export async function checkExperienceAccess(
  experienceId: string,
  userId: string
) {
  return whop.users.checkAccess(experienceId, { id: userId });
}

/**
 * Check if a user has admin access to a company.
 * Used in Dashboard views to restrict access to company admins only.
 *
 * @param companyId - The company ID from the URL (e.g., `biz_xxxxx`)
 * @param userId - The Whop user ID from `verifyUser()`
 * @returns Object with `has_access` (boolean) and `access_level` ("customer" | "admin")
 */
export async function checkDashboardAccess(
  companyId: string,
  userId: string
) {
  const access = await whop.users.checkAccess(companyId, { id: userId });

  if (access.access_level !== "admin") {
    return { has_access: false, access_level: access.access_level };
  }

  return access;
}

