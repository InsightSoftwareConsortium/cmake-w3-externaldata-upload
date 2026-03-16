import { create } from '@storacha/client'
import * as Delegation from '@storacha/client/delegation'

import download from './download.js'
import api from './api.js'
import { showLink, showMessage } from './messages.js'

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
    this.storachaClient = null
  }

  async connectedCallback () {
    const templateContent = this.uploadFormTemplate$.content.cloneNode(true)
    this.replaceChildren(templateContent)
    this.handleFileUpload = this.handleFileUpload.bind(this)
    this.handleContentLinkDownload = this.handleContentLinkDownload.bind(this)
    this.form$ = document.querySelector(SELECTORS.uploadForm)
    this.form$.addEventListener('submit', this.handleFileUpload)

    const email = api.email()
    showMessage(`> 👋 Welcome ${email}`)

    // Create Storacha client for browser-direct uploads
    showMessage('> 🔧 Initializing upload client...')
    this.storachaClient = await create()
    showMessage('> ✅ Upload client ready')
  }

  async handleFileUpload(event) {
    event.preventDefault()

    const fileInputEl = this.form$.querySelector('input[type=file]')
    this.file = fileInputEl.files[0]

    if (!this.file) {
      showMessage('> ❌ No file selected')
      return
    }

    showMessage(`> 📦 Preparing to upload ${this.file.name} (${this.file.size} bytes)`)

    try {
      // Step 1: Request UCAN delegation from the Worker
      showMessage('> 🔑 Requesting upload authorization...')
      const delegationBytes = await api.getDelegation(
        this.storachaClient.agent.did(),
        this.file.name,
        this.file.size
      )

      // Step 2: Deserialize and add the delegation to the client
      const delegation = await Delegation.extract(delegationBytes)
      if (!delegation.ok) {
        throw new Error('Failed to parse upload delegation')
      }

      const space = await this.storachaClient.addSpace(delegation.ok)
      await this.storachaClient.setCurrentSpace(space.did())

      // Step 3: Upload directly from the browser to Storacha
      this.toggleEncoding()
      showMessage('> 📡 Uploading file directly to Storacha...')

      const cid = await this.storachaClient.uploadFile(this.file)
      const cidString = cid.toString()

      // Step 4: Report the completed upload to the Worker (logging + email)
      showMessage('> 📝 Recording upload...')
      await api.reportUploadComplete(cidString, this.file.name, this.file.size)

      // Step 5: Show success
      this.toggleUploadComplete(cidString)

    } catch (error) {
      console.error('Upload failed:', error)
      showMessage(`> ❌ ${error.message}`)
      this.toggleUploadError()
    }
  }

  async handleContentLinkDownload (event) {
    event.preventDefault()
    download(`${this.file.name}.cid`, `${this.cid}\n`)

    // Reset
    await this.connectedCallback()
  }

  toggleEncoding () {
    showMessage('> 📡 Transmitting file to the InterPlanetary File System')
    const templateContent = this.encodingTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatEncodingTemplateContent(templateContent))
  }

  toggleUploading () {
    const templateContent = this.uploadingTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatUploadingTemplateContent(templateContent))
  }

  toggleUploadComplete (cid) {
    this.cid = cid
    showMessage(`> 🔑 Calculated Content ID: ${cid} `)
    showMessage(`> ✅ Storacha now hosting ${cid}`)
    const cidLink = `https://dweb.link/ipfs/${this.cid}`
    showLink(cidLink)
    const templateContent = this.uploadCompleteTemplate$.content.cloneNode(true)
    this.replaceChildren(this.formatUploadCompleteTemplateContent(templateContent))
    this.downloadForm$ = document.querySelector(SELECTORS.downloadForm)
    this.downloadForm$.addEventListener('submit', this.handleContentLinkDownload)
  }

  toggleUploadError (message) {
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
    hrefSlot.href = `https://dweb.link/ipfs/${this.cid}`
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
