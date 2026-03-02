#!/usr/bin/env node

import * as Client from '@storacha/client'
import { StoreMemory } from '@storacha/client/stores/memory'
import * as Proof from '@storacha/client/proof'
import { Signer } from '@storacha/client/principal/ed25519'
import { Command, Option } from 'commander/esm.mjs'
import { filesFromPaths } from 'files-from-path'

import 'dotenv/config'

async function connectToW3 () {
  // Load client with specific private key
  const principal = Signer.parse(process.env.KEY)
  const store = new StoreMemory()
  const client = await Client.create({ principal, store })
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(process.env.PROOF)
  const space = await client.addSpace(proof)
  await client.setCurrentSpace(space.did())
  return client
}

async function uploadToW3 (filePath) {
  const client = await connectToW3()

  const files = await filesFromPaths([filePath])
  const cid = await client.uploadFile(files[0])
  console.log(cid.toString())
}

async function main () {
  const program = new Command()
  program
    .summary('Upload a file to Storacha')
    .description('Upload a file to Storacha (storacha.network) with delegated upload credentials.')
    .argument('<file-path>', 'path to the file to upload')

  program
    .parse(process.argv)

  const filePath = program.args[0]
  await uploadToW3(filePath)
}
await main()
