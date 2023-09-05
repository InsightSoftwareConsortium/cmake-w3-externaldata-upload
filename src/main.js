import './assets/tachyons.min.css'
import './assets/spinner.css'
// import { RegisterForm } from './register'
import { UploadFileForm } from './upload'

export const EVENTS = {
  registrationSuccess: 'registration:success',
}

const SELECTORS = {
  registerComponent: '#register-form-component',
  uploadComponent: '#upload-form-component',
}

document.addEventListener(EVENTS.registrationSuccess, (event) => {
  const registerEl = document.querySelector(SELECTORS.registerComponent)
  // Switch components
  registerEl.remove()
  const uploadEl = document.createElement('upload-form')
  const container = document.querySelector('#app div')
  container.appendChild(uploadEl)
})

// Until we go back to w3ui, support registration, just use the api
const registerEl = document.querySelector(SELECTORS.registerComponent)
// Switch components
registerEl.remove()
const uploadEl = document.createElement('upload-form')
const container = document.querySelector('#app div')
container.appendChild(uploadEl)
export { UploadFileForm }

// export { RegisterForm, UploadFileForm }
