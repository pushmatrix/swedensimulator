class Sim.WaitGame extends Sim.StreetGame
  WALKSPEED = 0
  setupCamera: ->
    super

    @camera.position.set(9.5, 2.5, 0)

  constructor: ->
    super
    for road, i in @roads
      road.position.z = 180 * 3 - road.size.z * i * 0.999
      road.position.y -= 0.2
      @scene.add(road)

    for i in [-5..10]
      continue if i == 0
      pedestrian = new Sim.Pedestrian
      @scene.add(pedestrian)
      pedestrian.rotation.y = Math.PI
      if i < 5
        pedestrian.rotation.y = Math.PI
        pedestrian.position.x = @camera.position.x - 0.5
      else
        angle = (i - 5) / Math.PI * 0.5
        pedestrian.position.x =  @camera.position.x + Math.sin(angle) * 5
        pedestrian.rotation.y = Math.PI - angle

      pedestrian.position.z = -i * 2
      pedestrian.play('idle')


    texture = THREE.ImageUtils.loadTexture( "assets/systembolaget.png" )
    material = new THREE.MeshLambertMaterial({ map : texture, transparent: true })
    sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    sign.position.set(11.5, 5, -17)
    sign.scale.x = 1.5
    @scene.add(sign)


  start: ->

  tick: ->
