/*
 *  @name        iRead.js
 *  @version     0.0.1
 *  @author      Constellation
 *  @description ajax feed reader for LDR & FLDR frontend.
 *               working on iphone and ipod touch.
 *
 *  using [ simple version of $X   ] (c) id:os0x
 *        [ relativeToAbsolutePath ] (c) id:Yuichirou
 *  thanks
 */

var iRead = function(){};
iRead.VERSION = '0.0.1';

// Object
Object.prototype.keys = function(){
  var ret = [];
  for(var i in this) if(this.hasOwnProperty(i)) ret.push(i);
  return ret;
}

Object.prototype.values = function(){
  var ret = [];
  for(var i in obj) ret.push(obj[i]);
  return ret;
}

Object.prototype.forEach = function(f, t){
  this.keys().forEach(function(key, index){
    f.call(t || this, this[key], key, this);
  }, this);
}

Object.prototype.map = function(f, t){
  return this.keys().map(function(key){
    return f.call(t || this, this[key], key, this);
  }, this);
}

Object.prototype.filter = function(f, t){
  return this.keys().filter(function(key){
    return f.call(t || this, this[key], key, this);
  }, this);
}

Object.update = function(c, o, exclude){
  for(var i in o)
    if(o.hasOwnProperty(i) && (!exclude || !~exclude.indexOf(i))) c[i] = o[i];
  return c;
}

// Array
Array.prototype.reduce = function(f, s){
  var a = iRead.$A(this);
  s = s? f(s, a.shift(), 0) : a.shift();
  a.forEach(function(e, r){
    s = f(s, e, ++r);
  });
  return s;
}
Array.prototype.uniq = function(){
  return this.reduce(function(e, r){
    !~e.indexOf(r) && e.push(r);
    return e;
  }, []);
}
Array.prototype.flatten = function(){
  var ret = [];
  var f = function(arr){
    arr.forEach(function(e){
      iRead.isArray(e)? f(e) : ret.push(e);
    });
  }
  f(this);
  return ret;
}

Array.times = function(n, f){
  for (var i = 0; i < n; i++) f(n);
}

// static values
iRead.api = {
  url:    'http://reader.appjet.net/',
};
// iRead API
['config', 'subs', 'pins', 'feed', 'login', 'access', 'touch', 'wedata']
.forEach(function(name){
  iRead.api[name] = iRead.api.url+name;
});
iRead.error = {
  'api'    : new Error('API Error'),
  'html'   : new Error('HTML Parse Error'),
  'line'   : new Error('Network Connection Error'),
  'login'  : new Error('Login Error'),
  'fatal'  : new Error('Fatal Error')
}

// utility functions
iRead.Class = function(cl, pr){
  var ret = (cl.initialize)? cl.initialize : function(){};
  pr && (ret.prototype = pr);
  for(var i in cl){
    if(typeof(ret[i]) != 'undefined' || i == 'init') continue;
    ret[i] = cl[i]
  }
  return ret;
}
iRead.isString = function(obj){
  return (typeof obj == 'string' || obj instanceof String);
}
iRead.isNumber = function(obj){
  return (typeof obj == 'number' || obj instanceof Number);
}
iRead.isElement = function(obj){
  return (!!obj.nodeType);
}
iRead.isFunction = function(obj){
  return (typeof obj == 'function');
}
iRead.isArray = function(obj){
  return (obj instanceof Array);
}
iRead.isRegExp = function(obj){
  return (obj instanceof RegExp);
}
iRead.isDate = function(obj){
  return (obj instanceof Date);
}
iRead.$ = function(id){
  return (id in iRead.$.hash && iRead.$.hash[id])? iRead.$.hash[id] : (iRead.$.hash[id] = document.getElementById(id));
}
iRead.$.hash = {};
iRead.$N = function(name, attrs, childs){
  var ret = document.createElement(name), value, attr;
  for (attr in attrs){
    if(!attrs.hasOwnProperty(attr)) continue;
    value = attrs[attr];
    (attr == 'class')? ret.className = value : ret.setAttribute(attr, value);
  }
  (iRead.isString(childs))
    ? ret.appendChild(document.createTextNode(childs))
    : (iRead.isArray(childs)) && childs.forEach(function(child){
      (iRead.isString(child))
        ? ret.appendChild(document.createTextNode(child))
        : ret.appendChild(child);
      });
  return ret;
}
iRead.$T = function(text){
  return document.createTextNode(text);
}
// delete
iRead.$D = function(elm){
  var range = document.createRange();
  range.selectNodeContents(elm);
  range.deleteContents();
  range.detach();
}
// remove
// reuse elements => available
iRead.$d = function(elm){
  var range = document.createRange();
  range.selectNodeContents(elm);
  var df = range.extractContents();
  iRead.$A(df.childNodes).forEach(function(e){
    iRead.$R(e);
  });
  range.insertNode(df);
  range.detach();
  return elm;
}
iRead.$R = function(elm){
  return elm.parentNode.removeChild(elm);
}

iRead.$DF = function(){
  return document.createDocumentFragment();
}
iRead.$A = function(a){
  return Array.prototype.slice.call(a);
}
// simple version of $X
// $X(exp);
// $X(exp, context);
// @source http://gist.github.com/3242.txt
iRead.$X = function(exp, context) {
  context || (context = document);
  var expr = (context.ownerDocument || context).createExpression(exp, function (prefix) {
    return document.createNSResolver(context.documentElement || context).lookupNamespaceURI(prefix) ||
      context.namespaceURI || document.documentElement.namespaceURI || "";
  });

  var result = expr.evaluate(context, XPathResult.ANY_TYPE, null);
    switch (result.resultType) {
      case XPathResult.STRING_TYPE : return result.stringValue;
      case XPathResult.NUMBER_TYPE : return result.numberValue;
      case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        // not ensure the order.
        var ret = [], i = null;
        while (i = result.iterateNext()) ret.push(i);
        return ret;
    }
  return null;
}

iRead.hideUrlBar = function(){
  var id = setTimeout(function() {
    clearTimeout(id);
    window.scrollTo(0, 1);
  }, 0);
}

iRead.ready = function(){
  this.db = openDatabase('reader', '1.0', 'Database for iRead');
  this.$CF = function(text){
    return iRead.$CF.range.createContextualFragment(text);
  }
  this.$CF.range = document.createRange()
  this.$CF.range.selectNode(document.body);
  this.body = document.body;
  this.head = document.getElementsByTagName('head')[0];
  this.login_form = iRead.$CF('<form id="login"><fieldset>id<input type="text" value="" name="reader_id" />pass<input type="password" value="" name="reader_password" /><div><select name="reader_type" size=3><option value="LDR">LDR<option value="FLDR">FLDR</select></div><input type="button" value="Login" onclick="(function(){ iRead.start() })();" /><input type="button" value="DELETE" onclick="(function(){ iRead.del() })();" /></fieldset></form>').firstChild;
  this.hideUrlBar();
  // Connect
  this.Event.connect("orientationchange", this.hideUrlBar, window, false);
  this.Event.connect("click", function(){
    !(iRead.View.mode == 'subs') && iRead.View.show_subs();
  }, this.$('subs'), false);
  this.Event.connect("click", function(){
    !(iRead.View.mode == 'pins') && iRead.View.show_pins();
  }, this.$('pins'), false);
  this.Event.connect("click", function(){
    iRead.View.reload();
  }, this.$('reload'), false);
  this.Event.connect("click", function(){
    iRead.View.config();
  }, this.$('config'), false);
  // for PC Safari debuging and testing
  this.Event.connect('keypress', function(e){
    var code= e.keyCode || e.charCode;
    var key = String.fromCharCode(code);
    switch(key){
      case 'j':
        iRead.View.next();
        break;
      case 'k':
        iRead.View.prev();
        break;
      case 't':
        iRead.View.touch();
        break;
      case 'p':
        iRead.View.show_pins();
        break;
      case 's':
        iRead.View.show_subs();
        break;
    }
  }, window, false);
}

// iRead Event
iRead.Event = {
  signals: {},
  connect: function(event, slot, target, cap){
    var sig = new this.signal(event, slot, target, cap);
    return this._connect(sig);
  },
  _connect: function(sig){
    if(sig.dom){
      if(sig.event != 'unload' || sig.cap){
        sig.target.addEventListener(sig.event, sig.slot, sig.cap);
      } else {
        sig.target.addEventListener('unload', function(ev){
          sig.target.removeEventListener('unload', arguments.callee, false);
          sig.slot.call(this, ev);
        }, false);
      }
    }
    var list = this.signals[sig.event];
    if(list){
      list.push(sig);
    } else {
      this.signals[sig.event] = [];
      this.signals[sig.event].push(sig);
    }
    return sig;
  },
  disconnect: function(event, slot, target, cap){
    var list = this.detect(event, target), signal = null;
    if(list.some(function(sig){
      if(sig.slot == slot && sig.cap == (!!cap))
        return (signal = sig);
    })){
      this._disconnect(signal);
    }
    return signal;
  },
  _disconnect: function(sig){
    if(sig.dom){
      sig.target.removeEventListener(sig.event, sig.slot, sig.cap);
    }
    var list = this.signals[sig.event];
    if(list){
      var index = list.indexOf(sig)
      if(index != -1) list.splice(index, 1);
    }
    return sig;
  },
  // (event, target, arguments...)
  fire: function(){
    var args = Array.slice(arguments), target, event, list;
    event = args.unshift();
    target = args.unshift();
    return this.detect(event, target)
    .map(function(sig){
      sig.slot.apply(target, args);
      return sig;
    });
  },
  detect: function(event, target){
    var list = this.signals[event];
    return (list)? list.filter(function(sig){
      return (sig.target == target);
    }) : [];
  },
  signal: function(event, slot, target, cap){
    this.event = event;
    this.slot = slot;
    this.dom = (!!target.addEventListener);
    this.target = target || window;
    this.cap = (!!cap);
  }
}

