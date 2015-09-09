MODEL_PATH_LIST = ["bar.scene.json","bottle.json","city.scene.json","country.scene.json","female_dress.json","female_longdress.json","female_pony.json","male_dude.json","midsummer.scene.json","road.json","stroller.json"];
var Sim,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

window.ASSETS_LOADING = 0;

THREE.Utils = {
  cameraLookDir: function(camera) {
    var vector;
    vector = new THREE.Vector3(0, 0, -1);
    vector.applyEuler(camera.rotation, camera.rotation.order);
    return vector;
  }
};

Array.prototype.remove = function(e) {
  var ref, t;
  if ((t = this.indexOf(e)) > -1) {
    return ([].splice.apply(this, [t, t - t + 1].concat(ref = [])), ref);
  }
};

Array.prototype.randomize = function() {
  return this[Math.floor(Math.random() * this.length)];
};

Sim = (function() {
  function Sim() {}

  Sim.createRenderer = function() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xf0f0f0);
    this.container.appendChild(this.renderer.domElement);
    if (false) {
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.top = '0px';
      this.container.appendChild(this.stats.domElement);
    }
    return window.addEventListener('resize', (function(_this) {
      return function() {
        if (!_this.currentGame) {
          return;
        }
        _this.currentGame.camera.aspect = window.innerWidth / window.innerHeight;
        _this.renderer.setSize(window.innerWidth, window.innerHeight);
        return _this.currentGame.camera.updateProjectionMatrix();
      };
    })(this));
  };

  Sim.init = function(callback) {
    this.clock = new THREE.Clock();
    this.createRenderer();
    this.vrEffect = new THREE.VREffect(this.renderer);
    this.vrEffect.setSize(window.innerWidth, window.innerHeight);
    this.vrManager = new WebVRManager(this.renderer, this.vrEffect, {
      hideButton: false
    });
    Sim.loadGame('LoadingScreen');
    this.render();
    return this.loadAssets((function(_this) {
      return function() {
        _this.currentGame.loaded();
        return typeof callback === "function" ? callback() : void 0;
      };
    })(this));
  };

  Sim.render = function() {
    var delta, ref;
    requestAnimationFrame(Sim.render);
    if (!Sim.currentGame) {
      return;
    }
    delta = Sim.clock.getDelta() * 1000;
    Sim.currentGame.controls.update();
    Sim.currentGame.tick(delta);
    Sim.currentGame.placeMenuButton();
    Sim.currentGame.checkForButtonPress();
    THREE.AnimationHandler.update(delta);
    Sim.vrManager.render(Sim.currentGame.scene, Sim.currentGame.camera, delta);
    return (ref = Sim.stats) != null ? ref.update() : void 0;
  };

  Sim.loadAssets = function(callback) {
    var i, len, path, results;
    results = [];
    for (i = 0, len = MODEL_PATH_LIST.length; i < len; i++) {
      path = MODEL_PATH_LIST[i];
      results.push(Sim.loadModel(path, function() {
        if (ASSETS_LOADING === 0) {
          return typeof callback === "function" ? callback() : void 0;
        }
      }));
    }
    return results;
  };

  Sim.loadGame = function(game) {
    this.currentGame = new Sim[game];
    return this.currentGame.start();
  };

  return Sim;

})();

