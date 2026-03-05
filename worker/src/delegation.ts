/**
 * Storacha UCAN delegation endpoint.
 *
 * Creates a short-lived delegation allowing the browser client
 * to upload directly to Storacha without the file bytes ever
 * passing through this Worker.
 */

import * as Client from "@storacha/client";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";

interface DelegationParams {
  storachaKey: string;
  storachaProof: string;
  audienceDid: string;
}

/**
 * Create a UCAN delegation for the given audience (browser agent DID).
 * The delegation grants upload capabilities scoped to the Storacha space.
 * Returns the delegation as serialized bytes.
 */
export async function createDelegation(
  params: DelegationParams
): Promise<Uint8Array> {
  const { storachaKey, storachaProof, audienceDid } = params;

  // Create a Storacha client with the server-side credentials
  const principal = Signer.parse(storachaKey);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  // Add the space proof
  const proof = await Proof.parse(storachaProof);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  // Parse the audience DID (the browser agent's DID)
  const audience = DID.parse(audienceDid);

  // Create a delegation with upload capabilities
  // Expires in 1 hour
  const expiration = Math.floor(Date.now() / 1000) + 60 * 60;

  const delegation = await client.createDelegation(audience, [
    "space/blob/add",
    "space/index/add",
    "filecoin/offer",
    "upload/add",
  ], {
    expiration,
  });

  // Serialize the delegation to bytes
  const archive = await delegation.archive();
  if (!archive.ok) {
    throw new Error("Failed to archive delegation");
  }

  return archive.ok;
}
