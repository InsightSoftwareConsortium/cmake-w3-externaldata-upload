import './assets/tachyons.min.css'
import { EVENTS } from './main'

import hypha from './hypha'

const SELECTORS = {
  signOutButton: '#sign-out',
  confirmationTemplate: '#login-success-template',
  loginIframe: '#login-iframe',
}

export class LoginInterface extends window.HTMLElement {
  constructor() {
    super()
    this.confirmationTemplate$ = document.querySelector(
      SELECTORS.confirmationTemplate
    )
    this.signOutHandler = this.signOutHandler.bind(this)
    this.formatTemplateContent = this.formatTemplateContent.bind(this)
  }

  async connectedCallback() {
    await hypha.login(this.toggleConfirmation.bind(this))
  }

  formatTemplateContent(templateContent) {
    return templateContent
  }

  toggleConfirmation() {
    const templateContent = this.confirmationTemplate$.content
    this.replaceChildren(this.formatTemplateContent(templateContent))
    this.loginIframe$ = document.querySelector(SELECTORS.loginIframe)
    this.loginIframe$.remove()
    this.signOutButton$ = document.querySelector(SELECTORS.signOutButton)
    this.signOutButton$.addEventListener('click', this.signOutHandler)

    // Fire sign in success event
    const event = new window.CustomEvent(EVENTS.loginSuccess, { bubbles: true })
    this.dispatchEvent(event)
  }

  disconnectedCallback () {
  }

  async signOutHandler (e) {
    e.preventDefault()
    hypha.logout()
    window.location.reload()
  }
}

window.customElements.define('login-interface', LoginInterface)