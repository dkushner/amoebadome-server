define(['component'], function(Component) {

  var Controller = function(actions) {
    this._actions = actions || {};
    Component.call(this, "controller");
  };
  Controller.prototype = Object.create(Component.prototype);
  Controller.prototype.constructor = Controller;

  Controller.prototype.setOwner = function(owner) {
    console.log(this._actions);
    this._actions = _.reduce(_.pairs(this._actions), function(ag, el) {
      ag[el[0]] = _.bind(el[1], this); 
      return ag;
    }, {}, owner);
    console.log(this._actions);

    _.each(_.pairs(this._actions), function(el) {
      Game.Input.addListener(el[0], el[1]);
    });
    Component.prototype.setOwner.call(this, owner);
  };

  Controller.prototype.destroy = function() {
    _.each(_.pairs(this._actions), function(el) {
      Game.Input.removeListener(el[0], el[1]);
    });
    Component.prototype.destroy.call(this);
  };

  return Controller;
});
