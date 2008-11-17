/* appjet:version 0.1 */
import("storage");
import("dlog");
import("cron");
// import("lib-uuid");

var API = {
  LDR: {
    config: 'http://reader.livedoor.com/api/config/load',
    subs:   'http://reader.livedoor.com/api/subs',
    pins:   'http://reader.livedoor.com/api/pin',
    feed:   'http://reader.livedoor.com/api/unread?prefetch',
    touch:  'http://reader.livedoor.com/api/touch_all'
  },
  FLDR: {
    config: 'http://fastladder.com/api/config/load',
    subs:   'http://fastladder.com/api/subs',
    pins:   'http://fastladder.com/api/pin',
    feed:   'http://fastladder.com/api/unread?prefetch',
    touch:  'http://fastladder.com/api/touch_all'
  }
}

//var result = schedule(new Date("Nov 17, 2008"), "/touch");
//var result = scheduleRepeating(new Date("Nov 17, 2008"), 1440, "/wedata");
//unscheduleAll();
function cron_wedata(){
  try{
    var res = "(" + wget("http://wedata.net/databases/LDRFullFeed/items.json") + ")";
    storage.wedata = res;
  } catch(e){}
}

function get_wedata(){
  if(!storage.wedata)  storage.wedata = "(" + wget("http://wedata.net/databases/LDRFullFeed/items.json") + ")";
  print(!!storage.wedata);
}

var Template = {
  main: """
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link href="http://utatane.tea.googlepages.com/reader.css" rel="stylesheet" />
  <script type="text/javascript" src="http://utatane.tea.googlepages.com/iLDR.js"></script>
  <title>iReader</title>
</head>
<body>
  <div id="topbar" class="toolbar topBar">
    <h1 id="pageTitle">iReader</h1>
    <div id="pins" class="button indexButton"><span>Pin</span></div>
    <div id="subs" class="button indexButton"><span>Subs</span></div>
    <div id="config" class="button indexRightButton"><img src="http://utatane.tea.googlepages.com/cog.png" /></div>
    <div id="reload" class="button indexRightButton"><img src="http://utatane.tea.googlepages.com/arrow_refresh.png" /></div>
  </div>
  <div id="main">
  </div>
  <div id="overlay">
  </div>
  <div id="dialog">
    <span id="dialog_title"></span>
    <div id="dialog_content">
    </div>
  </div>
</body>
""",
  test: """
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link href="http://utatane.tea.googlepages.com/reader.css" rel="stylesheet" />
  <script type="text/javascript" src="http://utatane.tea.googlepages.com/test-iLDR.js"></script>
  <title>iReader</title>
</head>
<body>
  <div id="topbar" class="toolbar topBar">
    <h1 id="pageTitle">iReader</h1>
    <div id="pins" class="button indexButton"><span>Pin</span></div>
    <div id="subs" class="button indexButton"><span>Subs</span></div>
    <div id="config" class="button indexRightButton"><img src="http://utatane.tea.googlepages.com/cog.png" /></div>
    <div id="reload" class="button indexRightButton"><img src="http://utatane.tea.googlepages.com/arrow_refresh.png" /></div>
  </div>
  <div id="main">
  </div>
  <div id="overlay">
  </div>
  <div id="dialog">
    <span id="dialog_title"></span>
    <div id="dialog_content">
    </div>
  </div>
</body>
"""
}

var Unit = function(args, login){
  this.type = args.type;
  this.args = args;
  if(login){
    this.login = Unit[args.type];
  }
}

Unit.LDR = function(){
    var id = this.args.user_id,
        password = this.args.password;
        url = (this.args.mobile)? "https://member.livedoor.com/touch/login/index" : "http://member.livedoor.com/login/index";
    var req = wpost(url, {
      livedoor_id : id,
      password    : password
      }, {
      complete: true,
      followRedirects: false,
      headers: {
    }});
    var cookie = req.headers["Set-Cookie"];
    return (cookie && parse_cookie(cookie));
}

Unit.FLDR = function(){
    var id = this.args.user_id,
        password = this.args.password;
    var req = wpost("http://fastladder.com/login", {
      username    : id,
      password    : password
      }, {
      complete: true,
      followRedirects: false,
      headers: {
    }});
    var cookie = req.headers["Set-Cookie"];
    return (cookie && parse_cookie(cookie));
}

