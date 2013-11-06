define(['prefab'], function(Prefab) {

  Prefab.define("PlayerCamera", function() {
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
  });

  Prefab.define("PlayerBase", function() {
    var geometry = new THREE.SphereGeometry()
      , material = new THREE.MeshNormalMaterial();

    var sphere = new Entity.Mesh("PlayerBase", geometry, material);
    
    return sphere;
  });

  Prefab.define("Player", function() {
    var base = Prefab.create("PlayerBase");

    var rigidbody = new Rigidbody(0.5, new CANNON.Sphere(50));

    var replicator = new Replicator([
      'position.x',
      'position.y',
      'position.z',
      'rotation.x',
      'rotation.y',
      'rotation.z'
    ]);

    base.addComponent(rigidbody);
    base.addComponent(replicator);
    return base;
  });

  Prefab.define("Ground", function() {
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
  });
});
