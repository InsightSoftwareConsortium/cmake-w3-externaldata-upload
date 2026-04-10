/**
 * Create a Pinata signed upload URL.
 *
 * The signed URL allows a browser to upload a file directly to Pinata
 * without needing API credentials.
 */

interface SignedUrlParams {
  pinataJwt: string;
  fileName: string;
}

interface SignedUrlResult {
  url: string;
}

export async function createSignedUploadUrl(
  params: SignedUrlParams
): Promise<SignedUrlResult> {
  const { pinataJwt, fileName } = params;

  const response = await fetch("https://uploads.pinata.cloud/v3/files/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      date: Math.floor(Date.now() / 1000),
      expires: 300,
      network: "public",
      filename: fileName,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata sign request failed (${response.status}): ${text}`);
  }

  const result = (await response.json()) as { data: string };
  return { url: result.data };
}
