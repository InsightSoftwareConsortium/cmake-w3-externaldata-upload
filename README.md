# cmake-w3-externaldata-upload

[![screenshot](./screenshot.png)](https://cmake-w3-externaldata-upload.on.fleek.co/)

[CMake Web3 ExternalData Upload UI](https://cmake-w3-externaldata-upload.on.fleek.co/)

Based on [the web3.storage browser client](https://web3.storage/docs/reference/js-client-library/#store-files) and [w3ui](https://github.com/web3-storage/w3ui).

## About

Since every local [Git](https://git-scm.com/) repository contains a copy
of the entire project history, it is important to avoid adding large
binary files directly to the repository. Large binary files added and
removed throughout a project\'s history will cause the repository to
become bloated, take up too much disk space, require excessive time and
bandwidth to download, etc.

A [solution to this
problem](https://blog.kitware.com/cmake-externaldata-using-large-files-with-distributed-version-control/)
which has been adopted by this project, is to store binary files such as
images in a separate location outside the Git repository. Then, download
the files at build time with [CMake](https://cmake.org/).

A \"content link\" file contains an identifying [Content Identifier
(CID)](https://proto.school/anatomy-of-a-cid). The content link is
stored in the [Git](https://git-scm.com/) repository at the path where
the file would exist, but with a \".cid\" extension appended to the file
name. CMake will find these content link files at *build* time, download
them from a list of HTTP server resources, and create symlinks or copies of
the original files at the corresponding location in the *build tree*.

The [Content Identifier (CID)](https://proto.school/anatomy-of-a-cid) is
self-describing hash following the [multiformats
](https://multiformats.io/) standard created by the Interplanetary
Filesystem ([IPFS](https://ipfs.io/)) community. A file with a CID for
its filename is content verifable. Locating files according to their CID
makes content-addressed, as opposed to location-addressed, data exchange
possible. This practice is the foundation of the decentralized web, also
known as the dWeb or Web3. By adopting Web3, we gain:

-   Permissionless data uploads
-   Robust, redundant storage
-   Local and peer-to-peer storage
-   Scalability
-   Sustainability

Contributors to upload their data through an easy-to-use,
permissionless, free service, [web3.storage](https://web3.storage/).

Data used in the Git repository is periodically tracked in a
dedicated [Datalad
repository](https://datalad.org)
and stored across redundant locations so it can be retrieved from any of
the following:

-   Local [IPFS](https://ipfs.io/) nodes
-   Peer [IPFS](https://ipfs.io/) nodes
-   [web3.storage](https://web3.storage/)
-   [pinata.cloud](https://pinata.cloud)

*Note: This currently requires an extended version of the ExternalData.cmake module developed in the [CMakeIPFSExternalData repository](https://github.com/InsightSoftwareConsortium/CMakeIPFSExternalData). This has not been integrated into upstream CMake due to the availability of C++ CID verification code to complete the feature set in a
portable way.* 

## Development

### Clone, install dependencies:

```sh
git clone https://github.com/InsightSoftwareConsortium/cmake-w3-externaldata-upload
cd cmake-w3-externaldata-upload
```

Change to this directory and install dependencies

```sh
cd cmake-w3-externaldata-upload
npm install --location=global pnpm
pnpm install
pnpm setup-micromamba
```

### Populate .env

Populate a *.env* file in the repository with environmental variables used by application services in the format `<VAR>=<VALUE>`.

#### web3.storage

Populate `DID`, `KEY`, and `PROOF` as [described in the web3.storage documentation on creation of delegations](https://web3.storage/docs/how-to/upload/#bring-your-own-delegations).

### mailjet

For monitor emails, set the [MailJet](https://mailjet.com) keys `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`. Also `SENDER_EMAIL` and `RECIPIENT_EMAIL`. Note that DNS records should be set for the sender and the sender configured in MailJet.

### Run the dev server

```sh
pnpm dev
```

This starts, a [hypha server](https://ha.amun.ai/#/), a hypha Python service, and the client side build, and serves them locally.

To test production builds instead, run

```sh
pnpm start-hypha-service
```

in one terminal and

```sh
pnpm build
pnpm preview
```

in another.