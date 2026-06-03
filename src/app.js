import { processWorkbook, downloadWorkbook } from './processor.js'

export function initApp(root) {
  root.innerHTML = `
    <div class="header">
      <div class="header-top">
        <div class="header-icon">FN</div>
        <div>
          <h1>FN Allégé</h1>
          <p>Normalisation de fiches navette topologie Free / Orange</p>
        </div>
      </div>
    </div>

    <div id="drop-zone" class="drop-zone">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <h2>Déposer la fiche navette ici</h2>
      <p>ou cliquer pour sélectionner un fichier .xlsx</p>
      <input type="file" id="file-input" accept=".xlsx,.xls">
    </div>

    <div id="status" class="status"></div>

    <div id="stats" class="stats">
      <div class="stat">
        <label>Liaisons</label>
        <strong id="stat-liaisons">—</strong>
      </div>
      <div class="stat">
        <label>Segments</label>
        <strong id="stat-segments">—</strong>
      </div>
      <div class="stat">
        <label>Filtrés</label>
        <strong id="stat-filtered">—</strong>
      </div>
      <div class="stat file">
        <label>Fichier source</label>
        <strong id="stat-filename">—</strong>
      </div>
    </div>

    <button id="dl-btn" class="dl-btn">↓ Télécharger le fichier allégé</button>

    <div class="footer">Traitement 100% local — aucune donnée envoyée sur un serveur</div>
  `

  const dropZone  = document.getElementById('drop-zone')
  const fileInput = document.getElementById('file-input')
  const statusEl  = document.getElementById('status')
  const statsEl   = document.getElementById('stats')
  const dlBtn     = document.getElementById('dl-btn')

  let outputWb       = null
  let outputFilename = ''

  function showStatus(msg, type) {
    statusEl.textContent = msg
    statusEl.className   = 'status ' + type
  }

  function processFile(file) {
    showStatus('Lecture du fichier...', 'info')
    statsEl.classList.remove('visible')
    dlBtn.classList.remove('visible')
    outputWb = null

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const { workbook, stats } = processWorkbook(e.target.result)

        outputWb       = workbook
        outputFilename = file.name.replace(/\.[^.]+$/, '') + '_allege.xlsx'

        document.getElementById('stat-liaisons').textContent = stats.liaisons
        document.getElementById('stat-segments').textContent = stats.segments
        document.getElementById('stat-filtered').textContent = stats.filtered
        document.getElementById('stat-filename').textContent = file.name

        statsEl.classList.add('visible')
        dlBtn.textContent = '↓ Télécharger — ' + outputFilename
        dlBtn.classList.add('visible')
        showStatus('Traitement terminé avec succès.', 'ok')
      } catch (err) {
        showStatus('Erreur : ' + err.message, 'err')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  dropZone.addEventListener('click',     () => fileInput.click())
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('over') })
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('over'))
  dropZone.addEventListener('drop', e => {
    e.preventDefault()
    dropZone.classList.remove('over')
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) processFile(e.target.files[0])
  })

  dlBtn.addEventListener('click', () => {
    if (outputWb) downloadWorkbook(outputWb, outputFilename)
  })
}
