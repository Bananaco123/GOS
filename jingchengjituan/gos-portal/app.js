import { enableTabKeys } from './portal-ui.js'

const featureData = {
  customer: { kicker: 'CUSTOMER CONNECTION', caption: '每一次对话，都是新的可能', icon: 'chat', rotation: 0 },
  ai: { kicker: 'INTELLIGENCE IN COLLABORATION', caption: '业务员 · 销冠 · 翻译，协同在线', icon: 'spark', rotation: 0.38 },
  knowledge: { kicker: 'KNOWLEDGE THAT GROWS', caption: '让每一份经验，成为团队的底气', icon: 'book', rotation: -0.32 },
  insights: { kicker: 'CLARITY FOR EVERY DECISION', caption: '运营 · 项目 · 业务，全局看见', icon: 'chart', rotation: 0.66 },
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let targetRotation = 0
const featureButtons = [...document.querySelectorAll('[data-feature]')]
featureButtons.forEach((button) => button.addEventListener('click', () => {
  const feature = featureData[button.dataset.feature]
  featureButtons.forEach((item) => {
    const selected = item === button
    item.classList.toggle('is-selected', selected)
    item.setAttribute('aria-selected', String(selected))
    item.tabIndex = selected ? 0 : -1
  })
  document.querySelector('#feature-kicker').textContent = feature.kicker
  document.querySelector('#feature-caption').textContent = feature.caption
  document.querySelector('#feature-panel-icon use').setAttribute('href', '#i-' + feature.icon)
  document.querySelector('#feature-panel').setAttribute('aria-labelledby', button.id)
  targetRotation = feature.rotation
}))
enableTabKeys(featureButtons)

// The product illustration is self-contained; its CSS counterpart stays visible
// when WebGL is unavailable. No external image or runtime service is required.
async function createSculpture() {
  const stage = document.querySelector('#sculpture-stage')
  const [THREE, { RoomEnvironment }] = await Promise.all([
    import('three'), import('./vendor/RoomEnvironment.js'),
  ])
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.5
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 0, 8.9)
  const environment = new RoomEnvironment()
  const generator = new THREE.PMREMGenerator(renderer)
  const environmentMap = generator.fromScene(environment, 0.03)
  scene.environment = environmentMap.texture
  environment.dispose()
  generator.dispose()

  const sculpture = new THREE.Group()
  scene.add(sculpture)
  const blueMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4b8fe7, metalness: 0.56, roughness: 0.17,
    clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3,
  })
  const pearlMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc5d9f4, metalness: 0.68, roughness: 0.15,
    clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.4,
  })
  const silverMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe2ecfc, metalness: 0.75, roughness: 0.13,
    clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.45,
  })

  const blueRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.285, 48, 160), blueMaterial)
  blueRing.rotation.set(0.16, -0.42, -0.42)
  blueRing.scale.set(1, 1.09, 1)
  sculpture.add(blueRing)

  const pearlRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.135, 36, 160), pearlMaterial)
  pearlRing.rotation.set(0.87, 0.55, 0.62)
  sculpture.add(pearlRing)

  const silverRing = new THREE.Mesh(new THREE.TorusGeometry(1.97, 0.078, 28, 160), silverMaterial)
  silverRing.rotation.set(-0.64, -0.77, -0.38)
  sculpture.add(silverRing)

  const fineRing = new THREE.Mesh(new THREE.TorusGeometry(2.14, 0.012, 10, 170), new THREE.MeshStandardMaterial({ color: 0x7ba6e2, metalness: 0.65, roughness: 0.3 }))
  fineRing.rotation.set(1.05, -0.25, 0.35)
  sculpture.add(fineRing)

  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.10, 24, 20), silverMaterial)
  pearl.position.set(-1.7, -0.92, 0.35)
  sculpture.add(pearl)
  const light = new THREE.DirectionalLight(0xe7f1ff, 3.1)
  light.position.set(-3, 5, 4)
  scene.add(light)
  const rim = new THREE.DirectionalLight(0x4287ed, 2)
  rim.position.set(4, -2, 3)
  scene.add(rim)
  scene.add(new THREE.AmbientLight(0xe5efff, 1.3))

  let visible = true
  let running = false
  let frame = 0
  let lastTime = 0
  let currentRotation = 0
  const pointer = { x: 0, y: 0 }
  const visual = document.querySelector('.hero-visual')
  function render(time = 0) {
    if (!running) return
    frame = requestAnimationFrame(render)
    if (time - lastTime < 32 && !reducedMotion.matches) return
    lastTime = time
    currentRotation = reducedMotion.matches ? targetRotation : currentRotation + (targetRotation - currentRotation) * 0.04
    const phase = reducedMotion.matches ? 0 : time * 0.00017
    sculpture.rotation.set(0.06 + Math.sin(phase) * 0.045 + pointer.y * 0.05, currentRotation * 0.36 + Math.cos(phase * 0.8) * 0.08 + pointer.x * 0.07, -0.12 + Math.sin(phase * 0.7) * 0.055)
    sculpture.position.y = reducedMotion.matches ? 0 : Math.sin(phase * 1.4) * 0.055
    renderer.render(scene, camera)
    if (reducedMotion.matches && Math.abs(currentRotation - targetRotation) < 0.002) stop()
  }
  function start() {
    if (running || !visible || document.hidden) return
    running = true
    frame = requestAnimationFrame(render)
  }
  function stop() { running = false; cancelAnimationFrame(frame) }
  function resize() {
    const { width, height } = stage.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    // Keep the sculpture inside the narrow mobile stage and wide desktop stage.
    camera.position.z = camera.aspect < 0.9 ? 10.2 : 8.9
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
    start()
  }
  new ResizeObserver(resize).observe(stage)
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else stop()
  }, { rootMargin: '40px' }).observe(stage)
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start())
  visual.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType === 'touch') return
    const bounds = visual.getBoundingClientRect()
    pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5
    pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5
  })
  visual.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0 })
  featureButtons.forEach((button) => button.addEventListener('click', start))
  reducedMotion.addEventListener('change', start)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stop()
    stage.classList.remove('webgl-ready')
  })
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    resize()
    stage.classList.add('webgl-ready')
  })
  stage.append(renderer.domElement)
  resize()
  stage.classList.add('webgl-ready')
}

createSculpture().catch(() => {
  document.querySelector('#sculpture-stage').dataset.renderer = 'css'
})