Sim.Game = (function() {
  Game.prototype.setupCamera = function() {
    var aspect, far, fov, near;
    fov = 50;
    aspect = window.innerWidth / window.innerHeight;
    near = 1;
    far = 100000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.y = 2.5;
    return this.scene.add(this.camera);
  };

  Game.prototype.setupControls = function() {
    return this.controls = new THREE.VRControls(this.camera);
  };

  Game.prototype.load = function() {
    if (ASSETS_LOADING > 0) {
      return requestAnimationFrame(this.load);
    } else {
      return console.log('Starting Game');
    }
  };

  Game.prototype.start = function() {};

  Game.prototype.tick = function() {
    throw new Error("Subclasses should implement tick");
  };

  function Game() {
    this.load = bind(this.load, this);
    this._buttons = [];
    this.started = false;
    this.scene = new THREE.Scene;
    this.setupCamera();
    this.setupControls();
    this.raycaster = new THREE.Raycaster();
    this.placeMenuButton();
  }

  Game.prototype.addButton = function(path, callback) {
    var button;
    button = new Button(path, callback);
    this._buttons.push(button);
    this.scene.add(button);
    return button;
  };

  Game.prototype.checkForButtonPress = function() {
    var delta, intersect, ref, ref1, scale;
    this.cameraDirection = THREE.Utils.cameraLookDir(this.camera);
    this.raycaster.set(this.camera.position, this.cameraDirection);
    intersect = this.raycaster.intersectObjects(this._buttons, true)[0];
    if (intersect) {
      if (intersect.object.uuid !== ((ref = this.currentFocus) != null ? ref.object.uuid : void 0)) {
        this.hoveredButton = intersect.object.parent;
        this.currentFocus = intersect;
        this.hoverStartAt = new Date();
      }
      delta = new Date() - this.hoverStartAt;
      scale = (1 - delta / 1500) * 0.25 + 0.75;
      this.hoveredButton.scale.x = scale;
      this.hoveredButton.scale.y = scale;
      this.hoveredButton.scale.z = scale;
      if (delta > 1500) {
        this.currentFocus = null;
        return this.hoveredButton.press();
      }
    } else {
      if ((ref1 = this.hoveredButton) != null) {
        ref1.scale.set(1, 1, 1);
      }
      this.hoveredButton = null;
      return this.currentFocus = null;
    }
  };

  Game.prototype.placeMenuButton = function() {
    this.menuButton || (this.menuButton = this.addButton("menu.png", function() {
      return Sim.loadGame('Menu');
    }));
    this.menuButton.position.z = this.camera.position.z;
    this.menuButton.position.x = this.camera.position.x;
    this.menuButton.position.y = 1;
    return this.menuButton.rotation.x = -Math.PI * 0.5;
  };

  Game.prototype.start = function() {
    if (this.started) {
      return;
    }
    console.log("Starting game...");
    return this.started = true;
  };

  return Game;

})();

$(function() {
  Sim.init((function(_this) {
    return function() {};
  })(this));
  return console.log("Loading " + window.ASSETS_LOADING + " assets...");
});

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Sim.LoadingScreen = (function(superClass) {
  extend(LoadingScreen, superClass);

  function LoadingScreen() {
    var gridHelper, hemiLight, size, step;
    LoadingScreen.__super__.constructor.apply(this, arguments);
    Sim.renderer.setClearColor(0);
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 500, 0);
    this.scene.add(hemiLight);
    this.createTexts('Loading...');
    this.scene.add(this.container);
    size = 10;
    step = 1;
    gridHelper = new THREE.GridHelper(size, step);
    gridHelper.position.y = -1;
    this.scene.add(gridHelper);
  }

  LoadingScreen.prototype.createTexts = function(text) {
    var i, j, material, textGeom, textMesh, textWidth, textWrapper;
    if (this.container != null) {
      this.scene.remove(this.container);
    }
    this.container = new THREE.Object3D;
    material = new THREE.MeshPhongMaterial({
      color: 0xdddddd
    });
    textGeom = new THREE.TextGeometry(text, {
      font: 'helvetiker',
      size: 0.1,
      height: 0.05
    });
    for (i = j = 0; j <= 3; i = ++j) {
      textMesh = new THREE.Mesh(textGeom, material);
      textGeom.computeBoundingBox();
      textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
      textWrapper = new THREE.Object3D;
      textMesh.position.set(-0.5 * textWidth, 0, -1.5);
      textWrapper.add(textMesh);
      textWrapper.rotation.y = i / 4 * Math.PI * 2;
      textWrapper.position.y = this.camera.position.y;
      this.container.add(textWrapper);
    }
    return this.scene.add(this.container);
  };

  LoadingScreen.prototype.loaded = function() {
    this.loaded = true;
    Sim.renderer.setClearColor(0xf0f0f0);
    return this.createTexts('Look down!');
  };

  LoadingScreen.prototype.placeMenuButton = function() {
    LoadingScreen.__super__.placeMenuButton.apply(this, arguments);
    return this.menuButton.position.x = this.loaded ? 0 : -1000000;
  };

  LoadingScreen.prototype.tick = function() {};

  return LoadingScreen;

})(Sim.Game);

var Button,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Button = (function(superClass) {
  extend(Button, superClass);

  function Button(texture, onPress) {
    var material, plane;
    this.onPress = onPress;
    Button.__super__.constructor.apply(this, arguments);
    texture = THREE.ImageUtils.loadTexture("assets/" + texture);
    material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true
    });
    material.side = THREE.DoubleSide;
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.add(plane);
  }

  Button.prototype.press = function() {
    return this.onPress();
  };

  return Button;

})(THREE.Object3D);

