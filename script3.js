/**
 * Created by super on 11/25/16.
 */
// Worker

var Worker = function(name) {
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
    },
    name: name || ''
  };

};


function App() {
  this.settings = {
    client_id: '86qz5at41ns04i6ma9dgqguhb3nv4xu',
    limit: 10
  };
  this.init = function() {
    console.log('initalized');
    console.log(document.getElementById('header'));
    var Dom = new DOM();
    console.log(Dom.getE('header'))
    var client = new Client();
    client.search()
  }
}

var app = new App();
var worker = new Worker();
worker.installTo(app)

app.subscribe('start', function() {
  console.log('STARTED!!!!')
  this.client = new Client();
  this.dom = new DOM();
  this.dom.registerEvents()
});


// Start app
app.publish('start');

app.subscribe('search', function() {
  if(this.dom.elements.searchBox.value) {
    this.client.search(this.dom.elements.searchBox.value)
  }
});


// Client for handling API Calls
function Client(endpoint, params) {
  endpoint = endpoint || 'streams';
  params = params || {};

  this.url = 'https://api.twitch.tv/kraken/search/' + endpoint;
  this.search = function(query, options, cb) {
    var script = document.createElement('script');
    this.params.q = query;
    this.url = this.addParams();
    script.src = this.url;
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  this.searchCB = function(data) {
    console.log(data)
  }

  // Url Parameters

  this.params = {
    client_id: params.client_id || '86qz5at41ns04i6ma9dgqguhb3nv4xu',
    limit: params.limit || 5,
    callback: 'searchCB'
  };

  // Adds URL Parameters to API endpoint
  this.addParams = function() {
    return this.url + '?' + Object.keys(this.params).map(function(param) {
        return param + '=' + this.params[param]
      }, this).join('&');
  };
}

function DOM() {
  this.elements = {
    leftArrow: document.querySelector('#resultsHeader .arrow-left'),
    rightArrow: document.querySelector('#resultsHeader .arrow-right'),
    searchBox: document.getElementById('searchBox'),
    searchSubmit: document.querySelector('form[name="search"]'),
    results: document.getElementById('results')
  };
  this.registerEvents = function() {
    this.elements.searchSubmit.addEventListener('submit', function() {
      event.preventDefault();
      if(app) {
        app.publish('search');
      }
    }, false)
  }
}

function searchCB(data) {
  console.log(data)
}