var deps = [
  'services/physics',
  'underscore',
  'jquery'
];

define(deps, function(Physics, _, $) {
  var Component = function(type) {
    if (!type)
      throw new Error("Cannot create untyped component.");

    this._type = type;
  };
  Component.prototype.constructor = Component;

  Component.prototype.setOwner = function(owner) {
    this._owner = owner; 
  };
  Component.prototype.getOwner = function() {
    return this._owner;
  };
  Component.prototype.getType = function() {
    return this._type;
  };
  Component.prototype.destroy = function() {
    delete this;
  };

  /**
   * Controller
   */
  Component.Controller = function(actions) {
    this._actions = actions || {};
    Component.call(this, "controller");
  };

  Component.Controller.prototype = Object.create(Component.prototype);
  Component.Controller.constructor = Component.Controller;

  Component.Controller.prototype.setOwner = function(owner) {
    this._actions = _.reduce(_.pairs(this._actions), function(ag, el) {
      ag[el[0].charCodeAt(0)] = _.bind(el[1], this);
      return ag;
    }, {}, owner);
    
     
    $(document).on('keypress', $.proxy(function(e) {
      this._actions[e.which] && this._actions[e.which](); 
    }, this));
    Component.prototype.setOwner.call(this, owner);
  };

  Component.Controller.prototype.destroy = function() {
    _.each(_.pairs(this._actions), function(el) {
      Input.removeListener(el[0], el[1]);
    });
    Component.prototype.destroy.call(this);
  };

  /**
   * Follow
   */
  Component.Follow = function(target) {
    Object.defineProperty(this, 'target', {
      get: function() {
        return this._target;
      },
      set: function(v) {
        this._target = v;
        if(this._target) {
          this._owner.position.addVectors(this._target.position, this.offset);
          this._owner.lookAt(this._target.position);
        }
      }
    });

    this.target = target;
    this.offset = new THREE.Vector3(0, 0, 0);

    Component.call(this, "follow");
  };

  Component.Follow.prototype = Object.create(Component.prototype);
  Component.Follow.prototype.constructor = Component.Follow;

  Component.Follow.prototype.update = function(dt) {
    if (this.target === undefined) return;
    this._owner.position.addVectors(this.target.position, this.offset);
  };
 
  /**
   * Rigidbody
   */
  Component.Rigidbody = function(mass, shape, material, opts) {
    this._opts = _.defaults(opts || {}, {
      updatePosition: true,
      updateRotation: true
    });

    if (material instanceof CANNON.Material) {
      this._body = new CANNON.RigidBody(mass, shape, material);
    } else {
      this._body = new CANNON.RigidBody(mass, shape);
    }
    Component.call(this, "rigidbody");
  };
  
  Component.Rigidbody.prototype = Object.create(Component.prototype);
  Component.Rigidbody.prototype.constructor = Component.Rigidbody;

  Component.Rigidbody.prototype.setOwner = function(owner) {
    this._body.owner = owner;
    Physics.addBody(this._body);

    var tick = function() {
      this._opts.updatePosition && 
        this._body.position.copy(this._owner.position);
      this._opts.updateRotation && 
        this._body.quaternion.copy(this._owner.quaternion);

      window.requestAnimationFrame(tick.bind(this));
    }.bind(this);

    Component.prototype.setOwner.call(this, owner); 
    tick();
  };
  Component.Rigidbody.prototype.destroy = function() {
    console.log("DESTROYED");
    Physics.removeBody(this._body);
  };

  Component.Agent = function() {
    this.trigger = new CANNON.RigidBody(1, new CANNON.Sphere(20));
    this.trigger.collisionFilterGroup = 2;
    this.trigger.collisionFilterMask = 1;
    this.trigger.collisionResponse = false;

    this.trigger.addEventListener('collide', function(e) {
      var target = e.with.owner;

      if (!target.userData) return;

      var threat = attachCount + target.userData.stats + target.userData.stats
    });
    Component.call(this, "agent"); 
  };
  Component.Agent.prototype = Object.create(Component.prototype);
  Component.Agent.prototype.constructor = Component.Agent;
  
  Component.Agent.prototype.update = function() {
  };

  return Component;
});