iRead.Ready = {
  list: [],
  add: function(obj){
    this.list.push(obj);
    return obj;
  },
  remove: function(obj){
    var index = this.list.indexOf(obj);
    if(!(index == -1)){
      return this.list.splice(index, 1);
    }
  },
  start: function(){
    this.list.forEach(function(obj){
      obj.ready && obj.ready();
    });
  }
}

iRead.Ready.add(iRead);
iRead.LocalConfig = {};

// iRead
iRead.load = function(){
  this.Dialog.message({
    message: 'checking login info...',
    title  : 'Loading'
  });
  SQL(this.db, function(tr){
    tr.createTable('config', {key: 'TEXT', value: 'TEXT'});
    tr.selectAll('config')
      .add(function(arr){
        var tr = arr[0];
        var result = arr[1];
        this.LocalConfig = {};
        for(var i = 0, l = result.rows.length; i < l; i++){
          var row = result.rows.item(i);
          var key = SQL.unescapeSQL(row.key);
          var value = SQL.unescapeSQL(row.value);
          if(key && value) this.LocalConfig[key] = value;
        }
      }, this);
  }, this)
  .add(function(){
    this.cookie = this.LocalConfig["cookie"];
//    this.apikey = this.LocalConfig["apikey"];
    this.type   = this.LocalConfig["type"];
    if(!this.cookie || !this.type) throw iRead.error.login;
    this.Config = new iRead.ConfigManager(this.LocalConfig);
    this.Cookie.create(this.cookie);
    // get config and all contents
    this.Dialog.message({
      message: 'loading original config...',
      title  : 'Loading'
    });
    return Chain.list([
      this.API.config()
      .add(function(res){
        this.Dialog.message({
          message: 'loading pins and feeds...',
          title  : 'Loading'
        });
        return Chain.hash({
          pins  : this.API.pins(),
          feeds : this.API.feeds()
        })
      }, this)
      .error(function(e){
        console.info(e);
        throw e;
      })
      .add(function(hash){
        if(hash.pins[0] && hash.feeds[0]) return true;
        else  throw iRead.error.login;
      }),
      this.API.fullfeed()
    ])
    .add(function(list){
      if(list[0][0] && list[1][0]){
        this.Dialog.message({
          message: 'done',
          title  : 'Loading',
          time   : 0.5
        });
        // this.List.show(true);
        this.View.start();
      }
      else throw iRead.error.login;
      // and start
    }, this);
  }, this)
  .error(function(e){
    if(e == iRead.error.login) this.login();
    else throw e;
  }, this);
}

// iRead Start
iRead.start = function(){
  if(this.start.flag) return;
  else this.start.flag = true;
  this.Dialog.hide();
  var form = this.$('login');
  return XHR(this.api.login, {
    method: 'POST',
    data  : {
      type    : form.reader_type.value,
      id      : form.reader_id.value,
      password: form.reader_password.value
    }
  })
  .add(function(res){
    var obj = eval(res.responseText);
    var cookie = obj.cookie, type = obj.type;
//    var apikey = obj.apikey;
    if(cookie == 'ERROR') throw iRead.error.login;
    return SQL(this.db, function(tr){
      tr.del('config', {'key': 'cookie'});
      tr.del('config', {'key': 'type'  });
//      tr.del('config', {'key': 'apikey'});
      tr.insert('config', {'key': 'cookie', 'value': cookie});
      tr.insert('config', {'key': 'type',   'value': type  });
//      tr.insert('config', {'key': 'apikey', 'value': apikey});
    }, this);
  }, this)
  .add(function(res){
    this.start.flag = false;
    this.load();
  }, this)
  .error(function(e){
    this.start.flag = false;
    alert(e);
    this.load();
  });
}
iRead.start.flag = false;

iRead.login = function(){
  this.Dialog.create(this.login_form.cloneNode(true), 'Login');
  this.Dialog.show();
}

iRead.logout = function(){
  return SQL(this.db, function(tr){
    tr.del('config', {'key': 'cookie'});
    tr.del('config', {'key': 'type'  });
//    tr.delAll('config');
  })
  .add(function(){
    return this.View.clear();
  }, this)
  .add(function(){
    this.load();
  }, this);
}

iRead.Dialog = {
  create: function(element, title){
    // iRead.$D(this.content);
    iRead.$D(this.content);
    title && (this.title.innerHTML = title);
    this.content.appendChild(element);
  },
  show: function(){
    this.overlay.style.height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) + 'px';
    this.overlay.style.display = 'block';
    this.main.style.top = (window.scrollY + 50) + 'px';
    this.main.style.opacity = '0.6';
    this.main.style.display = 'block';
  },
  hide: function(){
    return Chain.loop(6, function(){
      this.main.style.opacity -= 0.1;
      return Chain.later(0.005);
    }, this)
    .add(function(){
      this.main.style.display = 'none';
      this.overlay.style.display = 'none';
    }, this)
    .error(function(e){
      console.info(e);
    });
  },
  _message: iRead.$N('div', {'class': 'message'}),
  message: function(obj){
    if(obj.message){
      var content = this._message.cloneNode();
      content.appendChild(iRead.$T(obj.message));
      this.create(content, obj.title || null);
    }
    obj.time || (obj.time = 0);
    var ret = Chain.add(function(){
      iRead.Dialog.show();
    });
    if(obj.time){
      ret.later(obj.time)
        .add(function(){
          iRead.Dialog.hide();
        });
    }
    return ret;
  },
  ready: function(){
    this.main = iRead.$('dialog');
    this.title = iRead.$('dialog_title');
    this.content = iRead.$('dialog_content');
    this.overlay = iRead.$('overlay');
  }
}
iRead.Ready.add(iRead.Dialog);

