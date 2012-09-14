
/*
Main.js
Listenening on parent folder
*/
var webSvr = new WebSvr("./../", 8054);
webSvr.start();

/*
UrlMapper example: close server
http://localhost:8054/admin/close
*/
webSvr.url(/admin\/close/g, function(req, res){
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("server is closed");
  webSVr.close();
});

/*
Map build.txt to tool/Combine.js
try it at: http://localhost:8054/build.txt
*/
webSvr.url(/build.txt/, ["node-websvr/tool/Combine.js"]);

/*
Map post.htm, and parse the post data on the request;
try it at: http://localhost:8054/post.htm
*/
webSvr.post(/post.htm/, function(req, res, data){
  res.write('<form action="" method="post">')
  res.write('<input name="input" />')
  res.write('</form><br/>');
  res.end(data);
});
