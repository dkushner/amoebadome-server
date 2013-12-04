var deps = [
  'jquery',
  'underscore',
  'vendor/EventEmitter'
];

define(deps, function($, _, EventEmitter) {
  var listeners = [];

  var interface = _.extend({
    to: function(name, bind, handle) {
      // Clear previous screen's listeners.
      this.removeListeners('tick', listeners);
      listeners = [];

      $("#interface")
      .html($("script[name='" + name + "']").text())
      .find("[data-bind]")
      .each(function() {
        var label = $(this).attr('data-bind');

        $(this).find("[data-property]")
        .each(function() {
          var prop = $(this).attr('data-property').split(' as ');

          if (prop.length > 1) {
            $(this).css(prop[1], _.deep(bind[label], prop[0]));
            if ($(this).attr('data-watch') !== undefined) {
              listeners.push(function() {
                this.css(prop[1], _.deep(bind[label], prop[0]));
              }.bind($(this)));
            }
          } else {
            $(this).text(_.deep(bind[label], prop[0])); 
            if ($(this).attr('data-watch') !== undefined) {
              listeners.push(function() {
                this.text(_.deep(bind[label], prop[0]));
              }.bind($(this)));
            }
          }
        });

        $(this).find("[data-click]")
        .each(function() {
          var event = $(this).attr('data-click');
          $(this).click(bind[label][event]);
        });
      });
      this.addListeners('tick', listeners);
    }
  }, EventEmitter.prototype);

  var tick = function() {
    interface.emitEvent('tick'); 
    window.requestAnimationFrame(tick);
  };
  tick();

  return interface;
});

