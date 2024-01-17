import './assets/tachyons.min.css'
import './assets/spinner.css'
import { LoginInterface } from './login'
import { UploadFileForm } from './upload'

export const EVENTS = {
  loginSuccess: 'login:success',
}

const SELECTORS = {
  loginInterfaceComponent: '#login-interface-component',
  uploadComponent: '#upload-form-component',
}

document.addEventListener(EVENTS.loginSuccess, (event) => {
  const loginEl = document.querySelector(SELECTORS.loginInterfaceComponent)
  // Switch components
  const uploadEl = document.createElement('upload-form')
  const container = document.querySelector('#app div')
  container.prepend(uploadEl)
})

export { LoginInterface, UploadFileForm }
