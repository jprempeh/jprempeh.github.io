var CORE = (function () {
  var moduleData = {},
    debug      = true,
    create_module;

  create_module = function (moduleID, creator) {
    var temp;
    if (typeof moduleID === 'string' && typeof creator === 'function') {
      temp = creator(Sandbox.create(this, moduleID));
      if (temp.init && temp.destroy && typeof temp.init === 'function' && typeof temp.destroy === 'function') {
        moduleData[moduleID] = {
          create : creator,
          instance : null
        };
        temp = null;
      } else {
        this.log(1, "Module \"" + moduleId + "\" Registration: FAILED: instance has no init or destroy functions");
      }
    } else {
      this.log(1, "Module \"" + moduleId +  "\" Registration: FAILED: one or more arguments are of incorrect type" );

    }
  }
  return {
    debug: function (on) {
      debug = !!on;
    }
  }
}());




typing into this