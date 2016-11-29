/**
 *
 * Playstation Tech Challenge
 * Created by Joe Prempeh
 *
 */

/*
*
* Wraps script in IFFE to avoid polluting global namespace
*
* */
(function(){
  /*
  * The Worker class acts as a event emitting system.
  * It can publish and subscribe to events.
  *
  * @param {string} name - the name of the worker
  *
  * @returns {object} name, channels, publish, subscribe, install to
  * */
  function Worker(name) {
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
  }

  /*
  *
  * The App class acts as the main app.
  * It controls the Client and Dom modules by emitting and listening for events.
  * Therefore, the Client and DOM modules are loosely coupled.
  *
  * */
  function App() {
    this.settings = {
      client_id: '86qz5at41ns04i6ma9dgqguhb3nv4xu',
      limit: 5,
      page: 1
    };
  }

  /*
   *
   * The Client handles API calls to Twitch.
   * @params endpoint  - Twitch search endpoint
   * @params params    - URL Parameters
   *
   * @property url     - Twitch search url
   * @method search    - Appends JSONP script tag to document
   * @property params  - stores URL parameters
   * @method addParams - adds API parameters to URL
   * @searchCb
   * */
  function Client(endpoint, params) {
    endpoint = endpoint || 'streams';
    params = params || {};

    this.url = 'https://api.twitch.tv/kraken/search/' + endpoint;

    this.search = function(query) {
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

    // JSONP callback
    this.searchCb = function(data) {
      app.settings.totalPages = Math.ceil(data._total/app.settings.limit);
      app.publish('results', data)
    }
  }


  /*
   *
   * The DOM module handles all the DOM functionality.
   * @property el            - el stores all elements
   * @method registerEvents  - adds event listeners to DOM
   * @method makePages       - Parses JSON to pages
   * @method render          - Renders HTML
   * @method noResults       - Clears page if there are no results
   * */
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
          app.publish('search', {
            page: 1
          });
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
        var markup = results.map(function(result) {
          var resultHTML = '<div class="stream">';
          resultHTML += '<img src="' + result.preview.medium + '">'
          resultHTML += '<div class="content"><h3>' + result.channel.display_name + '</h3>';
          resultHTML += '<span class="result game">' + result.channel.game + ' - ' + result.viewers + ' viewers<br></span>';
          resultHTML += result.channel.status;
          resultHTML += '</div></div>';
          return resultHTML;
        });
        function renderImg(i) {
          var imageUrl = results[i].preview.medium;
          var img = new Image();
          img.onload = function() {
            this.el.results.innerHTML += markup[i];
            if (results.length > i + 1) {
              renderImg.call(this, ++i);
            }
          }.bind(this);
          img.src = imageUrl;
        }
        renderImg.call(this, 0)
      }
    };
    this.noResults = function() {
      this.el.resultsCount.textContent = 0;
      this.el.pages.textContent =  '0/0';
    }
  }

  /*
  *
  * Create new app and install worker functions
  * */
  var app = new App();
  var worker = new Worker();
  worker.installTo(app);

  /*
  * The app starts subscribing to events
  *
  * */

  // On start, the app will create a new client and DOM instance
  app.subscribe('start', function() {
    this.client = new Client();
    this.dom = new DOM();
    this.dom.registerEvents();
  });

  // On search, the app creates a new client and searchs
  app.subscribe('search', function(params) {
    if(params && params.hasOwnProperty('page')) {
      this.settings.page = params.page;
    }
    if(this.dom.el.searchBox.value) {
      this.client = new Client('streams', {
        limit: 5,
        offset: (this.settings.page - 1) * this.settings.limit
      });
      this.client.search(this.dom.el.searchBox.value)
    }
  });

  // previous page event
  app.subscribe('prevPage', function() {
    if(this.settings.page === 1) {
      return event.preventDefault();
    } else {
      this.settings.page -= 1;
      this.publish('search');
    }
  });

  // next page event
  app.subscribe('nextPage', function() {
    if(this.settings.page === this.settings.totalPages) {
      return event.preventDefault()
    } else {
      this.settings.page += 1;
      this.publish('search');
      event.preventDefault();
    }
  });

  // results event
  app.subscribe('results', function(data) {
    if(data._total > 0) {
      app.dom.makePages(data, {
        limit: app.settings.limit,
        page: app.settings.page || 1
      });
    } else {
      app.dom.noResults();
    }

  });

  // clear results event
  app.subscribe('clearResults', function() {
    this.dom.clearResults();
  });

  // Start app
  app.publish('start');

  // Bind callback to window
  window.searchCb = app.client.searchCb;
})(window);
