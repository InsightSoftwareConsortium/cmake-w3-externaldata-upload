import { hyphaWebsocketClient } from 'imjoy-rpc'

const SERVER_URL = import.meta.env.VITE_HYPHA_SERVER_URL || document.location.origin

const SELECTORS = {
  loginIframe: '#login-iframe',
}

class HyphaUploader {
    constructor() {
        this.token = null
        this.server = null
        this.loginIframe$ = document.querySelector(SELECTORS.loginIframe)
    }

    async loginCallback(context) {
      this.login_url = context.login_url
      this.key = context.key

      this.loginIframe$.src = context.login_url
    }

    async login(uiLoginCallback) {
      this.token = await hyphaWebsocketClient.login({ 'server_url': SERVER_URL, login_callback: this.loginCallback.bind(this) })
      const server = await hyphaWebsocketClient.connectToServer({'server_url': SERVER_URL, "token": this.token})
      this.server = server
      this.uploader = await server.getService('cmake-w3-externaldata-upload')
      uiLoginCallback()
    }

    logout() {
      const logoutUrl = `${this.login_url}/?key=${this.key}&logout=true`
      window.open(logoutUrl, '_blank')
    }

    async email() {
      const email = await this.uploader.email()
      return email
    }

    async uploadFile(file, callbacks) {
      await this.uploader.uploadFile(file, callbacks)
    }
}

const hypha = new HyphaUploader()

export default hypha