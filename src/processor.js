import * as XLSX from 'xlsx'

const TYPE_LIAISON = {
  'POP_CO':    'Liaison BUS',
  'CO_CO':     'Liaison BUS',
  'NRO_CO':    'Liaison Collecte NRO',
  'NRO_NRO':   'Liaison Collecte NRO',
  'CO_NRABTS': 'Liaison Collecte BTS',
  'CO_BTS':    'Liaison Collecte BTS',
}

const TYPE_EXT = {
  'NRA COLLECTE':  'NRA-Collecte',
  'NRA FRONTIERE': 'NRA-Frontière',
  'NRA FRONTIÈRE': 'NRA-Frontière',
  'NRA PASSAGE':   'NRA',
  'NRABTS':        'NRA-BTS',
  'NRA T/H/M':     'NRA',
}

function mapLiaison(v) {
  return TYPE_LIAISON[String(v || '').trim()] || String(v || '')
}

function mapExt(v) {
  const k = String(v || '').trim().toUpperCase()
  for (const [pat, rep] of Object.entries(TYPE_EXT)) {
    if (k === pat.toUpperCase()) return rep
  }
  return String(v || '')
}

function mapFourn(v) {
  const s = String(v || '').toUpperCase()
  if (s.includes('HORS ORANGE')) return 'FREE / OI'
  if (s.includes('VENDU')) return 'ORANGE'
  return String(v || '')
}

function rowColor(p) {
  const s = String(p || '').toUpperCase()
  if (s.includes('VENDU HORS CPM')) return 'FFD7F5D7'
  if (s.includes('VENDU'))          return 'FFD7E8FF'
  if (s.includes('HORS ORANGE'))    return 'FFFFFBD7'
  return null
}

function cv(r, k) {
  const v = r[k]
  return (v === undefined || v === null) ? '' : v
}

function findSheet(wb, keywords) {
  const ignore = ['sous-segments', 'nrabts', 'sous segments']
  for (const name of wb.SheetNames) {
    const nl = name.toLowerCase()
    if (ignore.some(i => nl.includes(i))) continue
    if (keywords.some(k => nl.includes(k))) return name
  }
  return null
}

function applyStyles(ws, rows, getPerimetre) {
  const hStyle = {
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { fgColor: { rgb: 'FF1F4E79' } },
    alignment: { horizontal: 'center' },
  }
  const range = XLSX.utils.decode_range(ws['!ref'])

  for (let c = 0; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    if (!ws[addr]) ws[addr] = { v: '', t: 's' }
    ws[addr].s = hStyle
  }

  rows.forEach((row, i) => {
    const col = rowColor(getPerimetre(row))
    if (!col) return
    const s = { fill: { fgColor: { rgb: col } } }
    for (let ci = 0; ci <= range.e.c; ci++) {
      const a = XLSX.utils.encode_cell({ r: i + 1, c: ci })
      if (!ws[a]) ws[a] = { v: '', t: 's' }
      ws[a].s = s
    }
  })

  ws['!autofilter'] = { ref: ws['!ref'] }
  ws['!freeze']     = { xSplit: 0, ySplit: 1 }
}

export function processWorkbook(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer)
  const wb = XLSX.read(data, { type: 'array', cellStyles: true })

  const lsName = findSheet(wb, ['liaison'])
  const sgName = findSheet(wb, ['segment'])

  if (!lsName) throw new Error('Onglet "Liaisons" introuvable dans ce fichier.')
  if (!sgName) throw new Error('Onglet "Segments" introuvable dans ce fichier.')

  const lsRaw = XLSX.utils.sheet_to_json(wb.Sheets[lsName], { defval: '' })
  const sgRaw = XLSX.utils.sheet_to_json(wb.Sheets[sgName], { defval: '' })

  const lsOut = lsRaw.map(r => ({
    'Ref Liaison':          cv(r, 'Nom_liaison') || cv(r, 'Nom_Liaison'),
    'Type liaison':         mapLiaison(cv(r, 'TypeSegment')),
    'Liaison':              cv(r, 'TypeSegment'),
    'ExtremiteOrigineCode': cv(r, '42CExtrALiaison'),
    'Type ExtA':            mapExt(cv(r, 'TypeExtrALiaison')),
    'ExtremiteCibleCode':   cv(r, '42CExtrBLiaison'),
    'Type ExtB':            mapExt(cv(r, 'TypeExtrBLiaison')),
  }))

  let filteredCount = 0
  const sgOut = sgRaw.filter(r => {
    const perim = String(cv(r, 'PerimetreCommercial') || '').trim().toUpperCase()
    const orig  = String(cv(r, 'ExtremiteOrigineCode') || '').trim()
    const cible = String(cv(r, 'ExtremiteCibleCode')   || '').trim()
    if (perim === 'VENDU HORS CPM' && orig === cible) { filteredCount++; return false }
    return true
  }).map(r => {
    const nbFo = parseInt(cv(r, 'NombreFoCommandablesEtude'), 10)
    return {
      'Ref Liaison':                cv(r, 'Nom_Liaison') || cv(r, 'Nom_liaison'),
      'Type liaison':               mapLiaison(cv(r, 'TypeSegment')),
      'Liaison':                    cv(r, 'TypeSegment'),
      'NomSegment':                 cv(r, 'CodeSegment'),
      'Fournisseur':                mapFourn(cv(r, 'PerimetreCommercial')),
      'ExtremiteOrigineCode':       cv(r, 'ExtremiteOrigineCode'),
      'Type ExtA':                  mapExt(cv(r, 'Type Ext A Segment') || cv(r, 'TypeExtrASegment')),
      'ExtremiteOrigineType':       cv(r, 'ExtremiteOrigineType'),
      'ExtremiteCibleCode':         cv(r, 'ExtremiteCibleCode'),
      'Type ExtB':                  mapExt(cv(r, 'Type Ext B Segment') || cv(r, 'TypeExtrBSegment')),
      'ExtremiteCibleType':         cv(r, 'ExtremiteCibleType'),
      'NombreFoCommandablesEtude':  cv(r, 'NombreFoCommandablesEtude'),
      'Longueur théorique (ml)':    cv(r, 'Distance (en m)'),
      'Mux':                        nbFo === 6 ? 'Oui' : 'Non',
      'Perimetre':                  cv(r, 'PerimetreCommercial'),
    }
  })

  const newWb = XLSX.utils.book_new()

  const wsL = XLSX.utils.json_to_sheet(lsOut)
  wsL['!cols'] = [28, 22, 18, 22, 18, 22, 18].map(wch => ({ wch }))
  applyStyles(wsL, lsOut, () => '')
  XLSX.utils.book_append_sheet(newWb, wsL, 'Liaisons')

  const wsS = XLSX.utils.json_to_sheet(sgOut)
  wsS['!cols'] = Array(15).fill({ wch: 22 })
  applyStyles(wsS, sgOut, r => r['Perimetre'])
  XLSX.utils.book_append_sheet(newWb, wsS, 'Segments')

  return {
    workbook: newWb,
    stats: {
      liaisons: lsOut.length,
      segments: sgOut.length,
      filtered: filteredCount,
    },
  }
}

export function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename, { bookSST: false, type: 'binary', cellStyles: true })
}
