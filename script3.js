/**
 * Created by super on 11/25/16.
 */
// Worker

var worker = (function() {

  var subscribe = function(channel, fn) {
    if(!worker.channels[channel]) worker.channels[channel] = [];
    worker.channels[channel].push({context: this, callback: fn});
  };

  var publish = function(channel) {
    if(!worker.channels[channel]) return false;
    var args = Array.prototype.slice.call(arguments, 1);
    for(var i = 0, l = worker.channels[channel].length; i < l; i++) {
      var subscription = worker.channels[channel][i];
      subscription.callback.apply(subscription.context, args)
    }
    return this;
  };

  return {
    channels: {},
    publish: publish,
    subscribe: subscribe,
    installTo: function(obj) {
      obj.subscribe = subscribe;
      obj.publish = publish;
    }
  };

}());

var myWorker = worker;

console.log(myWorker)

worker.name = 'hi'
console.log(myWorker)