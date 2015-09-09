MIN_Z = -350
MAX_Z = 100

class Sim.Pedestrian extends Sim.Person
  WALKSPEED = 0.006
  walk: (delta)->
    @position.z += WALKSPEED * delta

class Sim.Road extends THREE.Object3D
  constructor: ->
    super
    model_scene = Sim.MODELS['city'].scene.clone()
    while model_scene.children.length > 0
      child = model_scene.children[0]
      if child.material
        child.material.side = THREE.DoubleSide
      @add(child)
    @size = {z: 180}

class Sim.StreetGame extends Sim.Game
  WALKSPEED = 0.005
  PERSON_RATE = 5000

  setupCamera: ->
    super
    @camera.position.set(10, 2.5, -2)

  constructor: ->
    super

    @timeSinceLastPerson = 0

    hemiLight = new THREE.HemisphereLight(0x4D4D4D, 0x4D4D4D, 2.3)
    hemiLight.position.set(0, 500, 0)
    @scene.add(hemiLight)

    dirLight = new THREE.DirectionalLight( 0xffffff, 0.3 )
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(-1, 1.75, 0.95)
    dirLight.position.multiplyScalar(50)
    @scene.add(dirLight)

    @loadSkybox()

    @roads = []
    for i in [0..7]
      road = new Sim.Road()
      road.position.z = 22 * 3 - road.size.z * i
      road.position.y -= 0.2
      @scene.add(road)
      @roads.push(road)

    @pedestrians = {}

  start: ->
    for i in [0..3]
      pedestrian = @createPedestrian()
      pedestrian.position.z = -30 * i

    strollerModel = Sim.MODELS['stroller']
    for material in strollerModel.materials
      material.side = THREE.DoubleSide
    @stroller = new THREE.Mesh(strollerModel.geometry, new THREE.MeshFaceMaterial(strollerModel.materials))
    @stroller.scale.set(0.6, 0.6, 0.6)
    @stroller.position.x = @camera.position.x - 0.2
    @stroller.position.z = -3.2
    @stroller.position.y = 0
    @stroller.rotation.y = Math.PI
    @scene.add(@stroller)

  loadSkybox: ->
    imagePrefix = 'assets/skybox/city/'
    directions  = ["posz", "posz", "posy", "posz", "posz", "negz"]
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
    @scene.add(skyBox)

  createPedestrian: ->
    if Math.random() > 0.8
      type = 'athletic'
      animation = 'jogging'
    else
      type = 'regular'
      animation = 'walking'
    pedestrian = new Sim.Pedestrian(type: type)
    pedestrian.position.z = -100
    pedestrian.position.x = [8.5, 11.5].randomize()
    @pedestrians[pedestrian.uuid] = pedestrian
    pedestrian.play(animation)
    @scene.add(pedestrian)
    pedestrian

  tick: (delta) ->
    @timeSinceLastPerson += delta
    if @timeSinceLastPerson > PERSON_RATE
      @createPedestrian()
      @timeSinceLastPerson = 0

    for road in @roads
      road.position.z += WALKSPEED * delta

    if @roads[0].position.z > @roads[0].size.z * 2
      for road in @roads
        road.position.z -= @roads[0].size.z

    for id, pedestrian of @pedestrians
      pedestrian.walk(delta)
      if pedestrian.position.z > 40
        @scene.remove(pedestrian)
        delete @pedestrians[pedestrian.uuid]
