class Sim.Landscape extends THREE.Object3D
  constructor: ->
    super
    model_scene = Sim.MODELS['midsummer'].scene.clone()
    while model_scene.children.length > 0
      child = model_scene.children[0]
      if child.material
        if child.name == 'grass'
          map = child.material.map
          map.wrapS = THREE.RepeatWrapping
          map.wrapT = THREE.RepeatWrapping
          map.repeat.set( 6, 6 )
        child.material.side = THREE.DoubleSide
      @add(child)
    @size = {z: 38.65}

class Sim.MidsummerGame extends Sim.Game
  WALKSPEED = 0
  PEOPLE_COUNT = 5

  constructor: ->
    super

    @camera.position.set(0, 2.5, -2.2)

    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1)
    #hemiLight.color.setHSL(0.6, 1, 0.6)
    hemiLight.groundColor.setHSL(1,1,1)
    hemiLight.position.set(0, 500, 0)
    @scene.add(hemiLight)

    light = new THREE.PointLight( 0xffffff, 1.5, 100 )
    light.position.set( -10, 10, 10 )
    @scene.add( light )

    @landscape = new Sim.Landscape()
    @maypole = @landscape.getObjectByName('maypole')
    @scene.add(new Sim.Landscape())

    @loadSkybox()
    @angle = 0

    @danceCircle = new THREE.Object3D
    radius = 3

    for i in [1..PEOPLE_COUNT - 1]
      person = new Sim.Person(type: 'midsummer', gender: if i % 2 then 'male' else 'female')
      angle = 2 * Math.PI / PEOPLE_COUNT * i
      person.position.x = Math.cos(angle) * 3
      person.position.z = Math.sin(angle) * 3
      person.rotation.y = Math.atan2(-person.position.z, person.position.x)
      person.play('prance')
      @danceCircle.add(person)

    @danceCircle.position.set(@maypole.position.x, 0, @maypole.position.z)
    @scene.add(@danceCircle)

  loadSkybox: ->
    imagePrefix = 'assets/skybox/'
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

  tick: (delta) ->
    @angle -= 0.0006 * delta
    @danceCircle.rotation.y = @angle
    @camera.position.x = Math.cos(+@angle) * 4 + @maypole.position.x
    @camera.position.z =  Math.sin(-@angle) * 4 + @maypole.position.z
