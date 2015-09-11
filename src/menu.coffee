class Button extends THREE.Object3D
  constructor: (texture, @onPress) ->
    super
    texture = THREE.ImageUtils.loadTexture( "assets/#{texture}" )
    material = new THREE.MeshLambertMaterial({ map : texture, transparent: true })
    material.side = THREE.DoubleSide
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    @add(plane)

  press: ->
    @onPress()

class Sim.Menu extends Sim.Game
  GAMES = [
    'StreetGame'
    'WaitGame'
    'VaskaGame'
    'MidsummerGame'
    'WinterGame'
  ]

  constructor: ->
    super

    @scene.remove(@menuButton)

    Sim.renderer.setClearColor(0xf0f0f0)
    @loadSkybox()
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1)
    # hemiLight.color.setHSL(0.6, 1, 0.6)
    # hemiLight.groundColor.setHSL(1,1,1)
    hemiLight.position.set(0, 500, 0)
    @scene.add(hemiLight)


    map = THREE.ImageUtils.loadTexture( "assets/crosshair.png" );
    material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } )
    material.depthTest = false
    sprite = new THREE.Sprite( material )
    sprite.scale.set(0.05, 0.05, 0.05)
    sprite.position.z = -4
    @camera.add( sprite )

    for game, i in GAMES
      do (game, i) =>
        angle = (i * 35) * Math.PI / 180
        radius = 3

        button = @addButton "#{game}.png", -> Sim.loadGame(game)
        button.position.z = radius * -Math.cos(angle)
        button.position.y = @camera.position.y
        button.position.x = Math.sin(angle) * radius
        button.rotation.y = -angle

    setTimeout =>
      @start()
    , 0

  loadSkybox: ->
    imagePrefix = 'assets/skybox/berget/'
    directions  = ["posx", "negx", "posy", "negy", "posz", "negz"]
    imageSuffix = ".jpg"
    skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 )

    materialArray = []
    for direction in directions
      materialArray.push(new THREE.MeshBasicMaterial({
          map: THREE.ImageUtils.loadTexture(imagePrefix + direction + imageSuffix),
          side: THREE.BackSide
      }))
    skyMaterial = new THREE.MeshFaceMaterial(materialArray)
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial)
    skyBox.rotation.y = -Math.PI * 0.5
    @scene.add(skyBox)

  stage: ->

  tick: ->
