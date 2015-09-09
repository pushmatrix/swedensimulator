class Sim.LoadingScreen extends Sim.Game

  constructor: ->
    super

    Sim.renderer.setClearColor(0)

    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6)
    # hemiLight.color.setHSL(0.6, 1, 0.6)
    # hemiLight.groundColor.setHSL(1,1,1)
    hemiLight.position.set(0, 500, 0)
    @scene.add(hemiLight)

    @createTexts('Loading...')

    @scene.add(@container)

    size = 10
    step = 1
    gridHelper = new THREE.GridHelper(size, step)
    gridHelper.position.y = -1
    @scene.add(gridHelper)

  createTexts: (text) ->
    if @container?
      @scene.remove(@container)

    @container = new THREE.Object3D

    material = new THREE.MeshPhongMaterial({
        color: 0xdddddd
    })

    textGeom = new THREE.TextGeometry(text, {
        font: 'helvetiker',
        size: 0.1,
        height: 0.05
    })

    for i in [0..3]
      textMesh = new THREE.Mesh( textGeom, material )
      textGeom.computeBoundingBox()
      textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x
      textWrapper = new THREE.Object3D
      textMesh.position.set(- 0.5 * textWidth, 0, -1.5)
      textWrapper.add(textMesh)
      textWrapper.rotation.y = i / 4 *  Math.PI * 2
      textWrapper.position.y = @camera.position.y
      @container.add(textWrapper)


    @scene.add(@container)

  loaded: ->
    @loaded = true
    #@menuButton.position.x = 0
    Sim.renderer.setClearColor(0xf0f0f0)
    @createTexts('Look down!')

  placeMenuButton: ->
    super
    @menuButton.position.x = if @loaded then 0 else -1000000

  tick: ->
