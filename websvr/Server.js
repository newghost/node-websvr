/*
* Description: Create a Web Server
* Author: Kris Zhang
* Licenses: MIT, GPL
*/
/*
* Define and Export WebSvr
*/
var WebSvr = module.exports = (function() {

  var server = function(options) {

    //Parameters
    //Count: How many files?
    var self = this,
        root,
        port;

    var i = 0;

    var fileHandler = function(req, res) {

      var url = req.url,
          hasQuery = url.indexOf("?");

      //fs.stat can't recognize the file name with querystring;
      url = hasQuery > 0 ? url.substring(0, hasQuery) : url;

      var fullPath = path.join(root, url);

      fs.stat(fullPath, function(err, stat) {

        //Consider as file not found
        if (err) return self.write404(res);

        //Is file? Open this file and send to client.
        if (stat.isFile()) {
          // "If-modified-since" not defined, mark it as 1970-01-01 0:0:0
          var cacheTime = new Date(req.headers["if-modified-since"] || 1);

          // The file is modified
          if (Settings.cache && stat.mtime <= cacheTime) {
            res.writeHead(304);
            res.end();
          // Else send "not modifed"
          } else {
            res.setHeader("Last-Modified", stat.mtime.toUTCString());
            writeFile(res, fullPath);
          }
        }

        //Is Directory? List all the files and folders.
        else if (stat.isDirectory()) {
          options.listDir
            ? ListDir.list(req, res, fullPath)
            : self.write403(res);
        }

      });
    };

    var requestHandler = function(req, res) {
      //Response may be shutdown when do the filter, in order not to cause exception,
      //Rewrite the write/writeHead functionalities of current response object
      var endFn = res.end;
      res.end = function() {
        //Execute old end
        endFn.apply(res, arguments);
        //Rewirte write/writeHead on response object
        res.write = res.writeHead = res.setHeader = function() {
          console.log("response is already end, response.write ignored!")
        };
      };

      res.writeFile = function(filePath, cb) {
        self.writeFile(res, filePath, cb);
      };

      //301/302 : move permanently
      res.redirect = function(url, status) {
        res.writeHead(status ? status : 302, { "Location": url });
        res.end();
      };

      //render template objects
      res.render = Template.render;

      //initial httprequest
      var filterChain = new FilterChain(function(){

        //if handler not match, send the request
        !Handler.handle(req, res) && fileHandler(req, res);

      }, req, res);

      //Hook FilterChain object on the request
      req.filter = filterChain;

      //Handle the first filter
      req.filter.next();
    };

    var writeFile = function(res, fullPath) {
      fs.readFile(fullPath, function(err, data) {
        if (err) {
          console.log(err);
          return;
        }
        res.setHeader("Content-Type", mime.lookup(fullPath));
        res.writeHead(200);
        res.end(data, "binary");
      });
    };

    //Explose API
    //Filter
    self.filter = Filter.filter;
    self.file = Filter.file;

    //Handler
    self.url = Handler.url;
    self.post = Handler.post;
    self.session = Handler.session;

    //Logger
    self.log = Logger.log;

    //Get a fullpath of a request
    self.getFullPath = function(filePath) {
      return path.join(root, filePath);
    };

    //Write file, filePath is relative path
    self.writeFile = function(res, filePath, cb) {
      filePath = path.join(root, filePath);
      fs.exists(filePath, function(exist) {
        if (exist) {
          writeFile(res, filePath);
          cb && cb(exist);
        }else{
          //If callback function doesn't exist, write 404 page;
          cb ? cb(exist) : self.write404(res);
        }
      });
    };

    self.write403 = function(res) {
      res.writeHead(403, {"Content-Type": "text/html"});
      res.end("Access forbidden!");
    };

    self.write404 = function(res) {
      res.writeHead(404, {"Content-Type": "text/html"});
      res.end("File not found!");
    };

    //Public: start http server
    self.start = function() {
      //Update the default value of Settings
      options = _.extend(Settings, options);

      root = options.root;
      port = parseInt(options.port);

      //Create http server
      if (options.http) {
        var httpSvr = http.createServer(requestHandler);
        httpSvr.listen(port);

        console.log("Http server running at"
          ,"Root:", root
          ,"Port:", port
        );

        self.httpSvr = httpSvr;
      }

      //Create https server
      if (options.https) {
        var httpsOpts = options.httpsOpts,
            httpsPort = options.httpsPort;

        var httpsSvr = https.createServer(httpsOpts, requestHandler);
        httpsSvr.listen(httpsPort);

        console.log("Https server running at"
          ,"Root:", root
          ,"Port:", httpsPort
        );

        self.httpsSvr = httpsSvr;
      }

      //diable console.log information
      if (!options.debug) {
        console.log = function(){};
      }

      /*
      init modules
      */
      //Start session garbage collection
      SessionManager.start();
    };

    //Public: close http server;
    self.close = function() {
      self.httpSvr && self.httpSvr.close();
      self.httpsSvr && self.httpsSvr.close();
    };

  };

  return server;

})();