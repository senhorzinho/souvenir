var express = require('express'),
  app = express(),
  rest = require('./app/js/rest.js');

// configure Express
app.configure(function() {
  app.use(express.favicon());
  app.use(express.static(__dirname + '/app'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

// routes

/*                __                         __         __
   ____  ____  / /_   ____  ___  ___  ____/ /__  ____/ /
  / __ \/ __ \/ __/  / __ \/ _ \/ _ \/ __  / _ \/ __  /
 / / / / /_/ / /_   / / / /  __/  __/ /_/ /  __/ /_/ /
/_/ /_/\____/\__/  /_/ /_/\___/\___/\__,_/\___/\__,_/
                                                        */

/*app.all('*', function(req, res, next) {
  // console.log(req);
  res.header('Access-Control-Allow-Origin', '*.jopho.com');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  return next();
});*/

/*                                                __  _
   ____  ____     ____ ___  ____  ________     / /_(_)___ ___  ___
  / __ \/ __ \   / __ `__ \/ __ \/ ___/ _ \   / __/ / __ `__ \/ _ \
 / / / / /_/ /  / / / / / / /_/ / /  /  __/  / /_/ / / / / / /  __/
/_/ /_/\____/  /_/ /_/ /_/\____/_/   \___/   \__/_/_/ /_/ /_/\___/
                                                                   */

app.get('/twitter', function(req, res) {

  var username = req.query.user;
  var enddate = req.query.ey + '-' + req.query.em + '-' + req.query.ed;

  //never would have worked… twitter requires per-search oauth tokens
  //which also require https. ran out of time.
  var options = {
    host: 'api.twitter.com',
    path: '/1.1/search/tweets.json?q=%23' + username + '&result_type=popular&count=100&until=' + enddate,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  rest.getJSON(options, function(statusCode, results) {
    res.statusCode = statusCode;
    res.send(results);
  });

});

app.get('/flickr', function(req, res) {

  var username = req.query.user;
  var startdate = new Date(req.query.sy, req.query.sm - 1, req.query.sd, 0, 0, 0);
  var enddate = new Date(req.query.ey, req.query.em - 1, req.query.ed, 23, 59, 59);

  var useroptions = {
    host: 'api.flickr.com',
    path: '/services/rest/?method=flickr.people.findByUsername' + '&api_key=6ccf3ac4e38fcdc496798883300e8b6b' + '&username=' + username + '&format=json&nojsoncallback=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  rest.getJSON(useroptions, function(statusCode, result) {

    var usercode = result.user.nsid;
    var options = {
      host: 'api.flickr.com',
      path: '/services/rest/?method=flickr.photos.search' + '&api_key=6ccf3ac4e38fcdc496798883300e8b6b' + '&user_id=' + usercode + '&min_taken_date=' + Math.round(startdate.getTime() / 1000) + '&max_taken_date=' + Math.round(enddate.getTime() / 1000) + '&extras=date_taken&format=json&nojsoncallback=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    rest.getJSON(options, function(statusCode, results) {
      res.statusCode = statusCode;
      res.send(results);
    });

  });

});


/*
  / /__      __(_) /_____  (_)____   / /_  _________  / /_____  ____
 / __/ | /| / / / __/ __ \/ / ___/  / __ \/ ___/ __ \/ //_/ _ \/ __ \
/ /_ | |/ |/ / / /_/ /_/ / / /__   / /_/ / /  / /_/ / ,< /  __/ / / /
\__/ |__/|__/_/\__/ .___/_/\___/  /_.___/_/   \____/_/|_|\___/_/ /_/
                 /_/                                                 */
//I fail at recursive.
app.get('/twitpic', function(req, res) {

  var user = req.query.user;
  var startdate = new Date(req.query.sy, req.query.sm - 1, req.query.sd, 0, 0, 0);
  var enddate = new Date(req.query.ey, req.query.em - 1, req.query.ed, 23, 59, 59);

  var results = [];

  function getoptions(n) {
    var options = {
      host: 'api.twitpic.com',
      path: '/2/users/show.json?username=' + user + '?page=' + (n == 0 ? 0 : n),
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    return options;
  };

  rest.getJSON(getoptions(0), function(statusCode, result) {

    // number of pages to request in batches of 20 rounded up
    var pages = Math.ceil(result.photo_only_count / 20);
    console.log('number of pages: ' + pages);

    function repeater(p) {
      if (p <= pages) {
        console.log('start of if loop: ' + p);
        rest.getJSON(getoptions(p), function(statusCode, nextresult) {
          console.log('rest request ' + p + ' push to array');
          results.push(nextresult.images);
          console.log('current array ' + results);
          repeater(p + 1);
        });
      }
    };
    repeater(1);
  });

  res.statusCode = statusCode;
  res.send(results);

});

app.listen(9999);
console.log(new Date() + 'Node+Express server listening on port 9999');
