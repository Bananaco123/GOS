import { releaseCatalog, collections, articles, faqs } from './content.js'

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`
const platformNames = { windows: 'Windows', macos: 'macOS' }
const releases = [...releaseCatalog.releases].sort((a, b) => b.date.localeCompare(a.date))
const latest = releases.find((release) => release.id === releaseCatalog.latestId)
const retained = releases.filter((release) => release.id !== releaseCatalog.latestId && release.retainInstaller)
const formatDate = (date) => date.replaceAll('-', '.')
let category = 'all'
let searchText = ''
let activeView = ''
let dialogTrigger = null

export function enableTabKeys(buttons) {
  buttons.forEach((button, index) => button.addEventListener('keydown', (event) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = buttons.length - 1
    else return
    event.preventDefault()
    buttons[next].focus()
    buttons[next].click()
  }))
}

function selectView(view, { historyMode = 'push', focus = false } = {}) {
  const nextView = ['product', 'downloads', 'manual'].includes(view) ? view : 'product'
  if (historyMode !== 'none' && location.hash !== `#${nextView}`) {
    history[historyMode === 'replace' ? 'replaceState' : 'pushState'](null, '', `#${nextView}`)
  }
  const wasHidden = document.activeElement.closest('[data-panel]')?.id !== nextView
  $$('[data-panel]').forEach((panel) => { panel.hidden = panel.id !== nextView })
  $$('[data-main-tab]').forEach((button) => {
    const selected = button.dataset.mainTab === nextView
    button.setAttribute('aria-selected', String(selected))
    button.tabIndex = selected ? 0 : -1
    button.classList.toggle('is-active', selected)
  })
  activeView = nextView
  const titles = { product: 'GOS — 让增长，自然发生', downloads: '版本下载 · GOS', manual: '操作手册 · GOS' }
  document.title = titles[nextView]
  if (focus || (wasHidden && document.activeElement.closest('[hidden]'))) $(`#tab-${nextView}`).focus({ preventScroll: true })
  document.dispatchEvent(new CustomEvent('portal:viewchange', { detail: nextView }))
}

$$('[data-main-tab]').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.mainTab)))
enableTabKeys($$('[data-main-tab]'))
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-view]')
  if (!link) return
  event.preventDefault()
  if (dialog.open) dialog.close()
  selectView(link.dataset.view, { focus: true })
})
window.addEventListener('popstate', () => selectView(location.hash.slice(1), { historyMode: 'none' }))
window.addEventListener('hashchange', () => selectView(location.hash.slice(1), { historyMode: 'replace' }))

function installerURL(release, selectedPlatform) {
  const installer = release?.installers[selectedPlatform]
  // Example records and absent/invalid URLs can never trigger a fake download.
  let url = null
  if (!releaseCatalog.example && release?.retainInstaller && installer?.url) {
    try {
      const parsed = new URL(installer.url, location.href)
      if (['https:', 'http:'].includes(parsed.protocol)) url = parsed.href
    } catch { /* Missing or invalid package links stay unavailable. */ }
  }
  return url
}

function installerMarkup(release, selectedPlatform, label, className = 'button button-primary', showPlatformIcon = false) {
  const url = installerURL(release, selectedPlatform)
  const content = `${showPlatformIcon ? icon(selectedPlatform === 'windows' ? 'windows' : 'apple') : ''}<span>${escapeHTML(label)}</span>${icon('down')}`
  if (!url) return `<button class="${className} is-unavailable" data-installer="${selectedPlatform}" disabled aria-label="${escapeHTML(label)}，安装包暂未提供">${content}</button>`
  return `<a class="${className}" data-installer="${selectedPlatform}" href="${escapeHTML(url)}" download rel="noopener">${content}</a>`
}

function renderLatest() {
  $('#latest-version').textContent = latest ? `v${latest.id}` : '暂无版本'
  $('#latest-date').textContent = latest ? formatDate(latest.date) : '—'
  $('#latest-summary').textContent = latest?.summary || '客户端版本发布后将在这里展示。'
  $('#latest-download').innerHTML = Object.entries(platformNames).map(([key, name]) => installerMarkup(latest, key, `${name} 下载`, 'button button-primary platform-download', true)).join('')
  const missingPlatforms = Object.entries(platformNames).filter(([key]) => !installerURL(latest, key)).map(([, name]) => name)
  $('#latest-download-note').textContent = missingPlatforms.length === 2 ? '安装包暂未提供' : missingPlatforms.length ? `${missingPlatforms.join(' / ')} 安装包暂未提供` : ''
  $('#latest-download-note').hidden = missingPlatforms.length === 0
  $('#latest-changes').innerHTML = (latest?.changes || []).map((change) => `<li><span class="change-label">${escapeHTML(change.type)}</span><span>${escapeHTML(change.text)}</span></li>`).join('')
  $('#history-rows').innerHTML = retained.length ? retained.map((release) => `
    <div class="history-row">
      <div class="history-version"><strong>v${escapeHTML(release.id)}</strong><span>${formatDate(release.date)}</span></div>
      <button class="history-open" data-release="${escapeHTML(release.id)}" aria-label="查看 v${escapeHTML(release.id)} 历史版本">查看版本 ${icon('arrow')}</button>
    </div>`).join('') : '<p class="empty-copy">暂无保留的历史版本。</p>'
}

