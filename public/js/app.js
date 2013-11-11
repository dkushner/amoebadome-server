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

var deps = [
  'game',
  'entity',
  'component',
  'services/interface',
  'services/physics',
  'vendor/EventEmitter',
  'underscore'
];

requirejs(deps, function(Game, Entity, Component, Interface, Physics, EventEmitter, _) {
  Game.init({
    canvas: '#amoeba',
    width: window.innerWidth,
    height: window.innerHeight,
    debug: true
  });

  /**
   * Prefab definitions.
   */
  var physMaterial = new CANNON.Material("GroundMaterial");
  var contactMaterial = new CANNON.ContactMaterial(
    physMaterial,
    physMaterial,
    0.0,
    0.3
  );

  contactMaterial.contactEquationStiffness = 1e8;
  contactMaterial.contactEquationRegularizationTime = 3;
  contactMaterial.frictionEquationStiffness = 1e8;
  contactMaterial.frictionEquationRegularizationTime = 3;

  Physics.addContactMaterial(contactMaterial);

  Game.definePrefab("PlayerCamera", function() {
  	var camera = new Entity.Camera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    var follow = new Component.Follow();
    follow.offset = new THREE.Vector3(0, 200, -1);

    var control = new Component.Controller({
      'w': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.z = 200;
      },
      's': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.z = -200;
      },
      'a': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.x = 200;
      },
      'd': function() {
        var tar = this.getComponent("follow").target;
        tar.getComponent("rigidbody")._body.force.x = -200;
      },
      'q': function() {
        this.getComponent("follow").offset.add(new THREE.Vector3(0, 50, 0));
      },
      'e': function() {
        this.getComponent("follow").offset.add(new THREE.Vector3(0, -50, 0));
      }
    });
    camera.addComponent(control);
    camera.addComponent(follow);
    return camera;
  })
	.definePrefab("Ground", function() {
    var materials = [
      new THREE.MeshBasicMaterial({ color: 0xaaaaaa }),
      new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
      new THREE.MeshBasicMaterial({ color: 0xcccccc }),
    ];
		var geometry = new THREE.PlaneGeometry(1000, 1000, 20, 20)
      , material = new THREE.MeshFaceMaterial(materials)
      , plane = new CANNON.Plane();

    for(var i = 0; i < geometry.faces.length; i++) {
      var face = geometry.faces[i];
      face.materialIndex = (i % materials.length);
    }

    var ground = new Entity.Mesh("Ground", geometry, material);
    var rigidbody = new Component.Rigidbody(0, plane, physMaterial);

    rigidbody._body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );

    ground.addComponent(rigidbody);
    return ground;
	})
  .definePrefab("Player", function() {
    var geometry = new THREE.SphereGeometry(10)
      , material = new THREE.MeshNormalMaterial()
      , collider = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

    var player = new Entity.Mesh("Player", geometry, material);
    var rigidbody = new Component.Rigidbody(1, collider, physMaterial, { updateRotation: false });
    rigidbody._body.angularDamping = 1;
    player.addComponent(rigidbody);

    player.userData.slots = [{
      position: new THREE.Vector3(0, 0, 20),
      occupied: null,
    }, { 
      position: new THREE.Vector3(20, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(-20, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(0, 0, -20),
      occupied: null
    }];

    player.userData.healthValue = 100;
    player.userData.points = 999;
    
    Object.defineProperty(player.userData, 'health', {
      get: function() {
        return this.healthValue.toString() + '%';
      },
      enumerable: true
    });

    player.addAttachment = function(attachment) {
      var slot = _.find(this.userData.slots, function(el) {
        return !el.occupied;
      });

      if (slot === undefined) return;

      slot.occupied = true;
      slot.occupant = attachment;

      
      var bodyA = attachment.getComponent('rigidbody')._body
        , bodyB = this.getComponent('rigidbody')._body;

      var constraint = new CANNON.PointToPointConstraint(
        bodyA, new CANNON.Vec3(),
        bodyB, new CANNON.Vec3(slot.position.x, slot.position.y, slot.position.z)
      );

      Physics.addConstraint(constraint);
      attachment.fixture = player;
      attachment.lookAt(slot.position);
      attachment.position = slot.position;
    };

    return player;
  })
  .definePrefab("Enemy", function() {
    var geometry = new THREE.CubeGeometry(20, 20, 20)
      , material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      , collider = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

    var enemy = new Entity.Mesh("Enemy", geometry, material);
    var rigidbody = new Component.Rigidbody(1, collider, physMaterial, { updateRotation: false });

    rigidbody._body.addEventListener('collide', _.throttle(function(e) {
      var entity = e.with.owner;
      if (entity.userData.healthValue) {
        entity.userData.healthValue -= 5;
        console.log(entity);
      }
    }, 1000));
    var agent = new Component.Agent();

    enemy.addComponent(rigidbody);
    enemy.addComponent(agent);
    return enemy; 
  })
  .definePrefab("Spike", function() {
    var geometry = new THREE.CylinderGeometry(0, 5, 50)
      , material = new THREE.MeshBasicMaterial(0x3333dd)
      , collider = new CANNON.Cylinder(0, 5, 10, 8);

    var spike = new Entity.Mesh("Spike", geometry, material);
    var rigidbody = new Component.Rigidbody(0, collider);

    spike.addComponent(rigidbody);
    return spike;
  });

  /**
  * Scene definitions. 
  */
	Game.defineScene("Stage", function() {
    /* Set up the stage ground plane. */
    var ground = Game.createPrefab("Ground");   
    Game.addEntity(ground);

    /* Set up the player. */
    var player = Game.createPrefab("Player");
    player.getComponent('rigidbody')._body.position = new CANNON.Vec3(0, 10, 0);
    Game.addEntity(player);

    /* Create the game camera. */
    var camera = Game.createPrefab("PlayerCamera");
    camera.getComponent('follow').target = player;
    Game.addEntity(camera);

    /* Set up test enemies. */
    var enemy = Game.createPrefab("Enemy");
    enemy.getComponent('rigidbody')._body.position = new CANNON.Vec3(20, 30, 0);
    Game.addEntity(enemy);

    Interface.to("HUD", {
      playerData: player.userData
    });
  });
  Game.run("Stage");
});
