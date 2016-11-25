(function() {

  'use strict';

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
  app.init();


  // Client for handling API Calls
  function Client(endpoint, params) {
    endpoint = endpoint || 'streams';
    params = params || {};

    this.url = 'https://api.twitch.tv/kraken/search/' + endpoint;
    this.search = function(query, options, cb) {
      console.log(this.addParams())
    };

    // Url Parameters
    this.params = {
      client_id: params.client_id || '86qz5at41ns04i6ma9dgqguhb3nv4xu',
      limit: params.limit || 5,
      callback: params.callback || null
    };

    // Adds URL Parameters to API endpoint
    this.addParams = function() {
      return this.url + '?' + Object.keys(this.params).map(function(param) {
        return param + '=' + this.params[param]
        }, this).join('&');
    };
  }

  function DOM() {
    this.getE = function getE(id) {
      return document.getElementById(id);
    }
  }



  // // Initialize variables
  // var App, Pager;
  //
  // App = {};
  //
  // // Set settings
  // App.settings = {
  //   client_id: '86qz5at41ns04i6ma9dgqguhb3nv4xu',
  //   limit: 10
  // };
  //
  // // Initialize function
  //
  // App.init = function() {
  //   console.log('Initialized')
  //    console.log(this)
  //   this.registerEvents();
  // };
  //
  // App.registerEvents = function() {
  //   console.log('event handlers added');
  // }
  //
  // App.init();



}());