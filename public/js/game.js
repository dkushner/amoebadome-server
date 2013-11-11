var deps = [
  'underscore',
  'jquery',
  'three/Three',
  'three/Detector',
  'vendor/EventEmitter',
  'entity'
];

define(deps, function(_, $, THREE, Detector, EventEmitter, Entity) {
  var entities = {}
    , prefabs = {}
    , scenes = {};

  var active;

  return _.extend({
    config: {
      canvas: '#game',
      width : 800,
      height: 600,
      debug : true
    },
    init: function(opts) {
      this.config = _.defaults(opts || {}, this.config); 
      
      if(Detector.webgl) {
        this._renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        this._renderer.setClearColor(0x000000, 1);
      } else {
        this._renderer = new THREE.CanvasRenderer();
      }
      this._renderer.setSize(this.config.width, this.config.height);
      $(this.config.canvas).append(this._renderer.domElement);
      this._scene = new THREE.Scene();

      this.emitEvent('initialized');
      this.update();
      return this;
    },
    run: function(scene) {
      this.loadScene(scene);
      this.emitEvent('running');
    },
    update: function(dt) {
      window.requestAnimationFrame(this.update.bind(this));
      this.emitEvent('tick', [dt]);
      this.render();
    },
    render: function() {
      if (Entity.Camera.main) {
        this._renderer.render(this._scene, Entity.Camera.main);
      }
    },
    definePrefab: function(name, ctor) {
      prefabs[name] = ctor;
      return this;
    },
    createPrefab: function(name) {
      var args = Array.prototype.slice.call(arguments, 1); 
      return prefabs[name].apply(null, args);
    },
    defineScene: function(name, ctor) {
      scenes[name] = ctor;
      return this;
    },
    loadScene: function(name) {
      this.active && this._scene.remove(active);

      this.active = new THREE.Object3D();
      this._scene.add(this.active);
      scenes[name]();
    },
    addEntity: function(e) {
      if (e instanceof Array) {
        return _.map(e, this.addEntity, this);
      }

      var proc = function(el) {
        el.name = el.name || "Entity" + el.id;
        entities[el.uuid] = el;
        this.active.add(el);

        _.each(_.values(el.components), function(c) {
          c.update && this.addListener('tick', _.bind(c.update, c));
        }, this);
        this.emitEvent('entity', [el]);
      }.bind(this);

      if (e.children.length > 0) {
        THREE.SceneUtils.traverseHierarchy(e, proc);
      } else {
        proc(e); 
        this.emitEvent('entity', [e]);
      }
      return e;
    },
    removeEntity: function(e) {
      this.active.remove(e);
    }
  }, EventEmitter.prototype);
});