function renderTimeline() {
  $('#timeline-items').innerHTML = releases.map((release, index) => `
    <details class="timeline-item ${index === 0 ? 'is-latest' : ''}" ${index === 0 ? 'open' : ''}>
      <summary><span class="timeline-dot"></span><span class="timeline-date">${formatDate(release.date)}</span><span class="timeline-version">v${escapeHTML(release.id)}${release.id === releaseCatalog.latestId ? '<span class="latest-pill">最新</span>' : ''}</span><span class="timeline-title">${escapeHTML(release.title)}</span>${icon('chevron')}</summary>
      <div class="timeline-detail"><ul>${release.changes.map((change) => `<li><span class="change-label">${escapeHTML(change.type)}</span><span>${escapeHTML(change.text)}</span></li>`).join('')}</ul>
      ${release.retainInstaller ? `<button class="timeline-release-link" data-release="${escapeHTML(release.id)}">查看此版本 ${icon('arrow')}</button>` : '<span class="record-only">仅保留更新记录</span>'}</div>
    </details>`).join('') || '<p class="empty-copy">暂无更新记录。</p>'
}

const dialog = $('#content-dialog')
function openDialog({ eyebrow, title, description, body, footer }, trigger) {
  dialogTrigger = trigger || document.activeElement
  $('#dialog-eyebrow').textContent = eyebrow
  $('#dialog-title').textContent = title
  $('#dialog-description').textContent = description
  $('#dialog-body').innerHTML = body
  $('#dialog-footer').innerHTML = footer || '<span>GOS · 客户端使用指南</span><button class="text-link" data-close-dialog>返回手册 ' + icon('arrow') + '</button>'
  dialog.scrollTop = 0
  if (!dialog.open) dialog.showModal()
}

function openRelease(id, trigger) {
  const release = releases.find((item) => item.id === id)
  if (!release) return
  openDialog({
    eyebrow: release.id === releaseCatalog.latestId ? 'LATEST RELEASE' : 'RELEASE ARCHIVE',
    title: `GOS v${release.id}`,
    description: `${formatDate(release.date)} · ${release.title}${releaseCatalog.example ? ' · 示例版本' : ''}`,
    body: `<ul class="release-dialog-changes">${release.changes.map((change) => `<li><span class="change-label">${escapeHTML(change.type)}</span>${escapeHTML(change.text)}</li>`).join('')}</ul>
      <div class="dialog-installers">${Object.entries(platformNames).map(([key, name]) => `<div><span>${icon(key === 'windows' ? 'windows' : 'apple')}${name}</span>${installerMarkup(release, key, `下载 ${name} 版`)}<small>${installerURL(release, key) ? '客户端安装包' : '安装包暂未提供'}</small></div>`).join('')}</div>`,
    footer: `<span>${release.id === releaseCatalog.latestId ? '最新版本' : '历史保留版本'}</span><button class="text-link" data-close-dialog>返回下载页 ${icon('arrow')}</button>`,
  }, trigger)
}

function openArticle(id, trigger) {
  const article = articles.find((item) => item.id === id)
  if (!article) return
  const collection = collections.find((item) => item.id === article.collection)
  openDialog({
    eyebrow: `GOS GUIDE / ${collection.title}`,
    title: article.title,
    description: article.description,
    body: `<ol class="article-sections">${article.sections.map((section) => `<li><div><h3>${escapeHTML(section.title)}</h3><p>${escapeHTML(section.text)}</p></div></li>`).join('')}</ol>`,
    footer: article.action ? `<span>${escapeHTML(collection.title)} · GOS 使用指南</span><button class="button button-primary" data-view="${article.action.view}">${escapeHTML(article.action.label)}${icon('arrow')}</button>` : undefined,
  }, trigger)
}

document.addEventListener('click', (event) => {
  const release = event.target.closest('[data-release]')
  const article = event.target.closest('[data-article]')
  if (release) openRelease(release.dataset.release, release)
  if (article) openArticle(article.dataset.article, article)
  if (event.target.closest('[data-close-dialog]')) dialog.close()
})
$('.dialog-close').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect()
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close()
})
dialog.addEventListener('close', () => {
  if (dialogTrigger?.isConnected && !dialogTrigger.closest('[hidden]')) dialogTrigger.focus({ preventScroll: true })
})