iRead.ConfigManager = new iRead.Class({
  initialize: function(config){
    config.forEach(function(val, key){
      this.set(key, val);
    }, this);
    this.states = {
      save: false,
    };
    this.signals = [];
  },
  // from FLDR Source
  type: {
    keep_new       : 'Boolean',
    show_all       : 'Boolean',
    use_autoreload : 'Boolean',
    use_wait       : 'Boolean',
    use_pinsaver   : 'Boolean',
    use_scroll_hilight: 'Boolean',
    use_prefetch_hack : 'Boolean',
    use_clip_ratecopy : 'Boolean',
    use_instant_clip_ratecopy : 'Boolean',
    reverse_mode   : 'Boolean',
    use_inline_clip : 'Boolean',
    use_limit_subs  : 'Boolean',
    default_public_status : 'Boolean',
    current_font   : 'Number',
    autoreload     : 'Number',
    scroll_px      : 'Number',
    wait           : 'Number',
    max_pin        : 'Number',
    max_view       : 'Number',
    items_per_page : 'Number',
    prefetch_num   : 'Number',
    use_instant_clip : 'Number',
    limit_subs     : 'Number',
    view_mode      : 'String',
    sort_mode      : 'String',
    touch_when     : 'String',
    scroll_type    : 'String'
  },
  setable_config: [
    {
      key: 'touch_when',
      text:'When to mark a feed as read',
      type: 'select',
      data: [
        ['Immediately after loading', 'onload'],
        ['When moving to the next feed', 'onclose'],
//        ['When marked as read', '']
      ]
    },
    {
      key: 'prefetch_num',
      text: 'Prefetching',
      type: 'select',
      data: [
        ['default', 2],
        ['1', 1],
        ['2', 2],
        ['3', 3],
        ['4', 4],
        ['5', 5]
      ]
    },
    {
      key: 'sort_mode',
      text: 'Sort mode',
      type: 'select',
      data: [
        ['New', 'modified_on'],
        ['Old', 'modified_on:reverse'],
        ['Unread items (desc.)', 'unread_count'],
        ['Unread items (asc.)', 'unread_count:reverse'],
        ['Title', 'title:reverse'],
        ['Rating', 'rate'],
        ['Subscribers (desc.)', 'subscribers_count'],
        ['Subscribers (asc.)', 'subscribers_count:reverse']
      ]
    },
    {
      key: 'reverse_mode',
      text: 'Sort order',
      type: 'select',
      data: [
        ['New articles first', false],
        ['Old articles first', true]
      ]
    },
    {
      key: 'max_view',
      text: 'Number of new articles per page',
      type: 'input',
      data: 'articles (max: 200)'
    },
    {
      key: 'view_mode',
      text: 'View Mode',
      type: 'select',
      data: [
        ['Flat', 'flat'],
        ['Folder', 'folder'],
        ['Rating', 'rate'],
        ['Subscribers', 'subscribers'],
      ]
    },
    //{
    //  key: 'limit_subs',
    //},
    {
      type: 'box',
      data: [
        {
          key: 'use_limit_subs',
          text: 'Limit Number of My Feeds',
          type: 'select',
          data: [
            ['Set limit', true],
            ['Display all', false],
          ]
        },
        {
          key: 'limit_subs',
          text: 'Number of My Feeds to show',
          type: 'input',
          data: 'feeds'
        }
      ]
    },
    {
      type: 'box',
      data: [
        {
          type: 'button',
          text: 'save',
          slot: function(e){
            iRead.Config.save();
          },
        },
        {
          type: 'button',
          text: 'cancel',
          slot: function(e){
            iRead.Config.cancel();
          },
        },
        {
          type: 'button',
          text: 'log out',
          slot: function(e){
            iRead.logout();
          },
        }
      ]
    }
  ],
  convert: function(val, type){
    switch(type){
      case 'Number':
        val = val - 0;
        break
      case 'Boolean':
        val = (val == 'true');
        break;
      case 'String':
        val = val + '';
        break;
    }
    return val;
  }
  }, {
  //default config
  "max_view" : 20,
  set: function(key, val){
    var type = iRead.ConfigManager.type;
    if(type[key]){
      val = iRead.ConfigManager.convert(val, type[key]);
    }
    this[key] = val;
    return this;
  },
  create: function(){
    var form = iRead.$N('form', {id: 'config_form'});
    var fieldset = iRead.$N('fieldset');
    var df = iRead.$DF();

    iRead.ConfigManager.setable_config.forEach(function(data){
      var element = this['create_'+data.type](data);
      df.appendChild(element);
    }, this);
    fieldset.appendChild(df);
    form.appendChild(fieldset);
    this.form = form;
    iRead.Dialog.create(form, 'Config');
    iRead.Dialog.show();
  },
  clear_signal: function(){
    this.signals.forEach(function(sig){
      iRead.Event._disconnect(sig);
    });
  },
  save: function(){
    if(this.states.save) return false;
    this.states.save = true;
    this.clear_signal();
    var self = this;
    var form = this.form;
    return SQL(iRead.db, function(tr){
      function setter(data){
        var key = data.key;
        if(!key){
          if(data.type == 'box'){
            return data.data.forEach(setter);
          } else {
            return;
          }
        }
        var val = form[key].value;
        if(key && val){
          self.set(key, val);
          tr.del('config', {'key': key});
          tr.insert('config', {'key': key, 'value': val});
        }
      }
      iRead.ConfigManager.setable_config.forEach(setter);
    })
    .error(function(e){
      console.info(e);
      console.info('SQL Error');
    })
    .add(function(){
      iRead.Dialog.hide();
      this.states.save = false;
      iRead.View.reload();
      console.info('Config Set');
    }, this)
    .error(function(e){
      console.info(e);
    });
  },
  cancel: function(){
    this.clear_signal();
    iRead.Dialog.hide();
    return iRead.View.reload();
  },
  // need to refactor
  create_select: function(data){
    var div = iRead.$N('div', {'class': 'config_item config_select'}, [
      iRead.$N('span', {}, data.text),
      iRead.$N('select', {'name': data.key}, data.data.map(function(d){
         var option = iRead.$N('option', {'value': d[1]}, d[0]);
         if(this[data.key] == d[1]) option.selected = true;
         return option;
       }, this)),
    ]);
    return div;
  },
  create_radio: function(data){
    var div = iRead.$N('div', {'class': 'config_item config_radio'}, [
      iRead.$N('span', {}, data.text),
      data.data.map(function(d){
        var radio = iRead.$N('input', {type: 'radio', 'name': data.key, value: d[1]});
        if(this[data.key] == d[1]) radio.checked = true;
        return [radio, d[0]];
      }, this)
      ].flatten()
    );
    return div;
  },
  create_input: function(data){
    var div = iRead.$N('div', {'class': 'config_item config_input'}, [
      iRead.$N('span', {}, data.text),
      iRead.$N('input', {type: 'text', value: this[data.key], name: data.key}),
      iRead.$N('span', {}, data.data)
      ]);
    return div;
  },
  create_button: function(data){
    var div = iRead.$N('div', {'class': 'config_item config_button'});
    var button = iRead.$N('input', {type: 'button', value: data.text});
    this.signals.push(iRead.Event.connect('click', data.slot, button, false));
    div.appendChild(button);
    return div;
  },
  create_box: function(data){
    var div = iRead.$N('div', {'class': 'config_item config_box'}, (data.data.map(function(d){ return this['create_'+d.type](d) }, this)));
    return div;
  },
});

// iRead API
iRead.API = {
  // functions for loading
  feeds: function(){
    var list = [];
    var tmp = [];
    var use_limit = iRead.Config.use_limit_subs;
    function request(from_id, limit){
      return XHR(iRead.api.subs, {
            method: 'POST',
            data  : {
              ApiKey   : iRead.Config.ApiKey,
              type     : iRead.type,
              cookie   : iRead.cookie,
              unread   : (iRead.Config["show_all"]? 0 : 1),
              from_id  : from_id,
              limit    : limit
      }})
      .add(function(res){
        tmp = eval(res.responseText);
        list = list.concat(tmp);
        if(use_limit) return list;
        if(tmp.length < limit){
          return list;
        } else {
          var next = 200;
          var last = tmp[tmp.length-1];
          var from_id = last.subscribe_id;
          return request(from_id, next);
        }
      });
    }

    return request(0, iRead.Config.limit_subs)
    .add(function(arr){
      this.List.set(arr);
    }, iRead)
    .error(function(e){
      console.info(e);
      throw iRead.error.api;
    });
  },
  config: function(){
    return XHR(iRead.api.config, {
      method: 'POST',
      data  : {
        type     : iRead.type,
        cookie   : iRead.cookie
    }})
    .add(function(res){
      var config = eval(res.responseText);
      config.forEach(function(val, key){
        if(!(key in this.Config)) this.Config.set(key, val);
      }, this);
    }, iRead)
    .error(function(e){
      console.info(e);
      throw iRead.error.api;
    });
  },
  pins: function(){
    return XHR(iRead.api.pins, {
      method: 'POST',
      data  : {
        ApiKey   : iRead.Config.ApiKey,
        type     : iRead.type,
        cookie   : iRead.cookie,
        com      : 'all'
    }})
    .add(function(res){
      this.Pin.set(res.responseText);
    }, iRead)
    .error(function(e){
      console.info(e);
      throw iRead.error.api;
    });
  },
  fullfeed: function(){
    if(iRead.FullFeed.enable) return (function(){ return true });
    iRead.FullFeed.enable = true;
    return XHR(iRead.api.wedata, {
      method: 'POST',
    })
    .add(function(res){
      var items = eval(res.responseText);
      if(items.ErrorCode) throw iRead.error.api;
      this.FullFeed.set(items);
    }, iRead)
    .error(function(e){
      console.info(e);
      iRead.FullFeed.enable = false;
      iRead.FullFeed.clear();
      throw iRead.error.api;
    });
  },
  access: function(url){
    return XHR(iRead.api.access, {
      method: 'POST',
      data  : {
        url : url
    }})
    .add(function(res){
      return eval(res.responseText);
    })
    .error(function(e){
      console.info(e);
      throw iRead.error.api;
    });
  },
  touch: function(id){
    return XHR(iRead.api.touch, {
      method: 'POST',
      data  : {
        ApiKey        : iRead.Config.ApiKey,
        type          : iRead.type,
        cookie        : iRead.cookie,
        subscribe_id  : id
    }})
    .error(function(e){
      console.info(e);
      throw iRead.error.api;
    })
    .add(function(res){
      var code = eval(res.responseText);
      if(code["ErrorCode"]) throw iRead.error.api;
      if(code["isSuccess"]) return true;
    });
  }
}

