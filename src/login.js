import './assets/tachyons.min.css'
import { EVENTS } from './main'

import api from './api.js'

const SELECTORS = {
  signOutButton: '#sign-out',
  confirmationTemplate: '#login-success-template',
  loginButtonTemplate: '#login-button-template',
}

export class LoginInterface extends window.HTMLElement {
  constructor() {
    super()
    this.confirmationTemplate$ = document.querySelector(
      SELECTORS.confirmationTemplate
    )
    this.loginButtonTemplate$ = document.querySelector(
      SELECTORS.loginButtonTemplate
    )
    this.signOutHandler = this.signOutHandler.bind(this)
  }

  async connectedCallback() {
    // Check if user is already authenticated (e.g., returning from OAuth callback)
    const user = await api.checkAuth()
    if (user) {
      this.toggleConfirmation()
    } else {
      this.showLoginButton()
    }
  }

  showLoginButton() {
    const templateContent = this.loginButtonTemplate$.content.cloneNode(true)
    this.replaceChildren(templateContent)
    const loginButton = this.querySelector('#github-login')
    loginButton.addEventListener('click', () => api.login())
  }

  toggleConfirmation() {
    const templateContent = this.confirmationTemplate$.content.cloneNode(true)
    this.replaceChildren(templateContent)
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
    await api.logout()
  }
}

window.customElements.define('login-interface', LoginInterface)
