import download  from './download.js'
import hypha from './hypha.js'
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
  }

  async connectedCallback () {
    const templateContent = this.uploadFormTemplate$.content.cloneNode(true)
    this.replaceChildren(templateContent)
    this.handleFileUpload = this.handleFileUpload.bind(this)
    this.handleContentLinkDownload = this.handleContentLinkDownload.bind(this)
    this.form$ = document.querySelector(SELECTORS.uploadForm)
    this.form$.addEventListener('submit', this.handleFileUpload)

    const email = await hypha.email()

    // showMessage(`> 😊 welcome ${email}`)
    showMessage(`> 👋 Welcome ${email}`)
  }

  async handleFileUpload(event) {
    event.preventDefault()


    const fileInputEl = this.form$.querySelector('input[type=file')
    this.file = fileInputEl.files[0]

    function uploadErrorCallback (message) {
      console.error(message)
      showMessage(`> ❌ ${message}`)
    }

    showMessage(`> 📦 Sending ${this.file.name} for storage`)
    await hypha.uploadFile(this.file, {
      startingUploadCallback: this.toggleEncoding.bind(this),
      uploadCompleteCallback: this.toggleUploadComplete.bind(this),
      uploadErrorCallback: uploadErrorCallback.bind(this)
    })
    return
    let cid
    try {
      showMessage('> 🤖 chunking and hashing the files (in your browser!) to calculate the Content ID')
      this.fileName = this.file.name
      cid = await client.put([this.file,], {
        onRootCidReady: (localCid) => {
          showMessage('> 📡 sending file to web3.storage ')
        },
        onStoredChunk: (bytes) => showMessage(`> 🛰 sent ${bytes.toLocaleString()} bytes to web3.storage`),
        wrapWithDirectory: false,
      })
      this.cid = cid
      this.toggleUploading()
    } catch (error) {
      this.toggleUploadError()
    } finally {
      this.toggleUploadComplete()
    }
    this.cid = cid
  }

  async handleContentLinkDownload (event) {
    event.preventDefault()
    download(`${this.file.name}.cid`, this.cid)

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
    showMessage(`> ✅ web3.storage now hosting ${cid}`)
    const cidLink = `https://w3s.link/ipfs/${this.cid}`
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