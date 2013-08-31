WebSvr
==============
A simple web server, implement HttpModule(filter) and HttpHandler(servlet), autorecover user session when run into problems.

Lincenses: MIT

Features
--------------
- Auto recover: It may run into problems but it can restart and re-covery the user sessions automatically.
- Filter (Middleware):  A request will try to match all the filters first.
- Handler: When a request matched a handler, it will returned, only one handler will be executed.
- Session: Stored in file, with JSON format
- File: Support uploading files
- Cache: Client-cahce is supported.

Install
--------------

    npm install websvr


Start
--------------
It's simple to start the websvr.

    //import WebSvr module
    var WebSvr = require("websvr");

    //Start the WebSvr, runnting at parent folder, default port is 8054, directory browser enabled;
    //Trying at: http://localhost:8054
    var webSvr = new WebSvr({
        root: "./"
      , listDir:  true
      , debug:    true
    }).start();


Filter (HttpModule)
--------------
Session based authentication, basically useage:

    /*
    General filter: parse the post data / session before all request
      parse:   parse the post data and stored in req.body;
      session: init the session and stored in req.session; 
    */
    webSvr.filter(function(req, res) {
      //Link to next filter
      req.filter.next();
    }, {parse:true, session:true});

Advanced useage: All the request under "test/" will parse the post data and session by default, except the "index.htm" and "login.do"

    /*
    Session Filter: protect web/* folder => (validation by session);
    */
    webSvr.filter(/web\/[\w\.]+/, function(req, res) {
      //It's not index.htm/login.do, do the session validation
      if (req.url.indexOf("index.htm") < 0 && req.url.indexOf("login.do") < 0) {
        req.session.get("username", function(val){
          console.log("session", val);

          !val && res.end("You must login, first!");

          //Link to next filter
          req.filter.next();
        });
      } else {
          //Link to next filter
          req.filter.next();
      }
    });


Handler (HttpHandler, Servlet)
--------------
Handle Login and put the username in Session

    /*
    Handler: login.do => (validate the username & password)
      username: admin
      password: 12345678
    */
    webSvr.handle("login.do", function(req, res) {
      var qs = req.body;
      if (qs.username == "admin" && qs.password == "12345678") {
        //Put key/value pair in session
        req.session.set("username", qs.username, function(session) {
          res.redirect("/web/setting.htm");
        });
      }else{
        res.writeHead(401);
        res.end("Wrong username/password");
      }
    }, {parse: "qs"});


Template
--------------
Render template with params, using doT template engine

    res.render([view, ] model);

View is optional, in this case it will get the template path from req.url

    res.render({json: true});

View is a relative path, relative to root web dir

    res.render("list.tmpl", {json: true});

You can change template engine, etc: webSvr.engine(require("doT"));

    webSvr.engine(engineLib);



Settings
--------------
Return configuration of current WebSvr instance

    webSvr.settings

Settings API:

    var Settings = {
      //root folder of web
      root: "../"

      //http start
      //default port of http
      , port: 8054

      //default port of https
      , httpsPort:  8443
      , httpsKey:   ""
      , httpsCert:  ""

      //list files in directory
      , listDir: false
      //enable client-side cache(304)
      , cache: true
      //enable debug information output
      , debug: true
      //receive buffer,  default size 32k, etc: receive post data from ajax request
      , bufferSize: 32768

      //default pages, only one is supported
      , defaultPage: "index.html"

      //logger file path
      , logger:     os.tmpDir() + "/log.txt"

      /*
      Session timeout, in milliseconds.
      When session is expired, session file will not deleted.
      */
      , sessionTimeout: 1440000
      /*
      Session garbage collection time, in milliseconds.
      When session expired time is more than (sessionAge + sessionGCT),
      then session file will be unlinked.
      */
      , sessionGarbage: 3460000

      //session file stored here
      , sessionDir: os.tmpDir()

      //tempary upload file stored here
      , uploadDir:  os.tmpDir()
    };

Response
--------------
Extension on reponse object

Ouput file, relative path, relative to the web root

    res.writeFile(filePath, [callback]);

Ouput file, absolute path, relative to the server running 

    res.sendFile(filePath,  [callback]);

Reidrect request

    res.redirect(url);

Return request object

    res.req



WebSvr APIs
--------------
Mapping url to file

    webSvr.url("sitetest", ["svr/sitetest.js"]);

Mapping url to string

    webSvr.url("hello", "Hello WebSvr!")

Handle post

    webSvr.post("post.htm", function(req, res) {
        res.end('Received : ' + req.body);
    });

    //Equal to
    webSvr.handle("post.htm", function(req, res) {
        res.end('Received : ' + req.body);
    }, {parse: true});

Handle session

    webSvr.session("sessionrequire", function(req, res) {
        console.log(req.session);
        res.end();
    });


Handle upload file, it's a specfic filter

    webSvr.file("upload.do", function(req, res) {
      res.writeHead(200, {"Content-Type": "text/plain"});
      //Upload file is stored in req.files
      //form fields is stored in req.body
      res.write(JSON.stringify(req.body));
      res.end(JSON.stringify(req.files));
    });


Multi-instance support
--------------
Start a https server, make sure that the port will no conflict with others.

    var httpsSvr = new WebSvr({
        root: "./"

      //disable http server
      , port:      null

      //enable https server
      , httpsPort: 8443
      , httpsKey:  require("fs").readFileSync("svr/cert/privatekey.pem")
      , httpsCert: require("fs").readFileSync("svr/cert/certificate.pem")

    }).start();

Do you want to re-use the filters & handlers?

    httpsSvr.filters   = webSvr.filters;
    httpsSvr.handlers  = webSvr.handlers;




Demo Sites
----

1.  icalc: url [icalc.cn](http://icalc.cn),  source code [github](https://github.com/newghost/websvr-icalc/)















node-websvr
====
基于NodeJS的一个极简Web服务器, 专为ARM设计。
假设嵌入式设备需要保持长时间稳定运行，当遇到问题时也可自动重启并恢复此前用户的Session会话。