// view controller
// for List Pin Feed Item
iRead.View = {
  mode: '',
  restore: '',
  next: function(){
    if(!(this.mode == 'feed')) return false;
    window.scrollTo(0, 0);
    var next = iRead.Feed.next();
    if(!next){
      iRead.Dialog.message({
        message: 'This is the last feed.',
        title  : 'Feed Notice',
        time   : 0.5
      });
    }
    return next;
  },
  prev: function(){
    if(!(this.mode == 'feed')) return false;
    window.scrollTo(0, 0);
    var prev = iRead.Feed.prev()
    if(!prev){
      iRead.Dialog.message({
        message: 'This is the first feed.',
        title  : 'Feed Notice',
        time   : 0.5
      });
    }
    return prev;
  },
  touch: function(){
    if(!(this.mode == 'feed')) return false;
    return iRead.Feed.touch();
  },
  sort: function(mode){
    window.scrollTo(0, 0);
    iRead.List.sort(mode);
  },
  config: function(){
    console.info('CONFIG');
    window.scrollTo(0, 0);
    return Chain.add(function(){
      iRead.List.hide();
      iRead.Pin.hide();
      return iRead.Feed.hide();
    })
    .add(function(){
      console.info('HIDE');
      iRead.Config.create();
    })
    .error(function(e){
      console.info(e);
    });
  },
  reload: function(){
    window.scrollTo(0, 0);
    return Chain.add(function(){
      iRead.List.hide();
      iRead.Pin.hide();
      return iRead.Feed.hide();
    })
    .add(function(){
      iRead.Feed.clear();
      iRead.List.clear();
      this.mode = 'reload';
      iRead.Dialog.message({
        message: 'Now loading feeds...',
        title  : 'Subs Notice'
      });
      return iRead.API.feeds()
      .add(function(){
        iRead.Dialog.message({
          message: 'done',
          title  : 'Subs Notice',
          time   : 0.5
        });
        this.start(true);
      }, this)
      .error(function(e){
        console.info(e);
        iRead.Dialog.message({
          message: 'API Error',
          title  : 'Subs Notice'
        });
      });
    }, this)
    .error(function(e){
      console.info(e);
    });
  },
  show_subs: function(){
    if(this.mode == 'subs') return false;
    window.scrollTo(0, 0);
    return Chain.add(function(){
      iRead.Pin.hide();
      return iRead.Feed.hide();
    })
    .add(function(){
      iRead.List.show();
      this.restore = this.mode;
      this.mode = 'subs';
    }, this)
    .error(function(e){
      console.info(e);
    });
  },
  show_pins: function(){
    if(this.mode == 'pins') return false;
    window.scrollTo(0, 0);
    return Chain.add(function(){
      iRead.List.hide();
      return iRead.Feed.hide();
    })
    .add(function(){
      iRead.Pin.show();
      this.restore = this.mode;
      this.mode = 'pins';
    }, this)
    .error(function(e){
      console.info(e);
    });
  },
  show_feed: function(id){
    if(this.mode == 'feed') return false;
    window.scrollTo(0, 0);
    this.restore = this.mode;
    this.mode = 'feed';
    return Chain.list([
      iRead.List.hide(),
      iRead.Pin.hide(),
      iRead.Feed.show(id)
    ])
    .error(function(e){
      console.info(e);
    });
  },
  start: function(reload){
    window.scrollTo(0, 0);
    iRead.Pin.create(reload);
    iRead.List.create(reload);
    iRead.Feed.create(reload);
    this.restore = '';
    this.mode = 'subs';
    return Chain.add(function(){
      iRead.Pin.hide();
      return iRead.Feed.hide();
    })
    .add(function(){
      iRead.List.show();
    })
    .error(function(e){
      console.info(e);
    });
  },
  clear: function(){
    iRead.Feed.clear();
    iRead.List.clear();
    iRead.Pin.clear();
    return Chain.add(function(){
      return iRead.Feed.hide();
    })
    .add(function(){
      iRead.Pin.hide();
      iRead.List.hide();
    })
    .error(function(e){
      console.info(e);
    });
  },
}

// iRead feeds list => subs
// important config: sortmode, view_mode, limit_subs

iRead.List = {
  subs: [],
  current: 0,
  element: iRead.$N('div', {'id': 'subs_list', 'class': 'list'}),
  elements: {
    spacer: iRead.$N('div', {'class': 'spacer'}),
  },
  rates: [
    '☆☆☆☆☆',
    '★☆☆☆☆',
    '★★☆☆☆',
    '★★★☆☆',
    '★★★★☆',
    '★★★★★'
  ],
  set: function(list){
    this.subs = list.map(function(sub){
      return new iRead.Feed(sub);
    });
  },
  ready: function(){
    var self = this;
    iRead.$('main').appendChild(this.element);
    iRead.Event.connect('touchstart', function(es){
      if(!(iRead.View.mode == 'feed')) return;
      var x = es.touches[0].pageX;
      var t = 0;
      var move_sig = iRead.Event.connect('touchmove', function(e){
        t = e.touches[0].pageX - x;
      }, iRead.$('main'), false);
      var end_sig = iRead.Event.connect('touchend', function(e){
        iRead.Event._disconnect(move_sig);
        iRead.Event._disconnect(end_sig);
        (Math.abs(t) > 200) && ((t > 0)? iRead.View.next() : iRead.View.prev());
      }, iRead.$('main'), false);
    }, iRead.$('main'), false);
  },
  next: function(){
    if(this.current == (this.subs.length - 1)) return false;
    this.touch_feed();
    var current = this.subs[this.current];
    var next    = this.subs[++this.current];
    console.info('NEXT');
    return Chain.add(function(){
      current.close();
      next.read();
      next.load();
      this.read();
    }, this);
  },
  prev: function(){
    if(!this.current) return false;
    this.touch_feed();
    var current = this.subs[this.current];
    var prev    = this.subs[--this.current];
    console.info('PREV');
    return Chain.add(function(){
      current.close();
      prev.read();
      prev.load();
      this.read();
    }, this);
  },
  touch_feed: function(){
    var feed = this.subs[this.current];
    if(!feed) return false;
    // console.info('TOUCH');
    return feed.touch();
  },
  create: function(){
  },
  sort: function(mode){
    iRead.$d(this.element);
    this.create_feed(mode);
  },
  spacer: function(mode, sub){
    this.elements.spacer.cloneNode(true);
    switch(mode){
      case 'rate':
        spacer = this.elements.spacer.cloneNode(true);
        spacer.appendChild(iRead.$T(this.rates[sub]));
        break;
      case 'subscribers':
        spacer = this.elements.spacer.cloneNode(true);
        if(sub.length < 2){
          var begin = sub[0].subscribers_count;
          spacer.appendChild(iRead.$T(begin+' - '+(begin-0+1)+' users'));
        } else {
          var begin = sub[0].subscribers_count;
          var last  = sub[sub.length-1].subscribers_count;
          spacer.appendChild(iRead.$T(last+' - '+begin+' users'));
        }
        break;
      case 'folder':
        spacer = this.elements.spacer.cloneNode(true);
        spacer.appendChild(iRead.$T(sub));
        break;
    }
    return spacer;
  },
  // sort + view mode
  create_feed: function(mode){
    var df_subs = iRead.$DF();
    var df_lists  = iRead.$DF();
    switch(mode || iRead.Config.view_mode){
     //  'flat'        : 'Flat',
     //  'folder'      : 'Folder',
     //  'rate'        : 'Rating',
     //  'subscribers' : 'Subscribers',
     //  'domain'      : 'Domain'
      case 'rate':
        this.subs = this.subs.reduce(function(memo, feed){
          memo[5-feed.rate].push(feed);
          return memo;
        }, [[],[],[],[],[],[]])
        .map(function(rate_array, index){
          if(rate_array.length){
            var rate = 5 - index;
            rate_array = this.mode_sort(rate_array);
            df_subs.appendChild(iRead.List.spacer('rate', rate));
            return rate_array.map(function(feed, index){
              df_subs.appendChild(feed.create_feedlist());
              df_lists.appendChild(feed.create_feedcontent(index));
              return feed;
            });
          } else {
            return rate_array;
          }
        }, this).flatten();
        break;
      case 'folder':
        var ret = {};
        this.subs.map(function(feed, index){
          ret[feed.folder] || (ret[feed.folder] = []);
          ret[feed.folder].push(feed);
          return feed;
        });
        this.subs = ret.keys().sort()
        .map(function(key){
          var folder_array = ret[key];
          if(folder_array.length){
            folder_array = this.mode_sort(folder_array);
            df_subs.appendChild(iRead.List.spacer('folder', key));
            return folder_array.map(function(feed, index){
              df_subs.appendChild(feed.create_feedlist());
              df_lists.appendChild(feed.create_feedcontent(index));
              return feed;
            });
          } else {
            return folder_array;
          }
        }, this).flatten();
        break;
      case 'subscribers':
        var len = this.subs.length;
        var lim = (len)? len / 6 : 0;
        var key = "subscribers_count";
        this.subs = this.subs.sort(function(a, b){
          return (a[key] == b[key] ? (a['title'] > b['title'] ? 1 : -1 ): a[key] < b[key] ? 1 : -1);
        })
        .reduce(function(memo, feed, index){
          memo[(lim)? Math.floor(index / lim) : 0].push(feed);
          return memo;
        }, [[],[],[],[],[],[]])
        .map(function(count_array, index){
          if(count_array.length){
            count_array = this.mode_sort(count_array);
            df_subs.appendChild(iRead.List.spacer('subscribers', count_array));
            return count_array.map(function(feed, index){
              df_subs.appendChild(feed.create_feedlist());
              df_lists.appendChild(feed.create_feedcontent(index));
              return feed;
            });
          } else {
            return count_array;
          }
        }, this).flatten();
        break;
      case 'flat':
      default:
        this.subs = this.mode_sort(this.subs).map(function(feed, index){
          df_subs.appendChild(feed.create_feedlist());
          df_lists.appendChild(feed.create_feedcontent(index));
          return feed;
        });
        break;
    }
    this.element.appendChild(df_subs);
    iRead.Feed.elements.element.appendChild(df_lists);
  },
  mode_sort: function(list){
    //  'modified_on'          : 'New',
    //  'modified_on:reverse'  : 'Old',
    //  'unread_count'         : 'Unread items (desc.)',
    //  'unread_count:reverse' : 'Unread items (asc.)',
    //  'title:reverse'        : 'Title',
    //  'rate'                 : 'Rating',
    //  'subscribers_count'    : 'Subscribers (desc.)',
    //  'subscribers_count:reverse'  : 'Subscribers (asc.)'
    var tmp = iRead.Config.sort_mode.split(':');
		var key = tmp[0];
		var option = tmp[1];//reverse
    if(option == 'reverse') list.reverse();
    return list.sort(function(a, b){
      return (a[key] == b[key] ? 0 : a[key] < b[key] ? 1 : -1);
    });
  },
  show: function(){
    iRead.DOM.addClass(this.element, 'selected');
    return this.element;
  },
  show_feed: function(id){
    if(id){
      if(this.subs.some(function(feed, i){
        if(feed.subscribe_id == id){
          this.current = i;
          return true;
        } else {
          return false;
        }
      }, this)){
        return Chain.add(function(){
          this.subs[this.current].read();
          this.subs[this.current].load();
          this.read();
        }, this);
      } else {
        return false;
      }
    } else {
      if(this.subs && this.subs[this.current]){
        return Chain.add(function(){
          this.subs[this.current].read();
          this.subs[this.current].load();
          this.read();
        }, this);
      }
      return false;
    }
  },
  hide: function(){
    iRead.DOM.removeClass(this.element, 'selected');
    return this.element;
  },
  hide_feed: function(){
    if(this.subs && this.subs[this.current] && iRead.View.mode == 'feed'){
      return this.subs[this.current].close();
    } else {
      return false;
    }
  },
  clear: function(){
    this.subs = [];
    this.current = 0;
    this.element && iRead.$D(this.element);
  },
  clear_feed: function(){
    this.subs && this.subs.forEach(function(feed){
      feed.del();
    });
  },
  update: function(){
  },
  update_feed: function(){
  },
  read: function(){
    var read_ahead_subs = this.subs.slice(this.current+1, this.current+1+iRead.Config['prefetch_num']);
    return Chain.list(
      read_ahead_subs.map(function(feed){
        console.info(feed.title + ' reading');
        return feed.read();
      })
    );
  }
}
iRead.Ready.add(iRead.List);


