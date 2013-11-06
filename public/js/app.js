requirejs.config({
  baseUrl: 'js',
  paths: {
    'vendor': '../vendor',
    'underscore': '../vendor/underscore',
    'jquery': '../vendor/jquery',
    'underscore.deep': '../vendor/underscore.deep',
    'three': '../vendor/three',
    'client': '../client',
    'socketio': '../socket.io/socket.io',
    'client': '../client'
  },
  shim: {
    'underscore': {
    	deps: ['underscore.deep'],
      init: function(definition) {
      	_.mixin(definition);
      },
      exports: '_'
    },
    'three/Three': {
      exports: 'THREE', 
    },
    'three/Detector': {
      deps: ['three/Three'],
      exports: 'Detector'
    },
    'vendor/cannon': {
      exports: 'CANNON'
    },
    'vendor/KeyboardState': {
      exports: 'THREEx' 
    },
    'socketio': {
      exports: 'io'
    },
    'services/interface': {
      exports: 'Interface' 
    },
    'services/input': {
      exports: 'Input'
    },
    'services/network': {
      exports: 'Network' 
    },
    'services/physics': {
      exports: 'Physics'
    }
  }
});

requirejs(['game', 'services/interface'], function(Game, Interface) {
  Game
  .init({
    canvas: '#amoeba',
    width: window.innerWidth,
    height: window.innerHeight,
    debug: true
  })
  .definePrefab("PlayerCamera", function() {
  	var camera = new Entity.Camera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    var follow = new Follow();
    follow.offset = new THREE.Vector3(0, 200, -1);

    var control = new Controller({
      'forward': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.z = 200;
      },
      'back': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.z = -200;
      },
      'left': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.x = 200;
      },
      'right': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.x = -200;
      },
      'query': function() {
        this.getComponent("follow").offset.add(new THREE.Vector3(0, 50, 0));
      },
      'use': function() {
        this.getComponent("follow").offset.add(new THREE.Vector3(0, -50, 0));
      }
    });
    camera.addComponent(control);
    camera.addComponent(follow);
    return camera;
  })
	.definePrefab("Ground", function() {
		var geometry = new THREE.PlaneGeometry(1000, 1000, 20, 20)
      , material = new THREE.MeshNormalMaterial()
      , plane = new CANNON.Plane();

    var ground = new Entity.Mesh("Ground", geometry, material);
    var rigidbody = new Rigidbody(0, plane);
    rigidbody._body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );

    ground.addComponent(rigidbody);
    return ground;
	})
	.defineScene("Intro", function() {
		Interface.to("Login");
    
    var camera = Game.createPrefab("PlayerCamera");
    Game.addEntity(camera);
	})
  .run("Intro");
});
