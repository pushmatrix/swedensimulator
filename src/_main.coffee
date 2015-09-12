window.ASSETS_LOADING = 0

THREE.Utils = {
  cameraLookDir: (camera) ->
    vector = new THREE.Vector3(0, 0, -1)
    vector.applyEuler(camera.rotation, camera.rotation.order)
    vector
}

Array::remove = (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1
Array::randomize = -> @[Math.floor(Math.random() * @.length)]

class Sim
  @createRenderer: ->
    @container = document.createElement 'div'
    document.body.appendChild @container

    @renderer = new THREE.WebGLRenderer antialias: true
    @renderer.setSize window.innerWidth, window.innerHeight
    @renderer.setPixelRatio(window.devicePixelRatio)
    @renderer.setClearColor(0xf0f0f0)
    @container.appendChild @renderer.domElement

    if false #Stats? Uncomment to add fps counter
      @stats = new Stats()
      @stats.domElement.style.position = 'absolute'
      @stats.domElement.style.top = '0px'
      @container.appendChild @stats.domElement


    window.addEventListener 'resize', =>
      return unless @currentGame
      @currentGame.camera.aspect = window.innerWidth / window.innerHeight
      @renderer.setSize( window.innerWidth, window.innerHeight )
      @currentGame.camera.updateProjectionMatrix()

  @init: (callback) ->
    @clock = new THREE.Clock()
    @createRenderer()
    @vrEffect = new THREE.VREffect(@renderer)
    @vrEffect.setSize(window.innerWidth, window.innerHeight)
    @vrManager = new WebVRManager(@renderer, @vrEffect, { hideButton: false })
    Sim.loadGame('LoadingScreen')
    @render()
    @loadAssets =>
      @currentGame.loaded()
      callback?()

  @render: =>
    requestAnimationFrame(@render)
    return unless @currentGame
    delta = @clock.getDelta() * 1000
    @currentGame.controls.update()
    @currentGame.placeMenuButton()
    @currentGame.checkForButtonPress()
    @currentGame.tick(delta)
    THREE.AnimationHandler.update(delta)
    @vrManager.render(@currentGame.scene, @currentGame.camera, delta)
    @stats?.update()
    #@rendererStats.update(@renderer)

  @loadAssets: (callback)->
    for path in MODEL_PATH_LIST
      Sim.loadModel path, ->
        if ASSETS_LOADING == 0
          callback?()

  @loadGame: (game) ->
    @currentGame = new(Sim[game])
    @currentGame.start()

class Sim.Game
  setupCamera: ->
    fov = 50
    aspect = window.innerWidth / window.innerHeight
    near = 1
    far = 100000

    @camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    @camera.position.y = 2.5
    @scene.add(@camera)

  setupControls: ->
    @controls = new THREE.VRControls(@camera)

  load: =>
    if ASSETS_LOADING > 0
      requestAnimationFrame(@load)
    else
      console.log('Starting Game')

  start: ->

  tick: ->
    throw new Error("Subclasses should implement tick")

  constructor: ->
    #@gui = new dat.GUI()
    @_buttons = []
    @started = false
    @scene = new THREE.Scene

    @setupCamera()
    @setupControls()

    @raycaster = new THREE.Raycaster()

    @placeMenuButton()

  addButton: (path, callback) ->
    button = new Button path, callback
    @_buttons.push(button)
    @scene.add(button)
    button

  checkForButtonPress: ->
    @cameraDirection = THREE.Utils.cameraLookDir(@camera)
    @raycaster.set(@camera.position, @cameraDirection)
    intersect = @raycaster.intersectObjects(@_buttons, true)[0]
    if intersect
      if intersect.object.uuid != @currentFocus?.object.uuid
        @hoveredButton = intersect.object.parent
        @currentFocus = intersect
        @hoverStartAt = new Date()

      delta = new Date() - @hoverStartAt
      scale = (1 - delta / 1500) * 0.25 + 0.75
      @hoveredButton.scale.x = scale
      @hoveredButton.scale.y = scale
      @hoveredButton.scale.z = scale

      if delta > 1500
        @currentFocus = null
        @hoveredButton.press()
    else
      @hoveredButton?.scale.set(1, 1, 1)
      @hoveredButton = null
      @currentFocus = null

  placeMenuButton: ->
    @menuButton ||= @addButton "menu.png", ->
      Sim.loadGame('Menu')
    @menuButton.position.z = @camera.position.z
    @menuButton.position.x = @camera.position.x
    @menuButton.position.y = 1
    @menuButton.rotation.x = -Math.PI * 0.5

  start: ->
    return if @started
    console.log "Starting game..."
    @started = true

$ ->
  Sim.init =>
  #  Sim.loadGame('VaskaGame')

  #loadGame(Menu)
  console.log "Loading #{window.ASSETS_LOADING} assets..."