/*
Unit.prototype.GR = {
  check: function({user_id: id, password: pass}){
    storage.GR
    .filter({
      user_id: id,
      password: pass
    }).first();
    return (obj)? obj : null;
  },
  login: function(){
  },
}
Unit.prototype.OP = {
  login: function(){
  },
}
*/

Unit.isValid = function(args){
  var flag = false;
  if(args.type){
    switch(args.type){
      case 'LDR':
      case 'FLDR':
      case 'GR':
        if(args.user_id && args.password)
          flag = true;
        break;
      case 'OP':
        if(args.openid)
          flag = true;
        break;
    }
  }
  return flag;
}

function get_main(){
  // response.setHeader("Content-Type", "text/html");
  response.setContentType("text/html; charset=UTF-8");
  page.setMode('plain');
  response.setStatusCode(200);
  response.write(Template.main);
}

function post_config(){
  var cookie = request.params.cookie;
  var type   = request.params.type;
  var params = {
    timestamp: (new Date).getTime()
  }
  if(cookie && type && params){
    //response.setHeader("Content-Type", "text/plain");
    response.setContentType("text/plain; charset=UTF-8");
    response.setStatusCode(200);
    page.setMode('plain');
    var req = wpost(API[type]["config"], params ,{
      headers:{
        cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }});
    response.write(html("("+req+")"));
  }
}

function post_feed(){
  var cookie = request.params.cookie;
  var type   = request.params.type;
  var params = {
    ApiKey: request.params.ApiKey,
    subscribe_id: request.params.subscribe_id,
  }

  if(type == 'LDR')
    cookie = cookie + ';reader_sid=' + params.ApiKey;
  else if(type == 'FLDR'){
    var ex = extract_cookie(cookie);
    params.ApiKey = ex['reader_sid'];
  }
  if(cookie && type && params){
    //response.setHeader("Content-Type", "text/plain");
    response.setContentType("text/plain; charset=UTF-8");
    page.setMode('plain');
    response.setStatusCode(200);
    var req = wpost(API[type]["feed"],
      params
      ,{
      headers:{
        cookie: cookie,
    }});
    dlog.info(req);
    response.write("("+req+")");
  }
}

function post_subs(){
  var cookie = request.params.cookie;
  var type   = request.params.type;
  var params = {
    ApiKey: request.params.ApiKey,
  }

  if(type == 'LDR')
    cookie = cookie + ';reader_sid=' + params.ApiKey;
  else if(type == 'FLDR'){
    var ex = extract_cookie(cookie);
    params.ApiKey = ex['reader_sid'];
  }
  var query = ["unread", "from_id", "limit"]
    .map(function(n){
      return n + "=" + request.params[n];
    }).join("&");
  if(cookie && type && params && query){
    //response.setHeader("Content-Type", "text/plain");
    response.setContentType("text/plain; charset=UTF-8");
    page.setMode('plain');
    response.setStatusCode(200);
    var req = wpost(API[type]["subs"] + "?" + query,
      params
      ,{
      headers:{
        cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }});
    response.write("("+req+")");
  }
}

function post_pins(){
  var cookie  = request.params.cookie;
  var type    = request.params.type;
  var command = request.params.com;
  var params = {
    ApiKey: request.params.ApiKey,
  };
  switch(command){
    case 'add':
    params.title = request.params.title;
    case 'remove':
    params.link = request.params.link;
    if(type == 'LDR')
      cookie = cookie + ';reader_sid=' + params.ApiKey;
    else if(type == 'FLDR'){
      var ex = extract_cookie(cookie);
      params.ApiKey = ex['reader_sid'];
    }
    case 'all':
    break;
  }
  if(cookie && type && params && command){
    //response.setHeader("Content-Type", "text/plain");
    response.setContentType("text/plain; charset=UTF-8");
    page.setMode('plain');
    response.setStatusCode(200);
    var req = wpost(API[type]["pins"] + "/" + command,
      params
      ,{ headers:{
        "cookie": cookie,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      }});
    response.write("("+req+")");
  }
}

function get_pin(){
  print("now testing");
}

