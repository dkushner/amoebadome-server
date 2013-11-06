define('underscore.deep', [], function() {
	return {
    deep: function(obj, key, value) {
      var keys = key.replace(/\[(["']?)([^\1]+?)\1?\]/g, '.$2')
      .replace(/^\./, '') 
      .split('.');

      var root
        , i = 0
        , n = keys.length;

      if (arguments.length > 2) {
        root = obj;
        n--;

        while (i < n) {
          key = keys[i++];
          obj = obj[key] = _.isObject(obj[key]) ? obj[key] : {};
        } 
        obj[keys[i]] = value;
        value = root;
      } else {
        while ((obj = obj[keys[i++]]) != null && i < n) {};
        value = i < n ? void 0 : obj;
      }
      return value;
    }
  }
});
