var Interface = function(elements, anchor) {
  this._elements = {};
  this._root = $(document.createElement('dl'))
  .css(Interface.style)
  .addClass('interface')
  .appendTo($(Game.config.canvas));
  this._halfWidth = $(Game.config.canvas).innerWidth() / 2;
  this._halfHeight = $(Game.config.canvas).innerHeight() / 2;

  this._anchor = anchor;
  this.addElements(elements);
  Component.call(this, "interface");
};

Interface.prototype = Object.create(Component.prototype);
Interface.prototype.constructor = Interface;

Interface.prototype.setOwner = function(owner) {
  if (this._anchor) {
    $(this._root).css({
      left: this._anchor[0],
      top: this._anchor[1]
    });
  };
  Component.prototype.setOwner.call(this, owner);
};

Interface.prototype.update = function(dt) {
  if (this._owner === 'undefined') return;

  if (!this._anchor) {
    var pos = new THREE.Vector3();
    pos.copy(this._owner.position);

    var projector = new THREE.Projector();
    projector.projectVector(pos, Entity.Camera.main);

    pos.x = (pos.x + 1) * this._halfWidth;
    pos.y = (pos.y + 1) * this._halfHeight;

    $(this._root).css({
      left: pos.x,
      top: pos.y
    });
  }

  // Update each interface control.
  _.each(_.values(this._elements), function(el) {
    el.update && el.update.call(el.target, el.element);
  }, this);
};

Interface.prototype.addElements = function(elem) {
  if (typeof elem !== 'object') {
    throw new Error("Expected elements object.");  
  }

  var elems = _.reduce(_.pairs(elem), function(d, el) {
    var name = el[0];
    var data = el[1];
    
    var e = $(this._root)
    .append("<dt class='" + name + "'></dt>")
    .find('.' + name)
    .css(data.style || {})
    .append("<dd></dd>")
    .find('dd');
    
    // Let the element set up the dom.
    data.setup && data.setup.call(data.target, e);

    // Add reduced object to accumulator.
    d[name] = {
      target: data.target, 
      element: e, 
      update: data.update
    };
    return d;
  }, {}, this);
  _.extend(this._elements, elems);
};

Interface.style = {
  'position': 'absolute',
  'min-width': '100px',
  'z-index': 1000,
  'color': '#ffffff',
  'font-size': 'small'
};