function matches(text, query) {
  const haystack = text.normalize('NFKC').toLocaleLowerCase()
  return query.normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))
}
function articleText(article) {
  return [article.title, article.description, ...article.keywords, ...article.sections.flatMap((section) => [section.title, section.text])].join(' ')
}
function faqMarkup(items) {
  return items.map((faq) => `<details class="faq-item"><summary>${escapeHTML(faq.question)}<span class="faq-toggle">+</span></summary><p>${escapeHTML(faq.answer)}</p></details>`).join('')
}

function renderManual() {
  const query = searchText.trim()
  const scopedArticles = articles.filter((article) => category === 'all' || article.collection === category)
  const foundArticles = scopedArticles.filter((article) => !query || matches(articleText(article), query))
  const foundFAQs = faqs.filter((faq) => (category === 'all' || faq.collection === category) && (!query || matches(`${faq.question} ${faq.answer}`, query)))
  $('#search-clear').hidden = searchText.length === 0
  $('#search-shortcut').hidden = searchText.length > 0
  $('#manual-view-label').textContent = query ? '搜索结果' : category === 'all' ? '按场景查阅' : collections.find((item) => item.id === category).title
  $('#manual-count').textContent = query ? `${foundArticles.length} 篇文章 · ${foundFAQs.length} 个常见问题` : `${foundArticles.length} 篇文章`
  $('#search-live').textContent = query ? `找到 ${foundArticles.length} 篇文章，${foundFAQs.length} 个常见问题` : `显示 ${foundArticles.length} 篇文章`
  const content = $('#manual-collections')
  content.classList.toggle('is-search-results', Boolean(query))
  if (query) {
    content.innerHTML = foundArticles.length ? foundArticles.map((article) => `
      <button class="article-result" data-article="${article.id}"><span class="result-icon">${icon(collections.find((item) => item.id === article.collection).icon)}</span><span><small>${escapeHTML(collections.find((item) => item.id === article.collection).title)}</small><strong>${escapeHTML(article.title)}</strong><span>${escapeHTML(article.description)}</span></span>${icon('diagonal')}</button>`).join('')
      : `<div class="search-empty">${icon('search')}<h3>没有找到相关文章</h3><p>${foundFAQs.length ? '常见问题中有匹配内容。' : '换一个关键词，或重新浏览全部文章。'}</p><button class="text-link" id="search-reset">浏览全部文章 ${icon('arrow')}</button></div>`
  } else {
    content.innerHTML = collections.filter((collection) => category === 'all' || collection.id === category).map((collection) => {
      const items = articles.filter((article) => article.collection === collection.id)
      return `<section class="collection-card collection-${collection.color}"><div class="collection-heading"><span class="collection-icon">${icon(collection.icon)}</span><span><h3>${escapeHTML(collection.title)}</h3><small>${items.length} 篇文章</small></span></div><p>${escapeHTML(collection.description)}</p><div class="collection-articles">${items.map((article) => `<button data-article="${article.id}"><span>${escapeHTML(article.title)}</span>${icon('chevron')}</button>`).join('')}</div></section>`
    }).join('')
  }
  $('#faq-count').textContent = String(foundFAQs.length).padStart(2, '0')
  $('#faq-items').innerHTML = foundFAQs.length ? faqMarkup(foundFAQs) : '<p class="faq-empty">当前范围内暂无匹配问题。</p>'
}

$('#manual-filters').innerHTML = [{ id: 'all', title: '全部合集' }, ...collections].map((collection) => `<button class="collection-filter ${collection.id === 'all' ? 'is-selected' : ''}" data-collection="${collection.id}" aria-pressed="${collection.id === 'all'}">${escapeHTML(collection.title)}</button>`).join('')
$('#manual-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-collection]')
  if (!button) return
  category = button.dataset.collection
  $$('[data-collection]').forEach((item) => {
    item.classList.toggle('is-selected', item === button)
    item.setAttribute('aria-pressed', String(item === button))
  })
  renderManual()
})
$('#manual-search').addEventListener('input', (event) => {
  searchText = event.target.value
  renderManual()
})
$('#search-clear').addEventListener('click', () => {
  searchText = ''
  $('#manual-search').value = ''
  renderManual()
  $('#manual-search').focus()
})
$('#manual-collections').addEventListener('click', (event) => {
  if (!event.target.closest('#search-reset')) return
  searchText = ''
  $('#manual-search').value = ''
  $('[data-collection="all"]').click()
  $('#manual-search').focus()
})
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && activeView === 'manual' && !dialog.open && !event.target.closest('input,textarea,[contenteditable=true]') && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    $('#manual-search').focus()
  }
})

renderLatest()
renderTimeline()
renderManual()
selectView(location.hash.slice(1) || 'product', { historyMode: 'replace' })