Sim.Menu = (function(superClass) {
  var GAMES;

  extend(Menu, superClass);

  GAMES = ['StreetGame', 'WaitGame', 'VaskaGame', 'MidsummerGame'];

  function Menu() {
    var fn, game, hemiLight, i, j, len, map, material, sprite;
    Menu.__super__.constructor.apply(this, arguments);
    this.scene.remove(this.menuButton);
    this.loadSkybox();
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.position.set(0, 500, 0);
    this.scene.add(hemiLight);
    map = THREE.ImageUtils.loadTexture("assets/crosshair.png");
    material = new THREE.SpriteMaterial({
      map: map,
      color: 0xffffff,
      fog: true
    });
    material.depthTest = false;
    sprite = new THREE.Sprite(material);
    sprite.scale.set(0.05, 0.05, 0.05);
    sprite.position.z = -4;
    this.camera.add(sprite);
    fn = (function(_this) {
      return function(game, i) {
        var angle, button, radius;
        angle = (i * 35) * Math.PI / 180;
        radius = 3;
        button = _this.addButton(game + ".png", function() {
          return Sim.loadGame(game);
        });
        button.position.z = radius * -Math.cos(angle);
        button.position.y = _this.camera.position.y;
        button.position.x = Math.sin(angle) * radius;
        return button.rotation.y = -angle;
      };
    })(this);
    for (i = j = 0, len = GAMES.length; j < len; i = ++j) {
      game = GAMES[i];
      fn(game, i);
    }
    setTimeout((function(_this) {
      return function() {
        return _this.start();
      };
    })(this), 0);
  }

  Menu.prototype.loadSkybox = function() {
    var direction, directions, imagePrefix, imageSuffix, j, len, materialArray, skyBox, skyGeometry, skyMaterial;
    imagePrefix = 'assets/skybox/berget/';
    directions = ["posx", "negx", "posy", "negy", "posz", "negz"];
    imageSuffix = ".jpg";
    skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);
    materialArray = [];
    for (j = 0, len = directions.length; j < len; j++) {
      direction = directions[j];
      materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(imagePrefix + direction + imageSuffix),
        side: THREE.BackSide
      }));
    }
    skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    skyBox.rotation.y = -Math.PI * 0.5;
    return this.scene.add(skyBox);
  };

  Menu.prototype.stage = function() {};

  Menu.prototype.tick = function() {};

  return Menu;

})(Sim.Game);

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Sim.Landscape = (function(superClass) {
  extend(Landscape, superClass);

  function Landscape() {
    var child, map, model_scene;
    Landscape.__super__.constructor.apply(this, arguments);
    model_scene = Sim.MODELS['midsummer'].scene.clone();
    while (model_scene.children.length > 0) {
      child = model_scene.children[0];
      if (child.material) {
        if (child.name === 'grass') {
          map = child.material.map;
          map.wrapS = THREE.RepeatWrapping;
          map.wrapT = THREE.RepeatWrapping;
          map.repeat.set(6, 6);
        }
        child.material.side = THREE.DoubleSide;
      }
      this.add(child);
    }
    this.size = {
      z: 38.65
    };
  }

  return Landscape;

})(THREE.Object3D);

