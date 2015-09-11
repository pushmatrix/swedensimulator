class Sim.WinterGame extends Sim.Game
  WALKSPEED = 0
  setupCamera: ->
    super

    @camera.position.set(9.5, 2.5, 0)

  constructor: ->
    super

    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1)
    # hemiLight.color.setHSL(0.6, 1, 0.6)
    # hemiLight.groundColor.setHSL(1,1,1)
    hemiLight.position.set(0, 500, 0)
    @scene.add(hemiLight)

    Sim.renderer.setClearColor(0)

  start: ->

  tick: ->