// iRead pin
iRead.Pin = {
  pins: [],
  hash: {},
  element: iRead.$N('div', {'id': 'pins_list', 'class': 'list'}),
  item: iRead.$N('div', {'class': 'pin_item item'}),
  item_body: iRead.$N('span', {'class': 'pin_body'}),
  item_anchor: iRead.$N('a', {'class': 'pin_anchor', 'target': 'blank'}),
  add: function(item){
    if(this.check(item.link)) return false;
    // console.info('ADD PIN');
    var pin = {
      link: item.link,
      title: item.title,
    };
    this.pins.push(pin);
    this.hash[pin.link] = this.create_pinlist(pin);
    return new XHR(iRead.api.pins, {
      method: 'POST',
      data: {
        link        : item.link,
        title       : item.title,
        ApiKey      : iRead.Config.ApiKey,
        cookie      : iRead.cookie,
        type        : iRead.type,
        com         : 'add'
    }});
  },
  remove: function(item){
    if(!this.check(item.link)) return false;
    // console.info('REMOVE PIN');
    var index;
    if(this.pins.some(function(p, i){
      if(p.link == item.link){
        index = i;
        return true;
      }
      return false;
    })){
      this.pins.splice(index, 1);
      delete this.hash[item.link];
      return new XHR(iRead.api.pins, {
        method: 'POST',
        data: {
          link        : item.link,
          ApiKey      : iRead.Config.ApiKey,
          cookie      : iRead.cookie,
          type        : iRead.type,
          com         : 'remove'
      }});
    }
  },
  check: function(link){
    return (link in this.hash);
  },
  ready: function(){
    iRead.$('main').appendChild(this.element);
  },
  set: function(text){
    this.pins = eval(text);
    this.pins.forEach(function(pin){
      this.hash[pin.link] = this.create_pinlist(pin);
    }, this);
  },
  clear: function(){
    this.pins = [];
    this.hash = {};
  },
  create: function(){
  },
  create_pinlist: function(pin){
    var body   = this.item_body.cloneNode();
    var anchor = this.item_anchor.cloneNode();
    anchor.setAttribute('href', pin.link);
    anchor.appendChild(iRead.$T(pin.title));
    body.appendChild(anchor);
    var item   = this.item.cloneNode();
    item.appendChild(body);
    return item;
  },
  show: function(){
    var df = iRead.$DF();
    this.pins.forEach(function(pin){
      df.appendChild(this.hash[pin.link]);
    }, this);
    this.element.appendChild(df);
    iRead.DOM.addClass(this.element, 'selected');
  },
  hide: function(){
    iRead.$D(this.element);
    iRead.DOM.removeClass(this.element, 'selected');
  }
}
iRead.Ready.add(iRead.Pin);

// iRead feed
iRead.Feed = new iRead.Class({
  initialize: function(obj){
    Object.update(this, obj);
    this.states = {
      index  : 0,
      next   : (200 < iRead.Config["max_view"])? 200 :(iRead.Config["max_view"] || 20),
      read   : false,
      touched: false,
      all    : false,
      load  : false,
      close : false
    };
    this.elements = {
      feedlist: null,
      element : null
    };
    this.signals = [];
  },
  elements: {
    element: iRead.$N('div', {'id': 'feed'}),
    header: iRead.$N('div', {'class': 'header'}),
    footer: iRead.$N('div', {'class': 'footer'}, 'more'),
    content: iRead.$N('div', {'class': 'content'})
  },
  // FeedのserviceはList. instanceは各Feedの管理.
  // 将来的にListの一部機能をFeedに譲渡するかも.
  create: function(reload){
    reload || iRead.$('main').appendChild(this.elements.element);
    return iRead.List.create_feed();
  },
  show: function(id){
    return iRead.List.show_feed(id);
  },
  hide: function(){
    return iRead.List.hide_feed();
  },
  next: function(){
    return iRead.List.next();
  },
  prev: function(){
    return iRead.List.prev();
  },
  clear: function(){
    iRead.$D(this.elements.element);
    return iRead.List.clear_feed();
  },
  touch: function(){
    return iRead.List.touch_feed();
  },
  ready: function(){
    iRead.$('main').appendChild(this.elements.element);
  }
  },{
  ahead: null,
  create_feedlist: function(){
    if(this.elements.feedlist) return this.elements.feedlist;
    this.elements.feedlist = iRead.$CF('<div class="feed_item item"><img class="icon" src="'+this.icon+'"><span class="feed_title">'+this.title+' ('+this.unread_count+')</span></div>').firstChild;
    var self = this;
    this.signals.push(
      iRead.Event.connect('click', function(e){
        self.select();
      }, this.elements.feedlist, false)
    );
    return this.elements.feedlist;
  },
  create_feedcontent: function(index){
    if(this.elements.element) return this.elements.element;
    var self = this;
    // create feed footer
    this.elements.footer = iRead.Feed.elements.footer.cloneNode(true);
    this.elements.footer.setAttribute('id', 'footer_'+this.subscribe_id);
    this.signals.push(
      iRead.Event.connect('click', function(){
        self.add();
      }, this.elements.footer, false)
    );
    // create feed header
    this.elements.header = iRead.Feed.elements.header.cloneNode(true);
    this.elements.header.appendChild(iRead.$CF('<img class="icon" src="'+this.icon+'"/><h2>'+this.title+'</h2>'));
    // create feed content
    this.elements.content = iRead.Feed.elements.content.cloneNode(true);
    this.elements.content.setAttribute('id', 'content_'+this.subscribe_id);

    this.elements.element = iRead.$N('div', {
      'id'   : 'feed_'+this.subscribe_id,
      'class': 'list'
    }, [
      this.elements.header,
      this.elements.content,
      this.elements.footer
    ]);
    this.elements.element.style.zIndex = (10000 - index);
    return this.elements.element;
  },
  read: function(){
    // console.info('READ');
    if(this.states.read) return false;
    this.states.read = true;
    var ret = this.ahead = new XHR(iRead.api.feed, {
      method: 'POST',
      data: {
        subscribe_id: this.subscribe_id,
        ApiKey      : iRead.Config.ApiKey,
        cookie      : iRead.cookie,
        type        : iRead.type
      }
    })
    .add(function(res){
      var obj = eval(res.responseText);
      Object.update(this, obj, ['items', 'ads']);
      this.items = obj.items.map(function(item){ return new iRead.Item(item, this) }, this);
      this.ahead = null;
    }, this)
    .error(function(e){
      console.info(e);
    });
    return ret;
  },
  select: function(){
    return iRead.View.show_feed(this.subscribe_id);
  },
  add: function(){
    var df = iRead.$DF();
    if(this.states.all) return;
    // iRead.$D(this.elements.content);
    if((this.states.next) > (this.unread_count)){
      this.states.next = this.unread_count;
      this.states.all = true;
    }
    this.items
    .slice(this.states.index, this.states.next)
    .forEach(function(item, index){
      df.appendChild(item.create());
    }, this);
    this.states.index = this.states.next;
    this.states.next += (iRead.Config["items_per_page"] || 20),
    this.elements.content.appendChild(df);
  },
  close: function(){
    iRead.DOM.removeClass(this.elements.element, 'selected');
    if(!this.states.close){
      this.states.close = true;
      if(this.ahead){
        return this.ahead.add(function(){
          this.touch('onclose');
        }, this);
      } else {
        return this.touch('onclose');
      }
    }
  },
  load: function(){
    iRead.DOM.addClass(this.elements.element, 'selected');
    this.read();
    if(!this.states.load){
      this.states.load = true;
      if(this.ahead){
        return this.ahead.add(function(){
          this.add();
          this.touch('onload');
        }, this);
      } else {
        this.add();
        return this.touch('onload');
      }
    }
    return false;
  },
  touch: function(state){
    if(state != iRead.Config["touch_when"] || this.states.touched) return false;
    console.info('TOUCH');
    this.states.touched = true;
    iRead.DOM.addClass(this.elements.feedlist, 'touched');
    return iRead.API.touch(this.subscribe_id)
    .error(function(e){
      if(e == iRead.error.api){
        this.states.touched = false;
        iRead.DOM.removeClass(this.elements.feedlist, 'touched');
      }
    }, this);
  },
  del: function(){
    this.items && this.items.forEach(function(item){
      item.del();
    });
    this.signals && this.signals.forEach(function(signal){
      iRead.Event._disconnect(signal);
    });
  }
});
iRead.Ready.add(iRead.Feed);