Sim.MidsummerGame = (function(superClass) {
  var PEOPLE_COUNT, WALKSPEED;

  extend(MidsummerGame, superClass);

  WALKSPEED = 0;

  PEOPLE_COUNT = 5;

  function MidsummerGame() {
    var angle, hemiLight, i, j, light, person, radius, ref;
    MidsummerGame.__super__.constructor.apply(this, arguments);
    this.camera.position.set(0, 2.5, -2.2);
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.groundColor.setHSL(1, 1, 1);
    hemiLight.position.set(0, 500, 0);
    this.scene.add(hemiLight);
    light = new THREE.PointLight(0xffffff, 1.5, 100);
    light.position.set(-10, 10, 10);
    this.scene.add(light);
    this.landscape = new Sim.Landscape();
    this.maypole = this.landscape.getObjectByName('maypole');
    this.scene.add(new Sim.Landscape());
    this.loadSkybox();
    this.angle = 0;
    this.danceCircle = new THREE.Object3D;
    radius = 3;
    for (i = j = 1, ref = PEOPLE_COUNT - 1; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
      person = new Sim.Person({
        type: 'midsummer',
        gender: i % 2 ? 'male' : 'female'
      });
      angle = 2 * Math.PI / PEOPLE_COUNT * i;
      person.position.x = Math.cos(angle) * 3;
      person.position.z = Math.sin(angle) * 3;
      person.rotation.y = Math.atan2(-person.position.z, person.position.x);
      person.play('prance');
      this.danceCircle.add(person);
    }
    this.danceCircle.position.set(this.maypole.position.x, 0, this.maypole.position.z);
    this.scene.add(this.danceCircle);
  }

  MidsummerGame.prototype.loadSkybox = function() {
    var direction, directions, imagePrefix, imageSuffix, j, len, materialArray, skyBox, skyGeometry, skyMaterial;
    imagePrefix = 'assets/skybox/';
    directions = ["posx", "negx", "posy", "negy", "posz", "negz"];
    imageSuffix = ".jpg";
    skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);
    materialArray = [];
    for (j = 0, len = directions.length; j < len; j++) {
      direction = directions[j];
      materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(imagePrefix + direction + imageSuffix),
        side: THREE.BackSide
      }));
    }
    skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    skyBox.rotation.y = -Math.PI * 0.5;
    return this.scene.add(skyBox);
  };

  MidsummerGame.prototype.tick = function(delta) {
    this.angle -= 0.0006 * delta;
    this.danceCircle.rotation.y = this.angle;
    this.camera.position.x = Math.cos(+this.angle) * 4 + this.maypole.position.x;
    return this.camera.position.z = Math.sin(-this.angle) * 4 + this.maypole.position.z;
  };

  return MidsummerGame;

})(Sim.Game);

var ASSET_PREFIX;

Sim.ObjectLoader = new THREE.ObjectLoader();

Sim.JSONLoader = new THREE.JSONLoader();

ASSET_PREFIX = '/assets/';

Sim.MODELS = {};

Sim.loadModel = function(model_path, callback) {
  var model_name;
  model_name = model_path.split('.')[0];
  if (Sim.MODELS[model_name]) {
    return;
  }
  Sim.MODELS[model_name] = {};
  window.ASSETS_LOADING += 1;
  return setTimeout((function(_this) {
    return function() {
      if (~model_path.indexOf('.scene.')) {
        return Sim.ObjectLoader.load(ASSET_PREFIX + model_path, function(scene) {
          Sim.MODELS[model_name] = {
            scene: scene
          };
          window.ASSETS_LOADING -= 1;
          return typeof callback === "function" ? callback() : void 0;
        });
      } else {
        return Sim.JSONLoader.load(ASSET_PREFIX + model_path, function(geometry, materials) {
          Sim.MODELS[model_name] = {
            geometry: geometry,
            materials: materials
          };
          window.ASSETS_LOADING -= 1;
          return typeof callback === "function" ? callback() : void 0;
        });
      }
    };
  })(this), 0);
};

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Sim.Person = (function(superClass) {
  var TEXTURES;

  extend(Person, superClass);

  TEXTURES = {
    FEMALE: {
      regular: ['f_pony_pinstripe.jpg', 'f_pony_short.jpg', 'f_pony_athletic.jpg', 'f_pony_athletic_2.jpg', 'f_longdress_1.jpg', 'f_longdress_2.jpg', 'f_longdress_3.jpg'],
      party: ['f_longdress_1.jpg', 'f_longdress_2.jpg', 'f_longdress_3.jpg'],
      athletic: ['f_pony_athletic.jpg', 'f_pony_athletic_2.jpg'],
      midsummer: ['f_dress_midsummer.jpg']
    },
    MALE: {
      regular: ['m_dude_1.jpg', 'm_dude_2.jpg', 'm_dude_3.jpg', 'm_dude_stureplan.jpg', 'm_dude_stureplan_brun.jpg'],
      athletic: ['m_dude_3.jpg'],
      bartender: ['m_dude_bartender.jpg'],
      party: ['m_dude_2.jpg', 'm_dude_3.jpg', 'm_dude_stureplan.jpg', 'm_dude_stureplan_brun.jpg'],
      midsummer: ['m_dude_stureplan.jpg']
    }
  };

  function Person(options) {
    var gender, geometry, material, model, model_name, t, texture_name, type;
    if (options == null) {
      options = {};
    }
    Person.__super__.constructor.apply(this, arguments);
    if (options.gender === 'male' || ((options.gender == null) && Math.random() > 0.5)) {
      gender = 'MALE';
    } else {
      gender = 'FEMALE';
    }
    type = options.type || 'regular';
    texture_name = TEXTURES[gender][type][Math.floor(Math.random() * TEXTURES[gender][type].length)];
    model_name = texture_name.split('_')[1];
    model = Sim.MODELS[(gender.toLowerCase()) + "_" + model_name];
    material = model.materials[0].clone();
    material.skinning = true;
    material.side = THREE.DoubleSide;
    material.shading = THREE.NoShading;
    geometry = model.geometry;
    t = THREE.ImageUtils.loadTexture('assets/person_textures/' + texture_name);
    material.map = t;
    this.mesh = new THREE.SkinnedMesh(geometry, material);
    this.add(this.mesh);
    this.scale.set(1.5, 1.5, 1.5);
  }

  Person.prototype.play = function(animation) {
    this.animationName = animation;
    this.animation = new THREE.Animation(this.mesh, Person.ANIMATIONS[this.animationName]);
    this.animation.timeScale = 0.001;
    this.animation.offset = Math.random();
    return this.animation.play();
  };

  return Person;

})(THREE.Object3D);

