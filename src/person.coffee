class Sim.Person extends THREE.Object3D
  TEXTURES =
    FEMALE:
      regular: [
        'f_pony_pinstripe.jpg'
        'f_pony_short.jpg'
        'f_pony_athletic.jpg'
        'f_pony_athletic_2.jpg'
        'f_longdress_1.jpg'
        'f_longdress_2.jpg'
        'f_longdress_3.jpg'
      ]
      party: [
        'f_longdress_1.jpg'
        'f_longdress_2.jpg'
        'f_longdress_3.jpg'
      ]
      athletic: [
        'f_pony_athletic.jpg'
        'f_pony_athletic_2.jpg'
      ]
      midsummer: [
        'f_dress_midsummer.jpg'
      ]
    MALE:
      regular: [
        'm_dude_1.jpg'
        'm_dude_2.jpg'
        'm_dude_3.jpg'
        'm_dude_stureplan.jpg'
        'm_dude_stureplan_brun.jpg'
      ]
      athletic: [
        'm_dude_3.jpg'
      ]
      bartender: [
        'm_dude_bartender.jpg'
      ]
      party: [
        'm_dude_2.jpg'
        'm_dude_3.jpg'
        'm_dude_stureplan.jpg'
        'm_dude_stureplan_brun.jpg'
      ]
      midsummer: [
        'm_dude_stureplan.jpg'
      ]

  constructor: (options = {}) ->
    super
    if options.gender == 'male' or (!options.gender? && Math.random() > 0.5)
      gender = 'MALE'
    else
      gender = 'FEMALE'

    type = options.type or 'regular'
    texture_name = TEXTURES[gender][type][Math.floor(Math.random() * TEXTURES[gender][type].length)]
    model_name = texture_name.split('_')[1]
    model = Sim.MODELS["#{gender.toLowerCase()}_#{model_name}"]
    material = model.materials[0].clone()
    material.skinning = true
    material.side = THREE.DoubleSide
    material.shading = THREE.NoShading
    geometry = model.geometry
    t = THREE.ImageUtils.loadTexture 'assets/person_textures/' + texture_name
    material.map = t
    @mesh = new THREE.SkinnedMesh(geometry, material)

    @add(@mesh)
    @scale.set(1.5, 1.5, 1.5)

  play: (animation) ->
    @animationName = animation
    @animation = new THREE.Animation(@mesh, Person.ANIMATIONS[@animationName])
    @animation.timeScale = 0.001
    @animation.offset = Math.random()
    @animation.play()

$ ->
  $.get 'assets/animations.json', (animations) =>
    Sim.Person.ANIMATIONS = animations
