/**
 * API client for the Cloudflare Worker backend.
 * Replaces the previous Hypha RPC client.
 */

const API_BASE =
  import.meta.env.VITE_API_URL || "";

class ApiClient {
  constructor() {
    this._user = null;
  }

  /**
   * Check if the user is currently authenticated.
   * Returns user info if authenticated, null otherwise.
   */
  async checkAuth() {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      if (!response.ok) {
        this._user = null;
        return null;
      }
      const data = await response.json();
      if (data.authenticated) {
        this._user = data;
        return data;
      }
      this._user = null;
      return null;
    } catch {
      this._user = null;
      return null;
    }
  }

  /**
   * Redirect to GitHub OAuth login page.
   */
  login() {
    window.location.href = `${API_BASE}/auth/login`;
  }

  /**
   * Log the user out and reload.
   */
  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    this._user = null;
    window.location.reload();
  }

  /**
   * Get the authenticated user's email.
   */
  email() {
    return this._user?.email ?? null;
  }

  /**
   * Request a UCAN delegation from the Worker for browser-direct upload.
   * @param {string} agentDid - The browser Storacha agent's DID
   * @param {string} fileName - Name of the file being uploaded
   * @param {number} fileSize - Size of the file in bytes
   * @returns {Promise<Uint8Array>} Delegation bytes
   */
  async getDelegation(agentDid, fileName, fileSize) {
    const response = await fetch(`${API_BASE}/api/delegation`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentDid, fileName, fileSize }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to get upload delegation");
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Report a completed upload to the Worker for logging and email notification.
   * @param {string} cid - The Content Identifier of the uploaded file
   * @param {string} fileName - Name of the uploaded file
   * @param {number} fileSize - Size of the uploaded file in bytes
   */
  async reportUploadComplete(cid, fileName, fileSize) {
    const response = await fetch(`${API_BASE}/api/upload-complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, fileName, fileSize }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("Failed to report upload:", data.error);
    }
  }
}

const api = new ApiClient();

export default api;
