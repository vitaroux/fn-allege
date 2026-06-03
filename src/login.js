import { login } from './auth.js'

export function renderLogin(root, onSuccess) {
  root.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="header-icon" style="margin: 0 auto 1.25rem;">FN</div>
        <h1 class="login-title">FN Allégé</h1>
        <p class="login-sub">Normalisation fiches navette</p>

        <div id="login-error" class="login-error" style="display:none"></div>

        <div class="login-field">
          <label for="pwd-input">Mot de passe</label>
          <input
            id="pwd-input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            autofocus
          />
        </div>

        <button id="login-btn" class="login-btn">Accéder</button>

        <p class="login-hint">Session valide 8 heures</p>
      </div>
    </div>
  `

  const input  = document.getElementById('pwd-input')
  const btn    = document.getElementById('login-btn')
  const errEl  = document.getElementById('login-error')
  const envPwd = import.meta.env.VITE_APP_PASSWORD || ''

  function attempt() {
    const val = input.value.trim()
    if (!val) return
    if (login(val, envPwd)) {
      onSuccess()
    } else {
      errEl.textContent = 'Mot de passe incorrect.'
      errEl.style.display = 'block'
      input.value = ''
      input.focus()
      input.classList.add('shake')
      setTimeout(() => input.classList.remove('shake'), 400)
    }
  }

  btn.addEventListener('click', attempt)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt() })
}