// iRead item
iRead.Item = new iRead.Class({
  initialize: function(obj, feed){
    Object.update(this, obj);
    this.feed = feed;
    this.body = this.filter(this.body);
    this.elements = {};
    this.signals  = [];
    this.states = {
      fullfeed : false
    };

    var elements = iRead.Item.elements;
    this.elements.item = elements.item.cloneNode();
    // create header
    this.elements.header = elements.item_header.cloneNode();
    this.elements.header.appendChild(iRead.$CF('<h3 class="item_title"><a href="'+this.link+'">'+this.title+'</a></h3>'));
    // create footer
    this.elements.footer = elements.item_footer.cloneNode();
    this.elements.footer.appendChild(iRead.Widget.create(this));
    this.elements.item_body = elements.item_body.cloneNode();

    var df = iRead.$DF();
    df.appendChild(this.elements.header);
    df.appendChild(this.elements.item_body);
    df.appendChild(this.elements.footer);
    this.elements.item.appendChild(df);
  },
  ready: function(){
    // Tumblr Big Photo to Small
    // Safari on iPhone limits media size sum (10MB).
    /*
    this.add_filter(function(text, item){
      return text.replace(/(<img[^>]*src="http:\/\/(?:data|media).tumblr.com\/.+_)\d\d\d(.jpg)/gi, "$1250$2");
    });
    */
  },
  elements: {
    item: iRead.$N('div', {'class': 'list_item item'}),
    item_body: iRead.$N('div', {'class': 'item_body'}),
    item_footer: iRead.$N('div', {'class': 'item_footer'}),
    item_header: iRead.$N('div', {'class': 'item_header'}),
//    item_title: iRead.$N('h3', {'class': 'item_title'}),
//    item_title_anchor: iRead.$N('a'),
  },
  filters: [],
  add_filter: function(func){
    (iRead.isArray(func))
      ? func.forEach(function(f){ this.add_filter(f) }, this)
      : this.filters.push(func);
    return func;
  }
  },{
  filter: function(text){
    iRead.Item.filters.forEach(function(func){
      text = func(text, this);
    }, this);
    return text;
  },
  create: function(){
    this.check_pin() && iRead.DOM.addClass(this.elements.item, 'pinned');
    this.elements.item_body.appendChild(iRead.$CF(this.body));
    return this.elements.item;
  },
  del: function(){
    // remove listeners
    this.signals && this.signals.forEach(function(signal){
      iRead.Event._disconnect(signal);
    });
  },
  fullfeed: function(){
    if(!this.states.fullfeed) return;
    // console.info('FULLFEED');
    this.elements.item && iRead.DOM.addClass(this.elements.item, 'fullfeed');
    return Chain.hash({
      res  : iRead.API.access(this.link),
      data : function(){ return iRead.FullFeed.launch(this) },
    }, this)
    .add(function(hash){
      var res  = hash.res[1],
          data = hash.data[1];
      if(!hash.res[0] || !hash.data[0]) throw iRead.error.line;
      // create HTMLDocument
      var htmldoc = iRead.FullFeed.parse(res, this, data);
      // FullFeed
      var entry = iRead.FullFeed.get(htmldoc, this, data);
      iRead.$D(this.elements.item_body);
      this.elements.item_body.appendChild(entry);
      this.elements.item && iRead.DOM.removeClass(this.elements.item, 'fullfeed');
    }, this)
    .error(function(e){
      console.info(e);
      this.elements.item && iRead.DOM.removeClass(this.elements.item, 'fullfeed');
    }, this);
  },
  check_pin: function(){
    return iRead.Pin.check(this.link);
  },
  toggle_pin: function(){
    (this.check_pin())?  this.remove_pin() : this.add_pin();
  },
  add_pin: function(){
    if(iRead.Pin.pins.length == 100) return false;
    iRead.DOM.addClass(this.elements.item, 'pinned');
    return iRead.Pin.add(this);
  },
  remove_pin: function(){
    iRead.DOM.removeClass(this.elements.item, 'pinned');
    return iRead.Pin.remove(this);
  }
});
iRead.Ready.add(iRead.Item);

iRead.Widget = {
  list: [],
  channel_list: [],
  widget: iRead.$N('div', {'class': 'widget'}),
  ready: function(){
    // datetime widget
    var datetime = {
      // for Safari (Webkit)
      datetime_formatter: function(create_on){
        var dt = new Date;
        dt.setTime((create_on - 0)*1000);
        var year  = dt.getFullYear();
        var month = this.len_formatter(dt.getMonth()+1);
        var da    = this.len_formatter(dt.getDate());
        var hr    = this.len_formatter(dt.getHours());
        var min   = this.len_formatter(dt.getMinutes());
        var sec   = this.len_formatter(dt.getSeconds());
        return year+'/'+month+'/'+da+' '+hr+':'+min+':'+sec;
      },
      len_formatter: function(text){
        text = text + "";
        return (text.length == 2)
          ? text
          : '0'+text;
      },
      span: iRead.$N('span', {'class': 'datetime'}),
      create: function(item){
        var widget = this.span.cloneNode();
        widget.appendChild(iRead.$T('posted: ' + this.datetime_formatter(item.created_on)));
        return widget;
      }
    };
    this.add(datetime);

    // pin widget
    var pin = {
      span: iRead.$N('span', {
        'class': 'pin',
        'title': 'pin'
      }),
      create: function(item){
        var widget = this.span.cloneNode(true);
        item.signals.push(
          iRead.Event.connect('click', function(e){
            item.toggle_pin();
          }, widget, false)
        );
        return widget;
      }
    };
    this.add(pin);

    // fullfeed widget
    var fullfeed = {
      span: iRead.$N('span', {
        'class': 'fullfeed',
        'title': '全文取得できるよ!'
        }, 'G'),
      create: function(item){
        if(iRead.FullFeed.reg.test(item.link) || iRead.FullFeed.reg.test(item.feed.link)){
          item.states.fullfeed = true;
          var widget = this.span.cloneNode(true);
          var signal = iRead.Event.connect('click', function(e){
            iRead.Event._disconnect(signal);
            iRead.DOM.removeClass(widget, 'fullfeed');
            iRead.DOM.addClass(widget, 'fullfeed_loaded');
            item.fullfeed();
          }, widget, false);
          item.signals.push(signal);
          return widget;
        }
        else return null;
      }
    };
    this.add(fullfeed);
  },
  add: function(obj){
    this.list.push(obj);
    return obj;
  },
  add_channel: function(obj){
    this.channel_list.push(obj);
    return obj;
  },
  create: function(item){
    var df = iRead.$DF();
    this.list.forEach(function(w){
      var content = w.create(item);
      if(content){
        var widget = this.widget.cloneNode();
        widget.appendChild(content);
        df.appendChild(widget);
      }
    }, this);
    return df;
  },
  create_channel: function(feed){
    var df = iRead.$DF();
    this.channel_list.forEach(function(w){
      var content = w.create(item);
      if(content){
        var widget = this.widget.cloneNode();
        widget.appendChild(content);
        df.appendChild(widget);
      }
    }, this);
    return df;
  }
}
iRead.Ready.add(iRead.Widget);

