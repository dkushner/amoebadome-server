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
