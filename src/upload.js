// import { loadDefaultIdentity } from '@w3ui/keyring-core'
// import {
//   uploadCarChunks,
//   encodeFile,
//   chunkBlocks,
//   createUpload,
// } from '@w3ui/uploader-core'
import { Web3Storage } from 'web3.storage'
const output = document.querySelector('#output')

import download  from './download.js'

const SELECTORS = {
  uploadForm: '#upload-form',
  uploadFormTemplate: '#upload-form-template',
  downloadForm: '#download-form',
  encodingTemplate: '#file-encoding-template',
  uploadingTemplate: '#file-uploading-template',
  uploadCompleteTemplate: '#upload-complete-template',
  uploadErrorTemplate: '#upload-error-template',
}

export class UploadFileForm extends window.HTMLElement {
  constructor() {
    super()
    this.form$ = document.querySelector(SELECTORS.uploadForm)
    this.downloadForm$ = document.querySelector(SELECTORS.downloadForm)
    this.uploadFormTemplate$ = document.querySelector(
      SELECTORS.uploadFormTemplate
    )
    this.encodingTemplate$ = document.querySelector(SELECTORS.encodingTemplate)
    this.uploadingTemplate$ = document.querySelector(
      SELECTORS.uploadingTemplate
    )
    this.uploadCompleteTemplate$ = document.querySelector(
      SELECTORS.uploadCompleteTemplate
    )
    this.uploadErrorTemplate$ = document.querySelector(
      SELECTORS.uploadErrorTemplate
    )
  }

  async connectedCallback () {
    const templateContent = this.uploadFormTemplate$.content.cloneNode(true)
    this.replaceChildren(templateContent)
    this.handleFileUpload = this.handleFileUpload.bind(this)
    this.handleContentLinkDownload = this.handleContentLinkDownload.bind(this)
    this.form$ = document.querySelector(SELECTORS.uploadForm)
    this.form$.addEventListener('submit', this.handleFileUpload)

    showMessage('> ⁂ waiting for API key and file to upload...')
  }

  async handleFileUpload(event) {
    event.preventDefault()

    const tokenInput = document.querySelector('#token')
    const token = tokenInput.value
    if (!token) { 
      showMessage('> ⁂ please enter your API key')
      return
    }
    showMessage('> 📦 creating web3.storage client')
    const client = new Web3Storage({ token })

    const fileInputEl = this.form$.querySelector('input[type=file')
    this.file = fileInputEl.files[0]
    let cid
    try {
      this.toggleEncoding()
      showMessage('> 🤖 chunking and hashing the files (in your browser!) to calculate the Content ID')
      this.fileName = this.file.name
      cid = await client.put([this.file,], {
        onRootCidReady: (localCid) => {
          showMessage(`> 🔑 locally calculated Content ID: ${localCid} `)
          showMessage('> 📡 sending file to web3.storage ')
        },
        onStoredChunk: (bytes) => showMessage(`> 🛰 sent ${bytes.toLocaleString()} bytes to web3.storage`),
        wrapWithDirectory: false,
      })
      showMessage(`> ✅ web3.storage now hosting ${cid}`)
      this.cid = cid
      const cidLink = `https://w3s.link/ipfs/${this.cid}`
      showLink(cidLink)
      this.toggleUploading()
    } catch (error) {
      this.toggleUploadError()
    } finally {
      this.toggleUploadComplete()
    }
    this.cid = cid

    // const fileInputEl = this.form$.querySelector('input[type=file')
    // this.file = fileInputEl.files[0]
    // const identity = await loadDefaultIdentity()

    // if (identity) {
    //   console.log(`DID2: ${identity.signingPrincipal.did()}`)
    // } else {
    //   console.log('No identity registered2')
    // }

    // try {
    //   this.toggleEncoding()
    //   const { cid: cidPromise, blocks } = await encodeFile(this.file)
    //   const chunks = chunkBlocks(blocks)
    //   const carCids = await uploadCarChunks(identity.signingPrincipal, chunks)
    //   const cid = await cidPromise
    //   await createUpload(identity.signingPrincipal, cid, carCids)
    //   this.cid = cid
    //   this.toggleUploading()
    // } catch (error) {
    //   this.toggleUploadError()
    // } finally {
    //   this.toggleUploadComplete()
    // }
  }

  async handleContentLinkDownload (event) {
    event.preventDefault()
    download(`${this.file.name}.cid`, this.cid)

    // Reset
    await this.connectedCallback()
  }

  toggleEncoding () {
    const templateContent = this.encodingTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatEncodingTemplateContent(templateContent))
  }

  toggleUploading () {
    const templateContent = this.uploadingTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatUploadingTemplateContent(templateContent))
  }

  toggleUploadComplete () {
    const templateContent = this.uploadCompleteTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatUploadCompleteTemplateContent(templateContent))
    this.downloadForm$ = document.querySelector(SELECTORS.downloadForm)
    this.downloadForm$.addEventListener('submit', this.handleContentLinkDownload)
  }

  toggleUploadError () {
    const templateContent = this.uploadErrorTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatUploadErrorTemplateContent(templateContent))
  }

  formatEncodingTemplateContent(templateContent) {
    const fileNameSlot = templateContent.querySelector('[data-file-name-slot]')
    fileNameSlot.innerText = this.file.name
    return templateContent
  }

  formatUploadingTemplateContent(templateContent) {
    const cidSlot = templateContent.querySelector('[data-root-cid-slot]')
    cidSlot.innerText = this.cid
    const fileNameSlot = templateContent.querySelector('[data-file-name-slot]')
    fileNameSlot.innerText = this.file.name
    return templateContent
  }

  formatUploadErrorTemplateContent(templateContent) {
    const slot = templateContent.querySelector('[data-error-messages-slot]')
    slot.innerText = this.errors
    return templateContent
  }

  formatUploadCompleteTemplateContent(templateContent) {
    const slot = templateContent.querySelector('[data-root-cid-slot]')
    slot.innerText = this.cid
    const hrefSlot = templateContent.querySelector('[data-root-cid-href-slot]')
    hrefSlot.href = `https://w3s.link/ipfs/${this.cid}`
    hrefSlot.download = this.file.name
    const fileNameSlot = templateContent.querySelector('[data-file-name-slot]')
    fileNameSlot.innerText = this.file.name
    return templateContent
  }

  disconnectedCallback() {
    this.form$.removeEventListener('submit', this.handleFileUpload)
    this.downloadForm$ = document.querySelector(SELECTORS.downloadForm)
    if (this.downloadForm$) {
      this.downloadForm$.removeEventListener('submit', this.handleContentLinkDownload)
    }
  }
}

window.customElements.define('upload-form', UploadFileForm)

// From the web3.storage client browser example
function showMessage (text) {
  const node = document.createElement('div')
  node.innerText = text
  output.appendChild(node)
}

function showLink (url) {
  const node = document.createElement('a')
  node.href = url
  node.innerText = `> 🔗 ${url}`
  output.appendChild(node)
}
