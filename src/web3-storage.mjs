#!/usr/bin/env node

import * as Client from '@web3-storage/w3up-client'
import * as Signer from '@ucanto/principal/ed25519'
import * as Delegation from '@ucanto/core/delegation'
import { CarReader } from '@ipld/car'
import { Command, Option } from 'commander/esm.mjs'
import { filesFromPaths } from 'files-from-path'

import 'dotenv/config'

/** @param {string} data Base64 encoded CAR file */
async function parseProof (data) {
  const blocks = []
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))
  for await (const block of reader.blocks()) {
    blocks.push(block)
  }
  return Delegation.importDAG(blocks)
}

async function connectToW3 () {
  // Load client with specific private key
  const principal = Signer.parse(process.env.KEY)
  const client = await Client.create({ principal })
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await parseProof(process.env.PROOF)
  const space = await client.addSpace(proof)
  await client.setCurrentSpace(space.did())
  return client
}

async function uploadToW3 (filePath) {
  const client = await connectToW3()

  const files = await filesFromPaths([filePath])
  const cid = await client.uploadFile(files[0], { noWrap: true })
  console.log(cid.toString())
}

async function main () {
  const program = new Command()
  program
    .summary('Upload a file to web3.storage')
    .description('Upload a file to web3.storage with delegated upload credentials.')
    .argument('<file-path>', 'path to the file to upload')

  program
    .parse(process.argv)

  const filePath = program.args[0]
  await uploadToW3(filePath)
}
await main()