iRead.FullFeed = {
  phase: [
    {type:'SBM'                            },
    {type:'INDIVIDUAL',         sub:'IND'  },
    {type:'INDIV_MICROFORMATS'             },
    {type:'SUBGENERAL',         sub:'SUB'  },
    {type:'GENERAL',            sub:'GEN'  },
    {type:'MICROFORMATS',       sub:'MIC'  }
  ],
  microformats: [
    {
      name : 'hAtom-Content',
      xpath: '//*[contains(concat(" ",normalize-space(@class)," "), " hentry ")]//*[contains(concat(" ",normalize-space(@class)," "), " entry-content ")]',
    },
    {
      name : 'hAtom',
      xpath: '//*[contains(concat(" ",normalize-space(@class)," "), " hentry ")]',
    },
    {
      name : 'xFolk',
      xpath: '//*[contains(concat(" ",normalize-space(@class)," "), " xfolkentry ")]//*[contains(concat(" ",normalize-space(@class)," "), " description ")]',
    },
    {
      name : 'AutoPagerize(Microformats)',
      xpath: '//*[contains(concat(" ",normalize-space(@class)," "), " autopagerize_page_element ")]',
    }
  ],
  config: {},
  reg: null,
  enable: false,
  filters: [
    // Filter: Remove Script and H2 tags
    (function(nodes, item){
      function filter(a, f) {
        for (var i = a.length; i --> 0; f(a[i]) || a.splice(i, 1));
      }
      filter(nodes, function(e){
        var n = e.nodeName;
        if(n.indexOf('SCRIPT') == 0) return false;
        if(n.indexOf('H2') == 0) return false;
        return true;
      });
      nodes.forEach(function(e){
        iRead.$X('descendant::*[self::script or self::h2]', e)
        .forEach(function(i){
          i.parentNode.removeChild(i);
        });
      });
    })
  ],
  add_filter: function(filter){
    this.filters.push(filter);
    return filter;
  },
  set: function(json){
    this.set_config(json);
    this.set_reg();
  },
  set_config: function(items){
    var ret = items.map(function(item){
      var data = item.data;
      data.type = data.type.toUpperCase()
      data.microformats = (data.microformats == 'true');
      return data;
    })
    .filter(function(data){
      try{
        var reg = new RegExp(data.url);
      } catch(e) {
        return false;
      }
      return true;
    });
    this.phase.forEach(function(p){
      ret.filter(function(data){
        return (data.type == p.type || (p.sub && data.type == p.sub));
      })
      .forEach(function(data){
        if(!this.config[p.type]) this.config[p.type] = [];
        this.config[p.type].push(data);
      }, this);
    }, this);
  },
  set_reg: function(){
    var exps = [];
    this.config.forEach(function(phase){
      phase.forEach(function(data){
        exps.push(data.url);
      });
    });
    var reg = new RegExp(exps.join('|'));
    this.reg = reg;
  },
  clear: function(){
    this.config = {};
    this.reg = null;
  },
  parse: function(res, item, data){
    try {
      var text = res.responseText;
      var htmldoc = document.implementation.createHTMLDocument('fullfeed');
      var df = iRead.$CF(text);
      nl = df.childNodes;
      htmldoc.body.appendChild(df);
      this.remove_risks(htmldoc);
      if(res.finalUrl){
        this.rel2abs(htmldoc, res.finalUrl);
      } else {
        this.rel2abs(htmldoc, item.link);
      }
      return htmldoc;
    } catch(e) {
      throw iRead.error.html;
    }
  },
  get: function(htmldoc, item, data){
    var entry = [];
    data.microformats && (entry = this.getByMicroformats(htmldoc));
    if(entry.length == 0){
      try{
        entry = iRead.$X(data.xpath, htmldoc);
      } catch(e) {
        iRead.Dialog.message({
          message: 'Something is wrong with this XPath',
          title  : 'LDR Full Feed',
          time   : 0.3,
        });
        throw 'Something is wrong with this XPath';
      }
    }
    if(entry.length > 0){
      this.filters.forEach(function(f) { f(entry, item) }, this);
      var df = iRead.$DF();
      entry.forEach(function(element){
        element = document.adoptNode(element, true);
        df.appendChild(element);
      });
      return df;
    } else {
      iRead.Dialog.message({
        message: 'This SITE_INFO is unmatched to this entry',
        title  : 'LDR Full Feed',
        time   : 0.3,
      });
      throw 'This SITE_INFO is unmatched to this entry';
    }
  },
  launch: function(item){
    var res = null;
    if(this.phase.some(function(p){
      var list = this.config[p.type];
      if(!list) return false;
      return list.some(function(data) {
        var reg = new RegExp(data.url);
        if (reg.test(item.link) || reg.test(item.feed.link)) {
          res = data;
          return true;
        } else {
          return false;
        }
      })
    }, this)){
      return res
    }
  },
  remove_risks: function(htmldoc){
    var attr = "allowscriptaccess";
    iRead.$X("descendant-or-self::embed", htmldoc)
      .forEach(function(elm){
      if(!elm.hasAttribute(attr)) return;
      elm.setAttribute(attr, "never");
    });
    iRead.$X("descendant-or-self::param", htmldoc)
      .forEach(function(elm){
      if(!elm.getAttribute("name") || elm.getAttribute("name").toLowerCase().indexOf(attr) < 0) return;
      elm.setAttribute("value", "never");
    });
  },
  rel2abs: function(htmldoc, base) {
    var o = {
      'top' : base.match(this.rel2abs_regs['top'])[0],
      'current' : base.replace(this.rel2abs_regs['current1'], '/'),
    };
    iRead.$X("descendant-or-self::a", htmldoc)
    .forEach(function(elm){
      if(elm.getAttribute("href")) elm.href = this._rel2abs(elm.getAttribute("href"), o);
    }, this);
    iRead.$X("descendant-or-self::img", htmldoc)
    .forEach(function(elm){
      if(elm.getAttribute("src")) elm.src = this._rel2abs(elm.getAttribute("src"), o);
    }, this);
  },
  _rel2abs: function(url, obj) {
    var top_link = obj['top'], current_link = obj['current'];
    if (url.match(this.rel2abs_regs['home'])) {
      return url;
    } else if (url.indexOf("/") == 0) {
      return top_link + url;
    } else {
      if(url.indexOf(".") == 0){
        while(url.indexOf(".") == 0){
          if(url.substring(0, 3) == "../")
            current_link = current_link.replace(this.rel2abs_regs['current2'],"/");
          url = url.replace(this.rel2abs_regs['url'],"")
        }
      }
      return current_link + url;
    }
  },
  rel2abs_regs: {
    'top': /^https?:\/\/[^\/]+/,
    'home': /^https?:\/\//,
    'current1': /\/[^\/]+$/,
    'current2': /\/[^\/]+\/$/,
    'url': /^\.+\//
  },
  getByMicroformats: function(htmldoc){
    var t;
    this.microformats.some(function(i){
      t = iRead.$X(i.xpath, htmldoc)
      if(t.length>0){
        return true;
      }
      else return false;
    });
    return t;
  }
}

// iRead Cookie
iRead.Cookie = {}
iRead.Cookie.create = function(cookie){
  var reg = /\s*([^\s=;]+)=([^\s=;]*)\s*/;
  cookie.split(';').forEach(function(item){
    var result = item.match(reg);
    iRead.Cookie[result[1]] = result[2];
  });
}

// iRead DOM Functions
iRead.DOM = {
  space: /\s+/,
  addClass: function(e, cl){
    if(!e || !cl) return false;
    e.className? (!~e.className.toLowerCase().split(iRead.DOM.space).indexOf(cl.toLowerCase())) && (e.className +=' '+cl) : (e.className = cl);
  },
  removeClass: function(e, cl){
    if(!e || !cl) return false;
    var t, l;
    e.className && (((t = (l = e.className.toLowerCase().split(iRead.DOM.space)).indexOf(cl.toLowerCase())) != -1) && (e.className = (l.splice(t, 1) && l.join(' '))));
  },
  hasClass: function(e, cl){
    if(!e || !cl) return false;
    return e.className && (~e.className.toLowerCase().split(iRead.DOM.space).indexOf(cl.toLowerCase()));
  },
  toggleClass: function(e, cl){
    if(!e || !cl) return false;
    iRead.DOM.hasClass(e, cl)? iRead.DOM.removeClass(e, cl) : iRead.DOM.addClass(e, cl);
  }
}

