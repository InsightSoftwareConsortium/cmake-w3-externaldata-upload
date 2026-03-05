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
  } = params;

  const subject = `${email} (${authId}) uploaded ${fileName} with cmake-w3-externaldata`;
  const body = `<p><strong>${email} (${authId})</strong> uploaded <strong>${fileName}</strong>, ${fileSize} bytes, to IPFS with CID ${cid}</p>  <p><a href="https://dweb.link/ipfs/${cid}">https://dweb.link/ipfs/${cid}</a></p>`;

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
          TextPart: body,
          HTMLPart: body,
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
