Sim.ObjectLoader = new THREE.ObjectLoader()

Sim.JSONLoader =new THREE.JSONLoader()

ASSET_PREFIX = '/assets/'

Sim.MODELS = {}

Sim.loadModel = (model_path, callback) ->
  model_name = model_path.split('.')[0]
  return if Sim.MODELS[model_name]

  Sim.MODELS[model_name] = {}

  window.ASSETS_LOADING += 1
  setTimeout =>

    if (~model_path.indexOf '.scene.')
      Sim.ObjectLoader.load ASSET_PREFIX + model_path, (scene) =>
        Sim.MODELS[model_name] = {
          scene: scene
        }
        window.ASSETS_LOADING -= 1
        callback?()
    else
      Sim.JSONLoader.load ASSET_PREFIX + model_path, (geometry, materials) =>
        Sim.MODELS[model_name] = {
          geometry: geometry,
          materials: materials
        }
        window.ASSETS_LOADING -= 1
        callback?()
  , 0