// Chain
Chain = new iRead.Class({
  initialize: function(){
    this._chain = [];
    this.SETTIMEOUT = true;
  },
  list: function(list, t){
    var ret   = new Chain(),
        num   = list.length,
        c     = 0,
        value = [];
    list.forEach(function(d, index){
      if(!(d instanceof Chain)){
        if(typeof d == 'function'){
          var f = d;
          d = Chain.add(function(){ return f.call(this) }, t);
        } else {
          var f = d;
          d = Chain.add(function(){ return f }, t);
        }
      }
      d.callbacks(
        function(res){
          value[index] = [true, res];
          if(++c==num) ret.succeed(value);
        },
        function(res){
          value[index] = [false, res];
          if(++c==num) ret.succeed(value);
      });
    });
    return ret;
  },
  hash: function(obj, t){
    var keys = obj.keys(),
        values = keys.map(function(key){ return obj[key] });
    return Chain.list(values, t).add(function(res){
      var h = {}
      res.forEach(function(e, index){
        h[keys[index]]=e;
      });
      return h
    }, t);
  },
  loop: function(n, fun, t){
    var ret= new Chain();
    Array.times(n, function(e){
      ret.add(function(res){
        return fun.call(t || this, e);
      });
    });
    return ret.succeed();
  },
  add: function(fun, t){
    var ret = new Chain();
    ret.add(fun, t);
    return ret.succeed();
  },
  later: function(time){
    var ret = new Chain();
    ret.later(time);
    return ret.succeed();
  },
  _pair: new iRead.Class({},{
    ok: function(res){ return res },
    er: function(res){ throw  res },
    time: 0,
    t: null
  }),
  _timer: new iRead.Class({
    initialize: function(){
      this.set();
    }
    },{
    stop: function(){
      return ((new Date - 0) - this.time);
    },
    set: function(){
      this.time = (new Date - 0);
    }
  })
},{
  add:  function(fun, t){ return this._add(fun, 'ok', 'push', t) },
  error: function(fun, t){ return this._add(fun, 'er', 'push', t) },
  callbacks: function(okfun, erfun, t){ return this._callbacks(okfun, erfun, 'push', t) },
  both: function(fun, t){ return this._callbacks(fun, fun, 'push', t) },
  addBefore:  function(fun, t){ return this._unshift(fun, 'ok', t) },
  errorBefore: function(fun, t){ return this._unshift(fun, 'er', t) },
  later:        function(time){ return this._later(time, 'push') },
  laterBefore: function(time){ return this._later(time, 'unshift') },
  succeed: function(res){ return this._start(res, 'ok')  },
  fail:  function(res){ return this._start(res, 'er')  },

  _add: function(fun, type, method, t){
    var pair = new Chain._pair();
    pair.t = t;
    pair[type] = fun;
    this._chain[method](pair);
    return this;
  },

  _callbacks: function(okfun, erfun, method, t){
    var pair = new Chain._pair();
    pair.t = t;
    pair.ok = okfun;
    pair.er = erfun;
    this._chain[method](pair);
    return this;
  },
  _later: function(time, method){
    if(!(time > 0)) return this;
    var pair = new Chain._pair();
    pair.time = time*1000;
    this._chain[method](pair);
    return this;
  },
  _go: function(res, type){
    var pair = this._chain.shift(),
        timer = new Chain._timer();
    try {
      res = pair[type].call((pair.t || this), res);
    } catch(e) {
      res = e;
      type = 'er';
    }
    if(res instanceof Chain){
      res.later(pair.time);
      res._chain = res._chain.concat(this._chain);
    } else if(this._chain.length > 0){
      if(pair.time && this.SETTIMEOUT){
        var tmp, self = this;
        var id = setTimeout(function(){
          id && clearTimeout(id);
          self._go(res, type);
        }, ((tmp = pair.time - timer.stop()) < 0)? 0 : tmp);
      }
      else this._go(res, type);
    }
    return this;
  },
  _start: function(res, type){
    var self = this;
    if(this.SETTIMEOUT)
      var id = setTimeout(function(){
          id && clearTimeout(id);
          self._go(res, type);
      }, 0);
    else this._go(res, type);
    return this;
  }
});

// XHR
XHR = new iRead.Class({
  initialize: function(url, opt){
    var req = XHR.getXHR(),
        ret = new Chain(),
        params = [];
    opt        || (opt = {});
    opt.method || (opt.method = 'GET');
    opt.data   || (opt.data = {});

    opt.data.forEach(function(v, k, o){
      if(o.hasOwnProperty(k))
        params.push(encodeURIComponent(k)+'='+encodeURIComponent(v));
    });
    params = params.join('&');

    req.onreadystatechange = function(e){
      if(req.readyState == 4){
        if (req.status >= 200 && req.status < 300)
          ret.succeed(req);
        else
          ret.fail(req);
      }
    }
    req.open(opt.method, url, true);
    if(opt.overrideMimeType && req.overrideMimeType)
      req.overrideMimeType(opt.overrideMimeType);
    if(opt.header){
      opt.header.forEach(function(v, k, o){
        if (o.hasOwnProperty(k))
          req.setRequestHeader(k, v);
      });
    }
    if(opt.method.toUpperCase()=='POST')
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(params);
    return ret;
  },

  getXHR: function(){
    for(var i=0,l=XHR.XHRs.length;i<l;i++){
      try {
        return XHR.XHRs[i]();
      } catch(e){}
    }
  },

  XHRs: [
    function(){ return new XMLHttpRequest(); },
    function(){ return new ActiveXObject('Msxml2.XMLHTTP'); },
    function(){ return new ActiveXObject('Microsoft.XMLHTTP'); },
    function(){ return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
  ]
});

// JSONP
JSONP = new iRead.Class({
  initialize: function(url, opt){
    var script = document.createElement('script'),
        ret = new Chain(),
        params = [],
        name = 'callback'+(JSONP.id++);
    opt      || (opt = {});
    opt.data || (opt.data = {});

    opt.data.callback = 'JSONP.callbacks.'+name;
    JSONP.callbacks[name] = function(json){
      delete JSONP.callbacks[name];
      document.getElementsByTagName('head')[0].removeChild(script);
      ret.succeed(json);
    }

    opt.data.forEach(function(v, k, o){
      if(o.hasOwnProperty(k))
        params.push(encodeURIComponent(k)+'='+encodeURIComponent(v));
    });
    params = params.join('&');
    url += (url.indexOf('?')==-1)? '?'+params : '&'+params;

    script.type    = 'text/javascript';
    script.charset = 'utf-8';
    script.src     = url;
    document.getElementsByTagName('head')[0].appendChild(script);

    return ret;
  },
  callbacks: {},
  id: 0
});

var SQL = new iRead.Class({
  initialize: function(database, callback, t){
    var ret = new Chain();
    database.transaction(
      function(trans){ callback.call(t || this, new SQL.Transaction(trans, database)) },
      function(e){ ret.fail(e) },
      function(res){ ret.succeed(res) });
    return ret;
  },
  Transaction: new iRead.Class({
    initialize: function(trans, database){
      this.transaction = trans;
      this.database    = database;
      this.version     = database.version;
    }
    }, {
      // trans.createTable('mytable', {id: 'INTEGER', name: 'TEXT'});
      createTable: function(name, obj){
        if(iRead.isArray(name)) name = name.join(', ');
        var params = obj.map(function(value, key){
          return key + ' ' + value;
        }).join(', ');
        name = SQL.escapeSQL(name);
        params = SQL.escapeSQL(params);
        return this.execute('CREATE TABLE IF NOT EXISTS ' + name + ' ( ' + params + ' );');
      },
      // trans.insert('mytable', {id: 1, name: 'Constellation' });
      insert: function(name, obj){
        if(iRead.isArray(name)) name = name.join(', ');
        name = SQL.escapeSQL(name);
        var columns = [];
        var values = [];
        obj.forEach(function(v, k){
          columns.push(SQL.escapeSQL(k));
          values.push('"'+SQL.escapeSQL(v)+'"');
        });
        columns.join(', ');
        values.join(', ');
        this.execute('INSERT INTO ' + name + ' ( ' + columns + ' ) VALUES ( ' + values + ' );');
      },
      /*
      select: function(name, obj){
        if(iRead.isArray(name)) name = name.join(', ');
        var ret = new Chain();
        var params = this._where(obj);
        this.execute('SELECT '
      },
      */
      // return Chain Object
      // NOT USING setTimeout => later etc.
      selectAll: function(name){
        if(iRead.isArray(name)) name = name.join(', ');
        var ret = new Chain();
        ret.SETTIMEOUT = false;
        name = SQL.escapeSQL(name);
        this.execute('SELECT * FROM ' + name, [],
          function(trans, rs){
            ret.succeed([trans, rs]);
          });
        return ret;
      },
      del: function(name, obj){
        if(iRead.isArray(name)) name = name.join(', ');
        name = SQL.escapeSQL(name);
        var data = [];
        obj.forEach(function(v, k){
          data.push('( '+SQL.escapeSQL(k)+ ' = "'+SQL.escapeSQL(v)+'" )');
        });
        data = data.join(' AND ');
        this.execute('DELETE FROM ' + name + ' WHERE ' + data);
      },
      delAll: function(name){
        if(iRead.isArray(name)) name = name.join(', ');
        name = SQL.escapeSQL(name);
        this.execute('DELETE FROM ' + name);
      },
      // raw
      execute: function(){
        var trans = this.transaction;
        trans.executeSql.apply(trans, arguments);
      },
  }),
  escapeSQL: function(text){
    return (iRead.isString(text))? text.replace(SQL.reg.q, "''").replace(SQL.reg.e, "\\\\") : "";
  },
  unescapeSQL: function(text){
    return (iRead.isString(text))? text.replace(SQL.reg.d, "'").replace(SQL.reg.u, "\\") : "";
  },
  reg: {
    q: /'/g,
    d: /''/g,
    e: /\\/g,
    u: /\\\\/g
  }
});

// main line

iRead.Event.connect('DOMContentLoaded', function(e){
  iRead.Ready.start();
  iRead.load();
}, window, false);
