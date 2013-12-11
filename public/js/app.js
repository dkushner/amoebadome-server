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

  var plasmaUniforms = {
          time : { type : 'f', value : 0 }
  };  

  var moveUniforms = {
    color: { type: 'c', value: new THREE.Color(0xffffff) },
    movement: { type: 'f', value: 0 },
    time: { type: 'f', value: 1.0 }
  };

  var plasmaMaterial = new THREE.ShaderMaterial({
      uniforms : plasmaUniforms,
      vertexShader : $('#plasma-vertex').text(),
      fragmentShader : $('#plasma-fragment').text(),
      side: THREE.FrontSide,
      transparent : true
  });

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
    var plane = new CANNON.Plane();
    var ground = new Entity.Transform("Ground");
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
      occupied: null
    }, {
      position: new THREE.Vector3(-8.5, 0, 8.5),
      occupied: null
    }, { 
      position: new THREE.Vector3(-12, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(-8.5, 0, -8.5),
      occupied: null
    }, {
      position: new THREE.Vector3(0, 0, -12),
      occupied: null
    }, {
      position: new THREE.Vector3(8.5, 0, -8.5), 
      occupied: null
    }, {
      position: new THREE.Vector3(12, 0, 0),
      occupied: null
    }, {
      position: new THREE.Vector3(8.5, 0, 8.5),
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
        return this.healthValue.toFixed(1).toString() + '%';
      },
      enumerable: true
    });

    Object.defineProperty(player.userData, 'points', {
      get: function() {
        return this.levelProgress.toString() + '%';
      }
    });

    player.damage = function(d, source) {
      var endospores = _.filter(this.userData.slots, function(slot) {
        if (slot.occupied) {
          return slot.occupant.name == "Endospore";
        }
        return false;
      });
      console.log(endospores);
      this.userData.healthValue -= (d - (d * 0.1 * endospores.length));
      
      // Flash to indicate damage has been done.
      this.material.uniforms.color.value = new THREE.Color(0xffffff);
      window.setTimeout(function() {
        player.material.uniforms.color.value = new THREE.Color(0x00ff00);
      }, 50);

      // Check for death.
      if (this.userData.healthValue <= 0) {
        Interface.to("End");
      }
    };

    player.addExperience = function(exp) {
      this.userData.pointsValue += exp;
      
      var level = Math.floor(Math.log(this.userData.pointsValue));
      if (level > this.userData.currentLevel) {
        this.userData.currentLevel = level;
        this.userData.selected = "";

        Interface.to("Level", {
          configData: {
            selectEndospore: function() {
              player.userData.selected = "Endospore";
            },
            selectPilus: function() {
              player.userData.selected = "Pilus";
            },
            selectMito: function() {
              player.userData.selected = "Mitochondrion";
            },
            selectAntibody: function() {
              player.userData.selected = "Antibody";
            },
            north: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 0);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            northEast: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 1);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            east: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 2);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            southEast: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 3);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            south: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 4);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            southWest: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 5);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            west: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 6);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            },
            northWest: function() {
              if (player.userData.selected) {
                var attach = Game.createPrefab(player.userData.selected, 7);
                Game.addEntity(attach);
                player.addAttachment(attach);
                Interface.to("HUD", {
                  playerData: player.userData
                });
              }
            }
          }
        });
      }
      this.userData.levelProgress = 100 * this.userData.pointsValue / (Math.exp(this.userData.currentLevel + 1));
    };

    player.addAttachment = function(attachment, slot) {
      if (slot === undefined) {
        slot = _.find(this.userData.slots, function(el) {
          return !el.occupied;
        })
      } else {
        slot = player.userData.slots[slot];
      }
 
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
        Game.addEntity(attachment);
      } 
      else{
        player.add(attachment);
      }
      
      attachment.fixture = player;
      //player.add(attachment);
      if (attachment.name == "Endospore") {
        attachment.position = new THREE.Vector3();
      } else { 
        attachment.lookAt(slot.position);
        attachment.position = slot.position;
      }
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

    rigidbody._body.addEventListener('collide', _.throttle(function(e) { 
      var entity = e.with.owner;
      if (entity.name == "Player") {
        entity.damage(10, enemy); 
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

    enemy.patrol = function(center, radius) {
      rigidbody._body.position = new CANNON.Vec3(center.x, 10, center.z);
      window.setInterval(function() {
        var target = center.clone().add(new THREE.Vector3(
          ((Math.random() * 2) - 1) * radius,
          10,
          ((Math.random() * 2) - 1) * radius
        ));
        target.multiplyScalar(1 / 10); 
        rigidbody._body.velocity = new CANNON.Vec3(
          target.x,
          target.y,
          target.z
        );
      }, 10000);
    };

    enemy.addComponent(rigidbody);
    return enemy; 
  })
  .definePrefab("Antibody", function() {
    var geometry = new THREE.CylinderGeometry(0,3, 10)
      , material = new THREE.MeshBasicMaterial(0x3333dd)
      , collider = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
 
    var player = _.filter(Game.entities, function(entity) {
        return entity.name == "Player";
      });
 
    var spike = new Entity.Mesh("Antibody", geometry, material);
    var rigidbody = new Component.Rigidbody(0.1, collider);
    var timerID = setInterval( function() {
      var position = rigidbody._body.position;
      var playerPosition = player[0].getComponent('rigidbody')._body.position;
      var rotate = new CANNON.Quaternion();
      var temp = new CANNON.Quaternion();

      rotate.setFromAxisAngle(new CANNON.Vec3(1,0,0),90*Math.PI/180);
      //Get rotation
      var v = new CANNON.Vec3(spike.position.x - player[0].position.x, spike.position.y - player[0].position.y, spike.position.z - player[0].position.z);
      var u = new CANNON.Vec3(-1,0,0);
      v.normalize();
      var Dot = u.dot(v);
      var theta = Math.acos(Dot);
      theta = theta*180/Math.PI;
      if(spike.position.z < player[0].position.z){
        theta *= -1;
      }
      temp.setFromAxisAngle(new CANNON.Vec3(0,1,0),(theta-90)*Math.PI/180);
      var last = temp.mult(rotate);
      last.copy(rigidbody._body.quaternion);  
      rigidbody._body.angularDamping = 1;

    },100);
 
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
  .definePrefab("Pilus", function() {
    var createConstraints = function(b1, b2, d) {
      
    };

    var geometry = new THREE.CubeGeometry(2, 2, 2, 1, 1)
      , material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
      , mesh = new Entity.Mesh("Pilus", geometry, material)
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
    var plasma = new Entity.Transform("Plasma");
    var plasmaPool = [];
    var fixQuat = new CANNON.Quaternion();
    fixQuat.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), 90 * Math.PI / 180);
    
    for (var i = 0; i < 30; i++) {
      var geometry = new THREE.PlaneGeometry(10, 10,5,6)
        , material = plasmaMaterial.clone()
        , collider = new CANNON.Box(new CANNON.Vec3(5, 5, 5))
        , rigidbody = new Component.Rigidbody(0, collider)
        , mesh = new Entity.Mesh("PlasmaPlane", geometry, material);

      fixQuat.copy(rigidbody._body.quaternion);
      rigidbody._body.position.set(9999, 9999, 9999);
      rigidbody._body.collisionResponse = false;
      rigidbody._body.addEventListener('collide', _.throttle(function(e) {
        if (e.with.owner.name == "Enemy") {
          e.with.linearDamping = 0.8;
          e.with.owner.damage(2, plasma.parent);
          setTimeout(function() {
            e.with.linearDamping = 0.3; 
          }, 3000);
        }
      }, 1000));
      mesh.addComponent(rigidbody);
      Game.addEntity(mesh);
      plasmaPool.push(mesh);
    }

   Game.on('tick', function(dt) {
      material.uniforms.time.value = (material.uniforms.time.value > 30) ? dt :
      material.uniforms.time.value += dt;
    });

    var control = new Component.Controller({
      'p' : function(){
        var playerBody = plasma.parent.getComponent('rigidbody')._body;

        var lastPos = new CANNON.Vec3()
          , thisPos = new CANNON.Vec3();

        var timerId = setInterval(function() {
          playerBody.position.copy(thisPos);
          if(thisPos.vsub(lastPos).norm2() > 100){
            var plane = plasmaPool.pop();
            plane.getComponent('rigidbody')._body.position.set(
              playerBody.position.x,
              10,
              playerBody.position.z
            );
            plasmaPool.unshift(plane);
            
            setTimeout(function(){
              plane.getComponent('rigidbody')._body.position.set(9999, 9999, 9999);
            },10000);
          }
          thisPos.copy(lastPos);
        },500);

        setTimeout(function() {
          clearInterval(timerId);
        }, 10000);
      }
    });
    plasma.addComponent(control);
    return plasma;    
  })
  .definePrefab("Endospore", function() {
    var torus = new THREE.TorusGeometry(15, 3, 8, 20)
      , material = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.5
      })
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

    var plasma = Game.createPrefab("Plasma");
    Game.addEntity(plasma);
    player.addAttachment(plasma);

    var endospore = Game.createPrefab("Endospore");
    Game.addEntity(endospore)
    player.addAttachment(endospore);
    endospore.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    /* Create the game camera. */
    var camera = Game.createPrefab("PlayerCamera");
    camera.getComponent('follow').target = player;
    Game.addEntity(camera);

    /* Set up test enemies. */
    for (var i = 0; i < 15; i++) {
      var position = new THREE.Vector3(
        ((Math.random() * 2) - 1) * 300,
        20,
        ((Math.random() * 2) - 1) * 300 
      );
      var enemy = Game.createPrefab("Enemy");
      enemy.patrol(position, 200);
      Game.addEntity(enemy);
    }

    Interface.to("Intro", {
      introData: {
        play: function() {
          Interface.to("HUD", {
            playerData: player.userData
          });
        }
      }
    });
  });

  Game.run("Stage");
});