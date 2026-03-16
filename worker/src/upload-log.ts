/**
 * D1 database operations for upload logging, quota checking, and blacklist.
 */

const QUOTA_PER_USER = 1024 * 1024 * 1024; // 1 GB
const MAX_UPLOAD_SIZE = 1024 * 1024 * 50; // 50 MB

export interface UploadCheckResult {
  allowed: boolean;
  error?: string;
}

/**
 * Check if a user is blacklisted or has exceeded their upload quota.
 */
export async function checkUploadAllowed(
  db: D1Database,
  authId: string,
  email: string,
  fileSize: number
): Promise<UploadCheckResult> {
  // Check file size
  if (fileSize > MAX_UPLOAD_SIZE) {
    return {
      allowed: false,
      error: `File size (${fileSize} bytes) exceeds limit of ${MAX_UPLOAD_SIZE} bytes`,
    };
  }

  // Check blacklist
  const blacklisted = await db
    .prepare(
      "SELECT COUNT(*) as count FROM blacklist WHERE auth_id = ?1 OR email = ?2"
    )
    .bind(authId, email)
    .first<{ count: number }>();

  if (blacklisted && blacklisted.count > 0) {
    return { allowed: false, error: "User not permitted to upload" };
  }

  // Check quota by auth_id
  const idQuota = await db
    .prepare("SELECT SUM(size) as total FROM upload_log WHERE auth_id = ?1")
    .bind(authId)
    .first<{ total: number | null }>();

  if (idQuota?.total != null && idQuota.total + fileSize > QUOTA_PER_USER) {
    return { allowed: false, error: "User has exceeded upload quota" };
  }

  // Check quota by email
  const emailQuota = await db
    .prepare("SELECT SUM(size) as total FROM upload_log WHERE email = ?1")
    .bind(email)
    .first<{ total: number | null }>();

  if (emailQuota?.total != null && emailQuota.total + fileSize > QUOTA_PER_USER) {
    return { allowed: false, error: "User has exceeded upload quota" };
  }

  return { allowed: true };
}

/**
 * Log a completed upload to the database.
 */
export async function logUpload(
  db: D1Database,
  authId: string,
  email: string,
  name: string,
  size: number,
  cid: string
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO upload_log (auth_id, email, name, size, cid, upload_time) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))"
    )
    .bind(authId, email, name, size, cid)
    .run();
}
