/**
 *
 *
 *
 */

(function() {

})();

var settings = {
  limit: 10
};
var currentQuery = {};  // keys: query, page, totalPages

// elements
function getE(id) {
  return document.getElementById(id);
}

var searchBox = getE('searchBox');
var results = getE('results');
var paginationArrows = {
  left: document.querySelector('#resultsHeader .arrow-left'),
  right: document.querySelector('#resultsHeader .arrow-right')
};

var search = function() {
  if (!currentQuery.query) {
    return;
  }
  console.log(currentQuery.query)
  var baseApiUrl = 'https://api.twitch.tv/kraken/search/streams';
  var params = {
    client_id: '86qz5at41ns04i6ma9dgqguhb3nv4xu',
    limit: settings.limit,
    callback: 'getData',
    q: currentQuery.query,
    offset: (currentQuery.page - 1) * settings.limit
  };
  var url = baseApiUrl + '?' + Object.keys(params).map(function(param) {
      return param + '=' + params[param];
    }).join('&');

  console.log('querying ' + url);

  var script = document.createElement('script');
  script.src = url;
  document.getElementsByTagName('head')[0].appendChild(script);

  searchBox.value = '';
  if (event) event.preventDefault();
};


var registerEventHandlers = function() {
  paginationArrows.left.addEventListener('click', function() {
    if (currentQuery.page === 1) {
      // cant go left if already on page 1 of results
      return event.preventDefault();
    }
    currentQuery.page -= 1;
    search();
    event.preventDefault();
  });
  paginationArrows.right.addEventListener('click', function() {
    if (currentQuery.page === currentQuery.totalPages) {
      // cant go right when on last page of results
      return event.preventDefault();
    }
    currentQuery.page += 1;
    search();
    event.preventDefault();
  });
  document.querySelector('form').addEventListener('submit', function() {
    newQuery(searchBox.value);
  });
};

var newQuery = function(query) {
  currentQuery = {
    query: query,
    page: 1
  };
  search();
};

var init = function() {
  registerEventHandlers();
  newQuery('starcraft');
};
init();


function getData(data) {
  console.log('data', data);

  var resultCount = data._total || 0;
  (function renderResultsCount(count) {
    // Page results
    var resultsCountEl = document.getElementById('resultsCount');
    resultsCountEl.textContent = count;
  })(resultCount);

  currentQuery.totalPages = Math.ceil(resultCount / settings.limit);
  (function renderPagination(curPage, totalPages) {
    var paginationEl = getE('pagination');
    paginationEl.textContent = curPage + '/' + totalPages;

    paginationArrows.left.classList.remove('disabled');
    paginationArrows.right.classList.remove('disabled');
    if (curPage === 1) {
      paginationArrows.left.classList.add('disabled');
    }
    if (curPage === totalPages) {
      paginationArrows.right.classList.add('disabled');
    }
  })(currentQuery.page, currentQuery.totalPages);

  (function renderStreams(streams) {
    // waits for the preview image to load before rendering the markup for the following stream (series)
    results.innerHTML = '';
    streams = streams.map(function(stream) {
      // so the preview image can be changed to a different stream property easily
      stream.previewImage = stream.preview.medium;
      return stream;
    });
    var streamMarkup = streams.map(function(stream) {
      var resultHTML = '<div class="stream">';
      resultHTML += '<img src="' + stream.previewImage + '">'
      resultHTML += '<div class="content"><h3>' + stream.channel.display_name + '</h3>';
      resultHTML += '<span class="result game">' + stream.channel.game + ' - ' + stream.viewers + ' viewers<br></span>';
      resultHTML += stream.channel.status;
      resultHTML += '</div></div>';
      return resultHTML;
    });
    (function renderIndividualStream(index) {
      // renders streams in series by waiting for preview image to load before rendering markup for that stream
      var imageUrl = streams[index].previewImage;
      var img = new Image();
      img.onload = function() {
        results.innerHTML += streamMarkup[index];

        if (streams.length > index + 1) {
          renderIndividualStream(++index);
        }
      };
      img.src = imageUrl;
    })(0);
  })(data.streams);

};