$(function() {
  return $.get('assets/animations.json', (function(_this) {
    return function(animations) {
      return Sim.Person.ANIMATIONS = animations;
    };
  })(this));
});

var MAX_Z, MIN_Z,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

MIN_Z = -350;

MAX_Z = 100;

Sim.Pedestrian = (function(superClass) {
  var WALKSPEED;

  extend(Pedestrian, superClass);

  function Pedestrian() {
    return Pedestrian.__super__.constructor.apply(this, arguments);
  }

  WALKSPEED = 0.006;

  Pedestrian.prototype.walk = function(delta) {
    return this.position.z += WALKSPEED * delta;
  };

  return Pedestrian;

})(Sim.Person);

Sim.Road = (function(superClass) {
  extend(Road, superClass);

  function Road() {
    var child, model_scene;
    Road.__super__.constructor.apply(this, arguments);
    model_scene = Sim.MODELS['city'].scene.clone();
    while (model_scene.children.length > 0) {
      child = model_scene.children[0];
      if (child.material) {
        child.material.side = THREE.DoubleSide;
      }
      this.add(child);
    }
    this.size = {
      z: 180
    };
  }

  return Road;

})(THREE.Object3D);

Sim.StreetGame = (function(superClass) {
  var PERSON_RATE, WALKSPEED;

  extend(StreetGame, superClass);

  WALKSPEED = 0.005;

  PERSON_RATE = 5000;

  StreetGame.prototype.setupCamera = function() {
    StreetGame.__super__.setupCamera.apply(this, arguments);
    return this.camera.position.set(10, 2.5, -2);
  };

  function StreetGame() {
    var dirLight, hemiLight, i, j, road;
    StreetGame.__super__.constructor.apply(this, arguments);
    this.timeSinceLastPerson = 0;
    hemiLight = new THREE.HemisphereLight(0x4D4D4D, 0x4D4D4D, 2.3);
    hemiLight.position.set(0, 500, 0);
    this.scene.add(hemiLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 0.95);
    dirLight.position.multiplyScalar(50);
    this.scene.add(dirLight);
    this.loadSkybox();
    this.roads = [];
    for (i = j = 0; j <= 7; i = ++j) {
      road = new Sim.Road();
      road.position.z = 22 * 3 - road.size.z * i;
      road.position.y -= 0.2;
      this.scene.add(road);
      this.roads.push(road);
    }
    this.pedestrians = {};
  }

  StreetGame.prototype.start = function() {
    var i, j, k, len, material, pedestrian, ref, strollerModel;
    for (i = j = 0; j <= 3; i = ++j) {
      pedestrian = this.createPedestrian();
      pedestrian.position.z = -30 * i;
    }
    strollerModel = Sim.MODELS['stroller'];
    ref = strollerModel.materials;
    for (k = 0, len = ref.length; k < len; k++) {
      material = ref[k];
      material.side = THREE.DoubleSide;
    }
    this.stroller = new THREE.Mesh(strollerModel.geometry, new THREE.MeshFaceMaterial(strollerModel.materials));
    this.stroller.scale.set(0.6, 0.6, 0.6);
    this.stroller.position.x = this.camera.position.x - 0.2;
    this.stroller.position.z = -3.2;
    this.stroller.position.y = 0;
    this.stroller.rotation.y = Math.PI;
    return this.scene.add(this.stroller);
  };

  StreetGame.prototype.loadSkybox = function() {
    var direction, directions, imagePrefix, imageSuffix, j, len, materialArray, skyBox, skyGeometry, skyMaterial;
    imagePrefix = 'assets/skybox/city/';
    directions = ["posz", "posz", "posy", "posz", "posz", "negz"];
    imageSuffix = ".jpg";
    skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);
    materialArray = [];
    for (j = 0, len = directions.length; j < len; j++) {
      direction = directions[j];
      materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(imagePrefix + direction + imageSuffix),
        side: THREE.BackSide
      }));
    }
    skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    return this.scene.add(skyBox);
  };

  StreetGame.prototype.createPedestrian = function() {
    var animation, pedestrian, type;
    if (Math.random() > 0.8) {
      type = 'athletic';
      animation = 'jogging';
    } else {
      type = 'regular';
      animation = 'walking';
    }
    pedestrian = new Sim.Pedestrian({
      type: type
    });
    pedestrian.position.z = -100;
    pedestrian.position.x = [8.5, 11.5].randomize();
    this.pedestrians[pedestrian.uuid] = pedestrian;
    pedestrian.play(animation);
    this.scene.add(pedestrian);
    return pedestrian;
  };

  StreetGame.prototype.tick = function(delta) {
    var id, j, k, len, len1, pedestrian, ref, ref1, ref2, results, road;
    this.timeSinceLastPerson += delta;
    if (this.timeSinceLastPerson > PERSON_RATE) {
      this.createPedestrian();
      this.timeSinceLastPerson = 0;
    }
    ref = this.roads;
    for (j = 0, len = ref.length; j < len; j++) {
      road = ref[j];
      road.position.z += WALKSPEED * delta;
    }
    if (this.roads[0].position.z > this.roads[0].size.z * 2) {
      ref1 = this.roads;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        road = ref1[k];
        road.position.z -= this.roads[0].size.z;
      }
    }
    ref2 = this.pedestrians;
    results = [];
    for (id in ref2) {
      pedestrian = ref2[id];
      pedestrian.walk(delta);
      if (pedestrian.position.z > 40) {
        this.scene.remove(pedestrian);
        results.push(delete this.pedestrians[pedestrian.uuid]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return StreetGame;

})(Sim.Game);

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Sim.Bar = (function(superClass) {
  extend(Bar, superClass);

  function Bar() {
    var child, model_scene;
    Bar.__super__.constructor.apply(this, arguments);
    model_scene = Sim.MODELS['bar'].scene.clone();
    while (model_scene.children.length > 0) {
      child = model_scene.children[0];
      if (child.material) {
        child.material.side = THREE.DoubleSide;
      }
      this.add(child);
    }
    this.size = {
      z: 38.65
    };
  }

  return Bar;

})(THREE.Object3D);

Sim.LiquidParticle = (function(superClass) {
  extend(LiquidParticle, superClass);

  function LiquidParticle() {
    var map, material, sprite;
    LiquidParticle.__super__.constructor.apply(this, arguments);
    map = THREE.ImageUtils.loadTexture("assets/liquid.png");
    material = new THREE.SpriteMaterial({
      map: map,
      color: 0xffffff,
      fog: true
    });
    sprite = new THREE.Sprite(material);
    sprite.scale.set(0.05, 0.05, 0.05);
    this.add(sprite);
  }

  return LiquidParticle;

})(THREE.Object3D);

Sim.VaskaGame = (function(superClass) {
  var WALKSPEED;

  extend(VaskaGame, superClass);

  WALKSPEED = 0;

  VaskaGame.prototype.setupCamera = function() {
    VaskaGame.__super__.setupCamera.apply(this, arguments);
    this.camera.position.z = -2.2;
    return this.camera.position.y = 2.5;
  };

  function VaskaGame() {
    var bar, bottleModel, child, hemiLight, i, len, light, name, options, person, ref, ref1;
    VaskaGame.__super__.constructor.apply(this, arguments);
    hemiLight = new THREE.HemisphereLight(0xFF80B2, 0xFF80B2, 1.19);
    hemiLight.position.set(0, 500, 500);
    this.scene.add(hemiLight);
    light = new THREE.PointLight(0xffffff, 2, 5);
    light.position.set(0, 0, 0);
    this.scene.add(light);
    bottleModel = Sim.MODELS['bottle'];
    this.bottle = new THREE.Mesh(bottleModel.geometry, bottleModel.materials[0]);
    this.bottle.scale.set(1.5, 1.5, 1.5);
    this.bottle.position.z = -1.5;
    this.camera.add(this.bottle);
    bar = new Sim.Bar();
    this.scene.add(bar);
    ref = bar.children;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      name = child.name.split('.')[0];
      if ((ref1 = child.name.split('.')[0]) === 'guest' || ref1 === 'bartender') {
        child.position.y -= 2;
        options = {
          type: name === 'guest' ? 'party' : 'bartender'
        };
        if (name === 'bartender') {
          options.gender = 'male';
        }
        person = new Sim.Person(options);
        if (name === 'guest') {
          person.rotation.y = Math.random() * Math.PI * 2;
        }
        person.position.set(child.position.x, 0, child.position.z);
        this.scene.add(person);
        person.play('idle');
      }
    }
    this.particles = {};
    this.addLiquidParticle();
  }

  VaskaGame.prototype.addLiquidParticle = function() {
    var p, particle, vector;
    vector = new THREE.Vector3(0, 0.2, -0.05);
    p = this.bottle.localToWorld(vector);
    particle = new Sim.LiquidParticle();
    particle.position.set(p.x, p.y, p.z);
    particle.scale.set(1.5, 3, 1);
    this.particles[particle.uuid] = particle;
    return this.scene.add(particle);
  };

  VaskaGame.prototype.start = function() {
    this.startTime = Date.now();
    return this.timeSinceLastParticle = 0;
  };

  VaskaGame.prototype.tick = function(delta) {
    var _, particle, ref, results, rot;
    this.timeSinceLastParticle += delta;
    if (this.cameraDirection) {
      rot = this.cameraDirection.y;
      if (rot > -0.7 && rot <= 0) {
        this.bottle.rotation.x = rot * 2.5;
        if (rot < 0) {
          this.bottle.rotation.z = -rot;
        }
      }
      if (rot < -0.4) {
        if (this.timeSinceLastParticle > 100) {
          this.timeSinceLastParticle = 0;
          this.addLiquidParticle();
        }
      }
    }
    ref = this.particles;
    results = [];
    for (_ in ref) {
      particle = ref[_];
      particle.position.y -= 0.001 * delta;
      if (particle.position.y < 0) {
        this.scene.remove(particle);
        results.push(delete this.particles[particle.uuid]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return VaskaGame;

})(Sim.Game);

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Sim.WaitGame = (function(superClass) {
  var WALKSPEED;

  extend(WaitGame, superClass);

  WALKSPEED = 0;

  WaitGame.prototype.setupCamera = function() {
    WaitGame.__super__.setupCamera.apply(this, arguments);
    return this.camera.position.set(9.5, 2.5, 0);
  };

  function WaitGame() {
    var angle, i, j, k, len, material, pedestrian, ref, road, sign, texture;
    WaitGame.__super__.constructor.apply(this, arguments);
    ref = this.roads;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      road = ref[i];
      road.position.z = 180 * 3 - road.size.z * i * 0.999;
      road.position.y -= 0.2;
      this.scene.add(road);
    }
    for (i = k = -5; k <= 10; i = ++k) {
      if (i === 0) {
        continue;
      }
      pedestrian = new Sim.Pedestrian;
      this.scene.add(pedestrian);
      pedestrian.rotation.y = Math.PI;
      if (i < 5) {
        pedestrian.rotation.y = Math.PI;
        pedestrian.position.x = this.camera.position.x - 0.5;
      } else {
        angle = (i - 5) / Math.PI * 0.5;
        pedestrian.position.x = this.camera.position.x + Math.sin(angle) * 5;
        pedestrian.rotation.y = Math.PI - angle;
      }
      pedestrian.position.z = -i * 2;
      pedestrian.play('idle');
    }
    texture = THREE.ImageUtils.loadTexture("assets/systembolaget.png");
    material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true
    });
    sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    sign.position.set(11.5, 5, -17);
    sign.scale.x = 1.5;
    this.scene.add(sign);
  }

  WaitGame.prototype.start = function() {};

  WaitGame.prototype.tick = function() {};

  return WaitGame;

})(Sim.StreetGame);
