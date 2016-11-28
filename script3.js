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

  var destroy = function(channel, fn) {
    if(worker.channel[channel]) { worker.channels[channel] = []}
  }

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
    limit: 5,
    page: 1
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
  if(this.dom.el.searchBox.value) {
    this.client = new Client('streams', {
      limit: 5,
      offset: (this.settings.page - 1) * this.settings.limit
    });
    this.client.search(this.dom.el.searchBox.value)
  }
});

app.subscribe('prevPage', function() {
  if(this.settings.page === 1) {
    console.log('cant go left')
    return event.preventDefault();
  } else {
    this.settings.page -= 1;
    this.publish('search')
  }
});

app.subscribe('nextPage', function() {
  if(this.settings.page === this.settings.totalPages) {
    return event.preventDefault()
  } else {
    this.settings.page += 1;
    this.publish('search')
    console.log('next')
    event.preventDefault();
  }
});

app.subscribe('results', function(data) {
  app.dom.makePages(data, {
    limit: app.settings.limit,
    page: app.settings.page || 1
    // totalPages:
  });
});

app.subscribe('clearResults', function() {
  this.dom.clearResults();
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

  // Url Parameters

  this.params = {
    client_id: params.client_id || '86qz5at41ns04i6ma9dgqguhb3nv4xu',
    limit: params.limit || 5,
    callback: 'searchCb',
    offset: params.offset || 0
  };

  // Adds URL Parameters to API endpoint
  this.addParams = function() {
    return this.url + '?' + Object.keys(this.params).map(function(param) {
        return param + '=' + this.params[param]
      }, this).join('&');
  };
}

function DOM() {
  this.el = {
    leftArrow: document.querySelector('#resultsHeader .arrow-left'),
    rightArrow: document.querySelector('#resultsHeader .arrow-right'),
    searchBox: document.getElementById('searchBox'),
    searchSubmit: document.querySelector('form[name="search"]'),
    results: document.getElementById('results'),
    resultsCount: document.getElementById('resultsCount'),
    pages: document.getElementById('pages')
  };

  this.registerEvents = function() {
    /*
    *
    * Submit a search
    *
    * */
    this.el.searchSubmit.addEventListener('submit', function() {
      event.preventDefault();
      if(app) {
        app.publish('search');
      }
    }, false)
    /*
    *
    * Go left
    * */
    this.el.leftArrow.addEventListener('click', function(){
      event.preventDefault();
      app.publish('prevPage');
    });
    /*
    *
    * Go right
    *
    * */
    this.el.rightArrow.addEventListener('click', function() {
      event.preventDefault();
      app.publish('nextPage');
    })
  };
  this.makePages = function(data, settings) {
    var total,
    totalPages;

    total = data._total || 0;

    totalPages = Math.ceil(total/settings.limit);

    // Update results count
    this.el.resultsCount.textContent = data._total || 0;
    // Update pages
    this.el.pages.textContent = settings.page + '/' + totalPages;

    // Clear results
    this.el.results.innerHTML = '';

    //
    this.render(data.streams);


  };
  this.render = function(results) {
    if(Array.isArray(results)) {
      console.log(results)
      var markup = results.map(function(result) {
        console.log(result)
        var resultHTML = '<div class="stream">';
        resultHTML += '<img src="' + result.preview.medium + '">'
        resultHTML += '<div class="content"><h3>' + result.channel.display_name + '</h3>';
        resultHTML += '<span class="result game">' + result.channel.game + ' - ' + result.viewers + ' viewers<br></span>';
        resultHTML += result.channel.status;
        resultHTML += '</div></div>';
        return resultHTML;
      });
      function renderImg(i) {
        console.log(results[i])
        var imageUrl = results[i].preview.medium;
        var img = new Image();
        img.onload = function() {
          this.el.results.innerHTML += markup[i];
          if (results.length > i + 1) {
            renderImg.call(this, ++i);
          }
        }.bind(this)
        img.src = imageUrl;
      }
      renderImg.call(this, 0)
    }
  };
}

function searchCb(data) {
  app.settings.totalPages = Math.ceil(data._total/app.settings.limit);
  // app.publish('clearResults')
  app.publish('results', data)
}