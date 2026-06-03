import './style.css'
import { isAuthenticated, logout } from './auth.js'
import { renderLogin } from './login.js'
import { initApp } from './app.js'

const root = document.getElementById('app')

function boot() {
  if (isAuthenticated()) {
    initApp(root, logout, boot)
  } else {
    renderLogin(root, () => {
      initApp(root, logout, boot)
    })
  }
}

boot()
