requirejs.config({
  baseUrl: 'js',
  paths: {
    'vendor': '../vendor',
    'underscore': '../vendor/underscore',
    'jquery': '../vendor/jquery',
    'underscore.deep': '../vendor/underscore.deep',
    'three': '../vendor/three',
    'post': '../vendor/three/post',
    'shaders': '../vendor/three/shaders',
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
      exports: 'THREE'
    },
    'shaders/CopyShader': ['three/Three'],
    'shaders/VignetteShader': ['three/Three'],
    'post/ShaderPass': ['three/Three'],
    'post/RenderPass': ['three/Three'],
    'post/MaskPass': ['three/Three'],
    'post/EffectComposer': ['three/Three'],
    'three/ShaderExtras': ['three/Three'],
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
   * Shared Resource Setup
   */
  var moveUniforms = {
    color: { type: 'c', value: new THREE.Color(0xffffff) },
    movement: { type: 'f', value: 0 },
    time: { type: 'f', value: 1.0 }
  };

  var moveMaterial = new THREE.ShaderMaterial({
    uniforms: moveUniforms,
    vertexShader: $('#movement-vertex').text(),
    fragmentShader: $('#movement-fragment').text(),
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  var enemyUniforms = {
    color: { type: 'c', value: new THREE.Color(0xffffff) },
    movement: { type: 'v3', value: new THREE.Vector3() },
    time: { type: 'f', value: 1.0 }
  };

  var enemyMaterial = new THREE.ShaderMaterial({
    uniforms: enemyUniforms,
    vertexShader: $('#enemy-vertex').text(),
    fragmentShader: $('#movement-fragment').text(),
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

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
		var geometry = new THREE.PlaneGeometry(1000, 1000, 20, 20)
      , material = new THREE.MeshBasicMaterial({ color: 0x333366 })
      , plane = new CANNON.Plane();

    for(var i = 0; i < geometry.vertices.length; i++) {
      geometry.vertices[i].add(new THREE.Vector3(
        0,
        Math.random() * 5,
        0
      ));
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
    var geometry = new THREE.SphereGeometry(10, 20, 20)
      , material = moveMaterial.clone()
      , collider = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

    var player = new Entity.Mesh("Player", geometry, material);
    var rigidbody = new Component.Rigidbody(1, collider, physMaterial);

    rigidbody._body.angularDamping = 1;
    rigidbody._body.linearDamping = 0.3;
    rigidbody._body.addEventListener('collide', _.throttle(function(e) {
      var entity = e.with.owner;
      if (entity.name == "Enemy") {
        entity.damage(5, player);
      }
    }, 3000, { trailing: false }));

    material.uniforms.color.value = new THREE.Color(0x00ff00);
    Game.on('tick', function(dt) {
      material.uniforms.movement.value = lastVelocity;
      material.uniforms.time.value = (material.uniforms.time.value > 30) ? dt :
      material.uniforms.time.value += dt;
    });

    var activeRotation = 0;
    var activeTranslation = 0;
    var lastVelocity = 0;
    var maxVelocity = 50;
    var heading = new CANNON.Vec3(1.0, 0.0, 0.0);
    var bearing = new CANNON.Quaternion();

    Game.on('tick', function(dt) {
      lastVelocity = Math.min(Math.max(lastVelocity + 0.1 * activeTranslation, -maxVelocity), maxVelocity);
      bearing.setFromAxisAngle(new CANNON.Vec3(0.0, 1.0, 0.0), activeRotation / 50);
      rigidbody._body.quaternion.mult(bearing, rigidbody._body.quaternion);
      bearing.vmult(heading, heading);
      heading.mult(lastVelocity, rigidbody._body.velocity);
    });

    $(document).keydown(function(e) {
      switch(e.keyCode) {
        case 65: 
          activeRotation = 1;
          break;
        case 68:
          activeRotation = -1;
          break;
        case 87:
          activeTranslation = 1;
          break;
        case 83:
          activeTranslation = -1;
          break;
        default:
          break;
      }
    });
    $(document).keyup(function(e) {
      switch(e.keyCode) {
        case 65:
        case 68:
          activeRotation = 0;
          break;
        case 87:
        case 83:
          activeTranslation = 0;
          break;
        default:
          break;
      }
    });

    player.addComponent(rigidbody);
    player.userData.slots = [{
      position: new THREE.Vector3(0, 0, 12),
      occupied: null,
    }, { 
      position: new THREE.Vector3(12, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(-12, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(0, 0, -12),
      occupied: null
    }];

    player.userData.healthValue = 100;
    player.userData.pointsValue = 0;

    player.userData.currentLevel = 0;
    player.userData.levelProgress = 0;
    
    // Health accessor to transform the raw health value to
    // CSS-friendly percentage.
    Object.defineProperty(player.userData, 'health', {
      get: function() {
        return this.healthValue.toString() + '%';
      },
      enumerable: true
    });

    Object.defineProperty(player.userData, 'points', {
      get: function() {
        return this.levelProgress.toString() + '%';
      }
    });

    player.addExperience = function(exp) {
      this.userData.pointsValue += exp;
      
      var level = Math.floor(Math.log(this.userData.pointsValue));
      if (level > this.userData.currentLevel) {
        this.userData.currentLevel = level;
        // Present the upgrade menu.
      }
      this.userData.levelProgress = 100 * this.userData.pointsValue / (Math.exp(this.userData.currentLevel + 1));
    };

    player.addAttachment = function(attachment) {
      var slot = _.find(this.userData.slots, function(el) {
        return !el.occupied;
      });

      if (slot === undefined) return;

      slot.occupied = true;
      slot.occupant = attachment;
      
      if (attachment.getComponent('rigidbody')) {
        var bodyA = attachment.getComponent('rigidbody')._body
          , bodyB = this.getComponent('rigidbody')._body;

        var constraint = new CANNON.PointToPointConstraint(
          bodyA, new CANNON.Vec3(),
          bodyB, new CANNON.Vec3(slot.position.x, slot.position.y, slot.position.z)
        );
        Physics.addConstraint(constraint);
      } 
      
      attachment.fixture = player;
      player.add(attachment);
      attachment.lookAt(slot.position);
      attachment.position = slot.position;
    };
    return player;
  })
  .definePrefab("Enemy", function() {
    var geometry = new THREE.SphereGeometry(10, 20, 20)
      , material = enemyMaterial.clone()
      , collider = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

    
    var enemy = new Entity.Mesh("Enemy", geometry, material);
    var rigidbody = new Component.Rigidbody(1, collider, physMaterial);

    rigidbody._body.angularDamping = 1;
    rigidbody._body.linearDamping = 0.3;

    rigidbody._body.addEventListener('collide', _.throttle(function(e) { //Damage Player Event
      var entity = e.with.owner;
      if (entity.name == "Player") {
        console.log(entity);
        //Check for Endospore attachment
        rigidbody._body.owner.kill(20,entity); //better way to do this?
      }
    }, 3000, { trailing: false }));

    var deltaRot = new CANNON.Quaternion()
      , heading = new CANNON.Vec3(1.0, 0.0, 0.0);

    material.uniforms.color.value = new THREE.Color(0xff0000);
    Game.on('tick', function(dt) {
      var speed = rigidbody._body.velocity.norm();
      material.uniforms.time.value = (material.uniforms.time.value > 30) ? dt :
      material.uniforms.time.value += dt; 
      material.uniforms.movement.value = rigidbody._body.velocity;
    });

    enemy.userData.healthValue = 10;
    enemy.damage = function(d, source) {
      this.userData.healthValue -= d;
      
      // Flash to indicate damage has been done.
      this.material.uniforms.color.value = new THREE.Color(0xffffff);
      window.setTimeout(function() {
        enemy.material.uniforms.color.value = new THREE.Color(0xff0000);
      }, 50);

      // Check for death.
      if (this.userData.healthValue <= 0) {
        var font = Game.createPrefab("CurrencyFont", source);
        font.position = enemy.position;
        Game.addEntity(font);
        Game.removeEntity(enemy);
      }
    };

    enemy.kill = function(d,target) {
      target.userData.healthValue -= d;
    };

    enemy.patrol = function(center, radius) {
      rigidbody._body.position = new CANNON.Vec3(center.x, center.y, center.z);
      
      window.setInterval(function() {
        var target = center.clone().add(new THREE.Vector3(
          ((Math.random() * 2) - 1) * radius,
          0,
          ((Math.random() * 2) - 1) * radius
        ));
        rigidbody._body.velocity = target.multiplyScalar(1 / 3); 
      }, 3000);

    };

    enemy.addComponent(rigidbody);
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
  })
  .definePrefab("CurrencyFont", function(attractor) {
    var particleCount = 100
      , particles = new THREE.Geometry();
    
    var texture = new THREE.ImageUtils.loadTexture('http://localhost:5000/images/dna-icon-sprite.png');

    var material = new THREE.ParticleBasicMaterial({ 
      color: 0xffffff,
      size: 5,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    for (var p = 0; p < particleCount; p++) {
      var particle = new THREE.Vector3(
        Math.random() * 50 - 25,
        Math.random() * 50,
        Math.random() * 50 - 25
      );
      particle.velocity = new THREE.Vector3();
      particles.vertices.push(particle);
    }

    var system = new Entity.ParticleSystem(particles, material);
    system.sortParticles = true;

    var flyTime = 3 
      , increment = 2 / flyTime;

    Game.on('tick', function(dt) {
      if (flyTime < 0.0) {
        Game.removeEntity(system);
        return true;
      }

      var count = particleCount;
      attractor.addExperience(increment * dt);
      while(count--) {
        var particle = particles.vertices[count];

        particle.add(particle.velocity.multiplyScalar(dt));
        particle.velocity = new THREE.Vector3().subVectors(attractor.position, new THREE.Vector3().addVectors(particle, system.position)).multiplyScalar(3);
        system.geometry.__dirtyVertices = true;
      }
      flyTime -= dt;
    });
    return system;
  })
  .definePrefab("Mitochondrion", function() {
    var mito = new Entity.Transform("Mitchondrion");

    setInterval(function() {
      if (mito.parent && mito.parent.userData.healthValue) {
        var health = mito.parent.userData.healthValue;
        health = Math.min(health + 0.4, 100);
        mito.parent.userData.healthValue = health;
      }
    }, 1000);
    return mito;
  })
  .definePrefab("Grapple", function() {
    var createConstraints = function(b1, b2, d) {
      
    };

    var geometry = new THREE.CubeGeometry(2, 2, 2, 1, 1)
      , material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
      , mesh = new Entity.Mesh("Grapple", geometry, material)
      , raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 20, 100);

    var control = new Component.Controller({
      'f': function() {     
        var enemies = _.filter(Game.entities, function(entity) {
          return entity.name == "Enemy";
        });

        var dir = mesh.parent.localToWorld(mesh.position.clone())
        dir.sub(mesh.parent.position);
        dir.normalize();
        raycaster.set(mesh.parent.position, dir);
        var intersect = raycaster.intersectObjects(enemies);
        if (intersect.length) {
          var target = intersect[0].object.getComponent('rigidbody')._body; 
          var player = mesh.parent.getComponent('rigidbody')._body;

          var constraint = new CANNON.DistanceConstraint(target, player, 0, 1); 
          Physics.addConstraint(constraint);

          var timer = setInterval(function() {
            var distance = target.position.vsub(player.position).norm2();
            if (distance <= 900) {
              Physics.removeConstraint(constraint);
              clearInterval(timer); 
            }
          }, 1000);

          setTimeout(function() {
            Physics.removeConstraint(constraint); 
            clearInterval(timer);
          }, 2000);
        }
      }
    });
    mesh.addComponent(control);
    return mesh; 
  })
  .definePrefab("Plasma",function(){    

    var geometry = new THREE.Geometry()
      , material = new THREE.MeshBasicMaterial()
      , plasma = new Entity.Mesh("Plasma", geometry, material);

    var control = new Component.Controller({
      'p' : function(){

        var player = plasma.parent.getComponent('rigidbody')._body;
        var created =  0;
        var maxCreated = 30;
        var quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(-1,0,0), 90 * Math.PI/180);
        var lastPos = new THREE.Vector3(player.position.x,1,player.position.z);

        var timerID = setInterval(function(){
          if(Math.abs(player.position.x - lastPos.x) % 100 > 10 || Math.abs(player.position.z - lastPos.z) % 100 > 10){
            created += 1;
            lastPos.x = player.position.x;
            lastPos.z = player.position.z;
            
            var geometry = new THREE.PlaneGeometry(10,10)
            , material = new THREE.MeshNormalMaterial()
            , collider = new CANNON.Box(new CANNON.Vec3(5,5,5))
            , rigidbody = new Component.Rigidbody(0,collider)
            , plane = new Entity.Mesh("PlasmaPlane",geometry, material);
            plane.addComponent(rigidbody);
            plane.getComponent('rigidbody')._body.collisionResponse = false;
            rigidbody._body.addEventListener('collide', _.throttle(function(e){
                console.log("Collision Works");
                //ADD 'SLOW' HERE TO ENEMIES
            }));

            rigidbody._body.quaternion = quat;
            plane.addComponent(rigidbody);
            
            Game.addEntity(plane);
            plane.getComponent('rigidbody')._body.position = new CANNON.Vec3(player.position.x-5,10, player.position.z- 5);
            if(created == maxCreated){
              clearInterval(timerID);
            }

            var destroy = setTimeout(function(){
              Physics.removeBody(plane.getComponent('rigidbody')._body);
              Game.removeEntity(plane);
            },3000);
          }
        },500);
      }
    });
    plasma.addComponent(control);
    return plasma;    
  })
  .definePrefab("Endospore", function() {
    var torus = new THREE.TorusGeometry(15, 3, 8, 20)
      , material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
      , endospore = new Entity.Mesh("Endospore", torus, material);


    return endospore;
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

    var grapple = Game.createPrefab("Grapple");
    Game.addEntity(grapple);
    player.addAttachment(grapple);

    var plasma = Game.createPrefab("Plasma");
    Game.addEntity(plasma);
    player.addAttachment(plasma);

    var endospore = Game.createPrefab("Endospore");
    Game.addEntity(endospore)
    player.addAttachment(endospore);

    /* Create the game camera. */
    var camera = Game.createPrefab("PlayerCamera");
    camera.getComponent('follow').target = player;
    Game.addEntity(camera);

    /* Set up test enemies. */
    for (var i = 0; i < 15; i++) {
      var position = new CANNON.Vec3(
        ((Math.random() * 2) - 1) * 500,
        20,
        ((Math.random() * 2) - 1) * 500 
      );
      var enemy = Game.createPrefab("Enemy");
      enemy.getComponent('rigidbody')._body.position = position;
      Game.addEntity(enemy);
    }
    var enemy = Game.createPrefab("Enemy");
    enemy.getComponent('rigidbody')._body.position = new CANNON.Vec3(20, 30, 0);
    Game.addEntity(enemy);

    Interface.to("HUD", {
      playerData: player.userData
    });
  });

  Game.run("Stage");
});
