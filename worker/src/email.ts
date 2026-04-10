/**
 * Send upload notification email via MailJet REST API.
 */

interface EmailParams {
  apiKeyPublic: string;
  apiKeyPrivate: string;
  senderEmail: string;
  recipientEmail: string;
  email: string;
  authId: string;
  fileName: string;
  fileSize: number;
  cid: string;
  gatewayDomain: string;
}

export async function sendUploadNotification(
  params: EmailParams
): Promise<void> {
  const {
    apiKeyPublic,
    apiKeyPrivate,
    senderEmail,
    recipientEmail,
    email,
    authId,
    fileName,
    fileSize,
    cid,
    gatewayDomain,
  } = params;

  // HTML-escape values that originate from user input to prevent HTML injection
  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const safeEmail = escapeHtml(email);
  const safeAuthId = escapeHtml(authId);
  const safeFileName = escapeHtml(fileName);

  const subject = `${email} (${authId}) uploaded ${fileName} with cmake-w3-externaldata`;
  const textBody = `${email} (${authId}) uploaded ${fileName}, ${fileSize} bytes, to IPFS with CID ${cid}\n\nhttps://${gatewayDomain}/ipfs/${cid}`;
  const htmlBody = `<p><strong>${safeEmail} (${safeAuthId})</strong> uploaded <strong>${safeFileName}</strong>, ${fileSize} bytes, to IPFS with CID ${cid}</p>  <p><a href="https://${gatewayDomain}/ipfs/${cid}">https://${gatewayDomain}/ipfs/${cid}</a></p>`;

  const credentials = btoa(`${apiKeyPublic}:${apiKeyPrivate}`);

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: "cmake-w3-externaldata-upload",
          },
          To: [{ Email: recipientEmail, Name: "Monitor Email" }],
          Subject: subject,
          TextPart: textBody,
          HTMLPart: htmlBody,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error(
      `MailJet send failed: ${response.status} ${await response.text()}`
    );
  }
}