// XDomain Accessor for LDRFullFeed
// follow redirectの自主実装 => finalUrl
function post_access(){
  var url = trim(request.params["url"] || "");
  var res = {};
  if(url){
    var req = {};
    (function(){
      req = wget(url, {}, {
        complete: true,
        followRedirects: false
      });
      if(req.headers["Location"]){
        url = req.headers["Location"][0];
        arguments.callee();
      }
    })();
    response.setContentType("text/html; charset=UTF-8");
    var text = req.data, code = req.status;
    if(code >= 200 && code < 300){
      // remove iframes, handlers and object on the server side.
      var reg_handlers = /(<[^>]+?[\s"'])on(?:(?:un)?load|(?:dbl)?click|mouse(?:down|up|over|move|out)|key(?:press|down|up)|focus|blur|submit|reset|select|change)\s*=\s*(?:"(?:\\"|[^"])*"?|'(\\'|[^'])*'?|[^\s>]+(?=[\s>]|<\w))(?=[^>]*?>|<\w|\s*$)/gi;
      // var reg_risk = /<script[^>]*>[\S\s]*?<\/script\s*>|<\/?(?:i?frame|html|script|object)(?:\s*|\s+[^<>]+)>/gi;
      var reg_iframe = /<iframe(?:\s[^>]+?)?>[\S\s]*?<\/iframe\s*>/gi;
      text = text.replace(reg_handlers, "$1");
      text = text.replace(reg_iframe, "");
      // text = text.replace(reg_risk, "");
    }
    response.setStatusCode(code);
    page.setMode('plain');
    response.write('('+uneval({
      finalUrl: url,
      responseText: text
    })+')');
  }
}

function post_touch(){
  var cookie = request.params.cookie;
  var type   = request.params.type;
  var params = {
    ApiKey: request.params.ApiKey,
    subscribe_id: request.params.subscribe_id,
  }
  if(type == 'LDR')
    cookie = cookie + ';reader_sid=' + params.ApiKey;
  else if(type == 'FLDR'){
    var ex = extract_cookie(cookie);
    params.ApiKey = ex['reader_sid'];
  }
  if(cookie && type && params){
    response.setContentType("text/plain; charset=UTF-8");
    page.setMode('plain');
    response.setStatusCode(200);
    var req = wpost(API[type]["touch"],
      params
      ,{
      headers:{
        cookie: cookie,
    }});
    response.write("("+req+")");
  }
}

function post_login(){
  var args = {
    type     : trim(request.params["type"] || ""),
    user_id  : trim(request.params["id"] || ""),
    password : trim(request.params["password"] || ""),
    openid   : trim(request.params["openid"] || ""),
    mobile   : isMobile(request)
  }
  if(!Unit.isValid(args)) return;

  var unit = new Unit(args, true);
  var res = unit.login();
  if(res){
    response.setContentType("text/plain; charset=UTF-8");
    response.setStatusCode(200);
    page.setMode('plain');
    response.write(html("("+uneval({
      cookie: res,
      type  : args.type
      })+")"));
  } else {
    response.setContentType("text/plain; charset=UTF-8");
    response.setStatusCode(200);
    page.setMode('plain');
    response.write(html("("+uneval({
      cookie: 'ERROR',
      type  : 'ERROR'
      })+")"));
  }
}

function get_cron(){
  try{
      var res = "(" + wget("http://wedata.net/databases/LDRFullFeed/items.json") + ")";
      storage.wedata = res;
  } catch(e){}
  print(listAll());
  print("Wedata : " + !!storage.wedata);
}

function get_test(){
  // response.setHeader("Content-Type", "text/html");
  response.setContentType("text/html; charset=UTF-8");
  page.setMode('plain');
  response.setStatusCode(200);
  response.write(Template.test);
}

function post_wedata(){
    response.setContentType("text/plain; charset=UTF-8");
    response.setStatusCode(200);
    page.setMode('plain');
    if(storage.wedata){
      response.write(storage.wedata);
    } else {
      response.write('({ErrorCode: 1, isSuccess: 0})');
    }
}

function parse_cookie(cookie){
  var flag = true;
  if(!cookie) return null;
  cookie = cookie.map(function(line){
    var arr = line.split(";");
    return (arr)? arr[0] : (flag=false);
  }).join(";");
  return (flag)? cookie : null;
}

function extract_cookie(cookie){
  var obj = {};
  cookie.split(';')
    .forEach(function(line){
      var [key, val] = line.split('=')
      obj[trim(key)] = trim(val);
    });
  return obj
}

function isMobile(req){
var u = request.headers["User-Agent"];
if(u){
  return !!((~u.indexOf('AppleWebKit')) && (~u.indexOf('Mobile')));
}
return false;
}

dispatch();

/* appjet:css */
