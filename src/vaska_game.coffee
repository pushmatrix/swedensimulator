class Sim.Bar extends THREE.Object3D
  constructor: ->
    super
    model_scene = Sim.MODELS['bar'].scene.clone()
    while model_scene.children.length > 0
      child = model_scene.children[0]
      if child.material
        child.material.side = THREE.DoubleSide
      @add(child)
    @size = {z: 38.65}


class Sim.LiquidParticle extends THREE.Object3D
  constructor: ->
    super
    map = THREE.ImageUtils.loadTexture( "assets/liquid.png" );
    material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } )
    sprite = new THREE.Sprite( material )
    sprite.scale.set(0.05, 0.05, 0.05)
    @add(sprite)

class Sim.VaskaGame extends Sim.Game
  WALKSPEED = 0
  setupCamera: ->
    super

    @camera.position.z = -2.2
    @camera.position.y = 2.5
  constructor: ->
    super

    hemiLight = new THREE.HemisphereLight(0xFF80B2, 0xFF80B2, 1.19)
    hemiLight.position.set(0, 500, 500)
    @scene.add(hemiLight)

    light = new THREE.PointLight( 0xffffff, 2, 5 )
    light.position.set( 0, 0, 0 )
    @scene.add( light )

    bottleModel = Sim.MODELS['bottle']
    @bottle = new THREE.Mesh(bottleModel.geometry, bottleModel.materials[0])
    @bottle.scale.set(1.5, 1.5, 1.5)
    @bottle.position.z = -1.5
    @camera.add(@bottle)

    bar = new Sim.Bar()
    @scene.add(bar)

    for child in bar.children
      name = child.name.split('.')[0]
      if child.name.split('.')[0] in ['guest', 'bartender']
        child.position.y -= 2 # I should remove these
        options = {
          type:if name == 'guest' then 'party' else 'bartender'
        }
        if name == 'bartender'
          options.gender = 'male'
        person = new Sim.Person(options)
        if name == 'guest'
          person.rotation.y = Math.random() * Math.PI * 2
        person.position.set(child.position.x, 0, child.position.z)
        @scene.add(person)
        person.play('idle')

    @particles = {}

    @addLiquidParticle()

  addLiquidParticle: ->
    vector = new THREE.Vector3(0, 0.2, -0.05)
    p = @bottle.localToWorld(vector)
    particle = new Sim.LiquidParticle()
    particle.position.set(p.x, p.y, p.z)
    particle.scale.set(1.5, 3,1)
    @particles[particle.uuid] = particle
    @scene.add(particle)

  start: ->
    @startTime = Date.now()
    @timeSinceLastParticle = 0

  tick: (delta)->
    @timeSinceLastParticle += delta

    if @cameraDirection
      rot = @cameraDirection.y
      if rot > -0.7 and rot <= 0
        @bottle.rotation.x = rot * 2.5
        if rot < 0
          @bottle.rotation.z = -rot

      if rot < -0.4
        if @timeSinceLastParticle > 100
          @timeSinceLastParticle = 0
          @addLiquidParticle()

    for _, particle of @particles
      particle.position.y -= 0.001 * delta
      if particle.position.y < 0
        @scene.remove(particle)
        delete @particles[particle.uuid]
