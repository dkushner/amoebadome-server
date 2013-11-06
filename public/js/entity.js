define(['three/Three', 'underscore'], function(THREE, _) {
  var Entity = function(name) {
    this.name = name;
    this.components = {};
  };

  Entity.prototype = {
    addComponent: function(comp) {
      this.components[comp.getType()] = comp;
      comp.setOwner(this);
    },
    getComponent: function(type) {
      return this.components[type];
    },
    removeComponent: function(type) {
      this.components[type].destroy();
    }
  };
  Entity.prototype.constructor = Entity.Transform;

  Entity.Transform = function(name) {
    THREE.Object3D.call(this);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);
  };
  Entity.Transform.prototype = Object.create(THREE.Object3D.prototype);
  Entity.Transform.prototype.constructor = Entity.Transform;

  Entity.Camera = function(name) {
    var args;
    if (typeof name === "string") { 
      args = Array.prototype.slice.call(arguments, 1);
    } else {
      args = Array.prototype.slice.call(arguments);
    }
    THREE.PerspectiveCamera.apply(this, args);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);

    if(Entity.Camera.main === undefined)
      Entity.Camera.main = this;
  };
  Entity.Camera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
  Entity.Camera.prototype.constructor = Entity.Camera;

  Entity.Mesh = function(name) {
    var args;
    (typeof name === "string") ? 
      args = Array.prototype.slice.call(arguments, 1) :
      args = Array.prototype.slice.call(arguments);

    THREE.Mesh.apply(this, args);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);
  };
  Entity.Mesh.prototype = Object.create(THREE.Mesh.prototype);
  Entity.Mesh.prototype.constructor = Entity.Mesh;

  Entity.AmbientLight = function(name) {
    var args;
    (typeof name === "string") ?
      args = Array.prototype.slice.call(arguments, 1) :
      args = Array.prototype.slice.call(arguments);
    
    THREE.AmbientLight.apply(this, args);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);

  };
  Entity.AmbientLight.prototype = Object.create(THREE.AmbientLight.prototype);
  Entity.AmbientLight.prototype.constructor = Entity.AmbientLight;

  Entity.DirectionalLight = function(name) {
    var args;
    (typeof name === "string") ?
      args = Array.prototype.slice.call(arguments, 1) :
      args = Array.prototype.slice.call(arguments);

    THREE.DirectionalLight.apply(this, args);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);
  };
  Entity.DirectionalLight.prototype = Object.create(THREE.DirectionalLight.prototype);
  Entity.DirectionalLight.prototype.constructor = Entity.DirectionalLight;

  Entity.PointLight = function(name) {
    var args;
    (typeof name === "string") ?
      args = Array.prototype.slice.call(arguments, 1) :
      args = Array.prototype.slice.call(arguments);

    THREE.PointLight.apply(this, args);

    _.extend(this, Entity.prototype);
    Entity.call(this, name);
  };
  Entity.PointLight.prototype = Object.create(THREE.PointLight.prototype);
  Entity.PointLight.prototype.constructor = Entity.PointLight;

  return Entity;
});
