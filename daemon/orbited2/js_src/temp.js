// jsio/browser.js

;(function() {
	var ENV, sourceCache = {
	'net.env': {"src": "function getObj(c,a,b){try{jsio(\"from .env.\"+(b||jsio.__env.name)+\".\"+a+\" import \"+c+\" as result\")}catch(d){throw logger.error(\"Invalid transport (\",a,\") or environment (\",b,\")\");}return result}exports.getListener=bind(this,getObj,\"Listener\");exports.getConnector=bind(this,getObj,\"Connector\");\n", "filePath": "jsio/net/env.js"},
'std.base64': {"src": "for(var alphabet=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_\",pad=\"=\",padChar=alphabet.charAt(alphabet.length-1),shorten=function(a,b){for(var c=b;c>0;c--)a.pop()},decode_map={},i=0,n=alphabet.length;i<n;i++)decode_map[alphabet.charAt(i)]=i;var alphabet_inverse=RegExp(\"[^\"+alphabet.replace(\"-\",\"\\\\-\")+\"]\"),Base64CodecError=exports.Base64CodecError=function(a){this.message=a};\nBase64CodecError.prototype.toString=function(){return\"Base64CodecError\"+(this.message?\": \"+this.message:\"\")};var assertOrBadInput=function(a,b){if(!a)throw new Base64CodecError(b);};\nexports.encode=function(a){assertOrBadInput(!/[^\\x00-\\xFF]/.test(a),\"Input contains out-of-range characters.\");var b=\"\\u0000\\u0000\\u0000\".slice(a.length%3||3);a+=b;for(var c=[],d=0,f=a.length;d<f;d+=3){var e=(a.charCodeAt(d)<<16)+(a.charCodeAt(d+1)<<8)+a.charCodeAt(d+2);c.push(alphabet.charAt(e>>18&63),alphabet.charAt(e>>12&63),alphabet.charAt(e>>6&63),alphabet.charAt(e&63))}shorten(c,b.length);return c.join(\"\")};\nexports.decode=function(a){logger.debug(\"decode\",a);a=a.replace(/\\s/g,\"\");for(var b=a.length;a.charAt(--b)===pad;);a=a.slice(0,b+1);assertOrBadInput(!alphabet_inverse.test(a),\"Input contains out-of-range characters.\");var c=Array(5-(a.length%4||4)).join(padChar);a+=c;var d=[];b=0;for(var f=a.length;b<f;b+=4){newchars=(decode_map[a.charAt(b)]<<18)+(decode_map[a.charAt(b+1)]<<12)+(decode_map[a.charAt(b+2)]<<6)+decode_map[a.charAt(b+3)];d.push(newchars>>16&255,newchars>>8&255,newchars&255)}shorten(d,\nc.length);a=String.fromCharCode.apply(String,d);logger.debug(\"decoded\",a);return a};\n", "filePath": "jsio/std/base64.js"},
'net.csp.errors': {"src": "var makeErrorClass=function(b,c){var a=function(d,e){this.message=d;this.code=e||c};a.prototype.toString=function(){return b+(this.message?\": \"+this.message:\"\")};return a};exports.ReadyStateError=makeErrorClass(\"ReadyStateError\");exports.InvalidEncodingError=makeErrorClass(\"InvalidEncodingError\");exports.HandshakeTimeout=makeErrorClass(\"HandshakeTimeout\",100);exports.SessionTimeout=makeErrorClass(\"HandshakeTimeout\",101);exports.ServerProtocolError=makeErrorClass(\"ServerProtocolError\",200);\nexports.ServerClosedConnection=makeErrorClass(\"ServerClosedConnection\",301);exports.ConnectionClosedCleanly=makeErrorClass(\"ConnectionClosedCleanly\",300);\n", "filePath": "jsio/net/csp/errors.js"},
'net.env.browser.csp': {"src": "jsio(\"import net.interfaces\");jsio(\"from net.csp.client import CometSession\");exports.Connector=Class(net.interfaces.Connector,function(){this.connect=function(){var a=new CometSession;a.onconnect=bind(this,function(){logger.debug(\"conn has opened\");this.onConnect(new Transport(a))});a.ondisconnect=bind(this,function(b){logger.debug(\"conn closed without opening, code:\",b)});logger.debug(\"open the conection\");this._opts.encoding=\"plain\";var c=this._opts.url;delete this._opts.url;a.connect(c,this._opts)}});\nvar Transport=Class(net.interfaces.Transport,function(){this.init=function(a){this._conn=a};this.makeConnection=function(a){this._conn.onread=bind(a,\"dataReceived\");this._conn.ondisconnect=bind(a,\"connectionLost\")};this.write=function(a){this._conn.write(a)};this.loseConnection=function(){this._conn.close()}});\n", "filePath": "jsio/net/env/browser/csp.js"},
'std.JSON': {"src": "exports.createGlobal=function(){if(typeof JSON==\"undefined\")JSON={};if(typeof JSON.stringify!==\"function\")JSON.stringify=exports.stringify;if(typeof JSON.parse!==\"function\")JSON.parse=exports.parse};\n(function(){function n(b){o.lastIndex=0;return o.test(b)?'\"'+b.replace(o,function(g){var c=q[g];return typeof c===\"string\"?c:\"\\\\u\"+(\"0000\"+g.charCodeAt(0).toString(16)).slice(-4)})+'\"':'\"'+b+'\"'}function l(b,g){var c=h,a=g[b];if(a&&typeof a===\"object\"&&typeof a.toJSON===\"function\")a=a.toJSON(b);if(typeof k===\"function\")a=k.call(g,b,a);switch(typeof a){case \"string\":return n(a);case \"number\":return isFinite(a)?String(a):\"null\";case \"boolean\":return String(a);case \"object\":if(a===null)return\"null\";\nif(a.constructor===Date)return exports.stringifyDate(a);h+=m;var d=[];if(a.constructor===Array){for(var i=a.length,e=0;e<i;e+=1)d[e]=l(e,a)||\"null\";var j=d.length===0?\"[]\":h?\"[\\n\"+h+d.join(\",\\n\"+h)+\"\\n\"+c+\"]\":\"[\"+d.join(\",\")+\"]\";h=c;return j}if(k&&typeof k===\"object\"){i=k.length;for(e=0;e<i;e+=1){var f=k[e];if(typeof f===\"string\")if(j=l(f,a))d.push(n(f)+(h?\": \":\":\")+j)}}else for(f in a)if(Object.hasOwnProperty.call(a,f))if(j=l(f,a))d.push(n(f)+(h?\": \":\":\")+j);j=d.length===0?\"{}\":h?\"{\\n\"+h+d.join(\",\\n\"+\nh)+\"\\n\"+c+\"}\":\"{\"+d.join(\",\")+\"}\";h=c;return j}}var p=/[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,o=/[\\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,h,m,q={\"\\u0008\":\"\\\\b\",\"\\t\":\"\\\\t\",\"\\n\":\"\\\\n\",\"\\u000c\":\"\\\\f\",\"\\r\":\"\\\\r\",'\"':'\\\\\"',\"\\\\\":\"\\\\\\\\\"},k;exports.stringify=function(b,g,c){m=h=\"\";if(typeof c===\"number\")for(var a=0;a<c;a+=1)m+=\" \";else if(typeof c===\"string\")m=\nc;if((k=g)&&typeof g!==\"function\"&&(typeof g!==\"object\"||typeof g.length!==\"number\"))throw Error(\"JSON stringify: invalid replacer\");return l(\"\",{\"\":b})};exports.stringifyDate=function(b){var g=b.getUTCFullYear(),c=b.getUTCMonth()+1,a=b.getUTCDate(),d=b.getUTCHours(),i=b.getUTCMinutes(),e=b.getUTCSeconds();b=b.getUTCMilliseconds();if(c<10)c=\"0\"+c;if(a<10)a=\"0\"+a;if(d<10)d=\"0\"+d;if(i<10)i=\"0\"+i;if(e<10)e=\"0\"+e;if(b<10)b=\"00\"+b;else if(b<100)b=\"0\"+b;return'\"'+g+\"-\"+c+\"-\"+a+\"T\"+d+\":\"+i+\":\"+e+\".\"+b+'Z\"'};\nexports.parse=function(b,g){p.lastIndex=0;if(p.test(b))b=b.replace(p,function(d){return\"\\\\u\"+(\"0000\"+d.charCodeAt(0).toString(16)).slice(-4)});if(/^[\\],:{}\\s]*$/.test(b.replace(/\\\\(?:[\"\\\\\\/bfnrt]|u[0-9a-fA-F]{4})/g,\"@\").replace(/\"[^\"\\\\\\n\\r]*\"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g,\"]\").replace(/(?:^|:|,)(?:\\s*\\[)+/g,\"\"))){var c=eval(\"(\"+b+\")\");if(g){var a=function(d,i){var e,j,f=d[i];if(f&&typeof f===\"object\")for(e in f)if(Object.hasOwnProperty.call(f,e)){j=a(f,e);if(j!==undefined)f[e]=\nj;else delete f[e]}return g.call(d,i,f)};return a({\"\":c},\"\")}else return c}throw new SyntaxError(\"JSON.parse\");}})();\n", "filePath": "jsio/std/JSON.js"},
'net.buffer': {"src": "jsio(\"from net.interfaces import Protocol\");var EmptyBufferError=exports.EmptyBufferError=Class(function(){this.init=function(a){this.message=a}});\nexports.Buffer=Class(function(){this.init=function(a){this._rawBuffer=a?a:\"\"};this.getLength=function(){return this._rawBuffer.length};this.append=function(a){logger.debug(\"append\",JSON.stringify(a));this._rawBuffer+=a};this.peekBytes=function(a){return a?this._rawBuffer.slice(0,a):this._rawBuffer};this.peekToDelimiter=function(a){a=a?a:\"\\n\";var b=this._rawBuffer.indexOf(a);if(b==-1)throw new EmptyBufferError(\"delimiter \"+a+\"not present in buffer\");else return this._rawBuffer.slice(0,b)};this.consumeBytes=\nfunction(a){a=this.peekBytes(a);this._rawBuffer=this._rawBuffer.slice(a.length);return a};this.consumeMaxBytes=function(a){var b=this._rawBuffer.slice(0,a);this._rawBuffer=this._rawBuffer(a);return b};this.consumeAllBytes=function(){var a=this._rawBuffer;this._rawBuffer=\"\";return a};this.consumeThroughDelimiter=function(a){return this.consumeToDelimiter(a)+this.consumeBytes(a.length)};this.consumeToDelimiter=function(a){a=a?a:\"\\n\";a=this.peekToDelimiter(a);this._rawBuffer=this._rawBuffer.slice(a.length);\nreturn a};this.hasBytes=function(a){a=a?a:0;return this._rawBuffer.length>=a};this.hasDelimiter=function(a){a=a?a:\"\\n\";return this._rawBuffer.indexOf(a)!=-1}});\n", "filePath": "jsio/net/buffer.js"},
'net.csp.client': {"src": "jsio(\"import std.base64 as base64\");jsio(\"import std.utf8 as utf8\");jsio(\"import std.uri as uri\");jsio(\"import .errors\");jsio(\"import .transports\");var READYSTATE=exports.READYSTATE={INITIAL:0,CONNECTING:1,CONNECTED:2,DISCONNECTING:3,DISCONNECTED:4};\nexports.CometSession=Class(function(){var f=0;this.init=function(){this._id=++f;this._url=null;this.readyState=READYSTATE.INITIAL;this._options=this._transport=this._sessionKey=null;this._writeBuffer=this._utf8ReadBuffer=\"\";this._handshakeLater=this._lastSentId=this._lastEventId=this._packetsInFlight=null;this._handshakeBackoff=50;this._timeoutTimer=this._handshakeTimeoutTimer=this._handshakeRetryTimer=null;this._cometBackoff=this._writeBackoff=50;this._nullReceived=this._nullSent=this._nullInFlight=\nthis._nullInBuffer=false};this.setEncoding=function(a){if(a!=this._options.encoding){if(a!=\"utf8\"&&a!=\"plain\")throw new errors.InvalidEncodingError;if(a==\"plain\"&&this._buffer){var c=this._utf8ReadBuffer;this._utf8ReadBuffer=\"\";this._doOnRead(c)}this._options.encoding=a}};this.connect=function(a,c){this._url=a.replace(/\\/$/,\"\");this._options=c||{};this._options.encoding=this._options.encoding||\"utf8\";this.setEncoding(this._options.encoding);this._options.connectTimeout=this._options.connectTimeout||\n1E4;this._transport=new (transports.chooseTransport(a,this._options));this._transport.handshakeFailure=bind(this,this._handshakeFailure);this._transport.handshakeSuccess=bind(this,this._handshakeSuccess);this._transport.cometFailure=bind(this,this._cometFailure);this._transport.cometSuccess=bind(this,this._cometSuccess);this._transport.sendFailure=bind(this,this._writeFailure);this._transport.sendSuccess=bind(this,this._writeSuccess);this.readyState=READYSTATE.CONNECTING;this._transport.handshake(this._url,\nthis._options);this._handshakeTimeoutTimer=$setTimeout(bind(this,this._handshakeTimeout),this._options.connectTimeout)};this.write=function(a,c){if(this.readyState!=READYSTATE.CONNECTED)throw new errors.ReadyStateError;c=c||this._options.encoding||\"utf8\";if(c==\"utf8\")a=utf8.encode(a);this._writeBuffer+=a;this._doWrite()};this._protocolError=function(a){logger.debug(\"_protocolError\",a);this.readyState=READYSTATE.DISCONNECTED;this._doWrite(true);this._doOnDisconnect(new errors.ServerProtocolError(a))};\nthis._receivedNullPacket=function(){logger.debug(\"_receivedNullPacket\");this._receivedNull=true;if(this._nullInFlight||this._nullInBuffer||this._nullSent)this.readyState=READYSTATE.DISCONNECTED;else{this.readyState=READYSTATE.DISCONNECTING;this._doWrite(true)}this._doOnDisconnect(new errors.ConnectionClosedCleanly)};this._sentNullPacket=function(){logger.debug(\"_sentNullPacket\");if((this._nullSent=true)&&this._nullReceived)this.readyState=READYSTATE.DISCONNECTED};this.close=function(a){logger.debug(\"close called\",\na,\"readyState\",this.readyState);switch(this.readyState){case READYSTATE.CONNECTING:clearTimeout(this._handshakeRetryTimer);clearTimeout(this._handshakeTimeoutTimer);this.readyState=READYSTATE.DISCONNECTED;this._doOnDisconnect(a);break;case READYSTATE.CONNECTED:this.readyState=READYSTATE.DISCONNECTING;this._doWrite(true);clearTimeout(this._timeoutTimer);break;case READYSTATE.DISCONNECTED:throw new errors.ReadyStateError(\"Session is already disconnected\");}this._sessionKey=null;this._opened=false;this.readyState=\nREADYSTATE.DISCONNECTED;this._doOnDisconnect(a)};this._handshakeTimeout=function(){logger.debug(\"handshake timeout\");this._handshakeTimeoutTimer=null;this._doOnDisconnect(new errors.HandshakeTimeout)};this._handshakeSuccess=function(a){logger.debug(\"handshake success\",a);if(this.readyState!=READYSTATE.CONNECTING)logger.debug(\"received handshake success in invalid readyState:\",this.readyState);else{clearTimeout(this._handshakeTimeoutTimer);this._handshakeTimeoutTimer=null;this._sessionKey=a.session;\nthis._opened=true;this.readyState=READYSTATE.CONNECTED;this._doOnConnect();this._doConnectComet()}};this._handshakeFailure=function(a){logger.debug(\"handshake failure\",a);if(this.readyState==READYSTATE.CONNECTING){logger.debug(\"trying again in \",this._handshakeBackoff);this._handshakeRetryTimer=$setTimeout(bind(this,function(){this._handshakeRetryTimer=null;this._transport.handshake(this._url,this._options)}),this._handshakeBackoff);this._handshakeBackoff*=2}};this._writeSuccess=function(){if(!(this.readyState!=\nREADYSTATE.CONNECTED&&this.readyState!=READYSTATE.DISCONNECTING)){if(this._nullInFlight)return this._sentNullPacket();this._resetTimeoutTimer();this.writeBackoff=50;this._packetsInFlight=null;if(this._writeBuffer||this._nullInBuffer)this._doWrite(this._nullInBuffer)}};this._writeFailure=function(){if(!(this.readyState!=READYSTATE.CONNECTED&&this.READYSTATE!=READYSTATE.DISCONNECTING)){this._writeTimer=$setTimeout(bind(this,function(){this._writeTimer=null;this.__doWrite(this._nullInBuffer)}),this._writeBackoff);\nthis._writeBackoff*=2}};this._doWrite=function(a){if(this._packetsInFlight){if(a)this._nullInBuffer=true}else this.__doWrite(a)};this.__doWrite=function(a){logger.debug(\"_writeBuffer:\",this._writeBuffer);if(!this._packetsInFlight&&this._writeBuffer){this._packetsInFlight=[this._transport.encodePacket(++this._lastSentId,this._writeBuffer,this._options)];this._writeBuffer=\"\"}if(a&&!this._writeBuffer){if(!this._packetsInFlight)this._packetsInFlight=[];this._packetsInFlight.push([++this._lastSentId,0,\nnull]);this._nullInFlight=true}if(this._packetsInFlight){logger.debug(\"sending packets:\",JSON.stringify(this._packetsInFlight));this._transport.send(this._url,this._sessionKey,this._lastEventId||0,JSON.stringify(this._packetsInFlight),this._options)}else logger.debug(\"no packets to send\")};this._doConnectComet=function(){logger.debug(\"_doConnectComet\");this._transport.comet(this._url,this._sessionKey,this._lastEventId||0,this._options)};this._cometFailure=function(a,c){if(this.readyState==READYSTATE.CONNECTED){if(a==\n404&&c==\"Session not found\")return this.close();this._cometTimer=$setTimeout(bind(this,function(){this._doConnectComet()}),this._cometBackoff);this._cometBackoff*=2}};this._cometSuccess=function(a){if(!(this.readyState!=READYSTATE.CONNECTED&&this.readyState!=READYSTATE.DISCONNECTING)){logger.debug(\"comet Success:\",a);this._cometBackoff=50;this._resetTimeoutTimer();for(var c=0,b;(b=a[c])||c<a.length;c++){logger.debug(\"process packet:\",b);if(b===null)return self.close();logger.debug(\"process packet\",\nb);var d=b[0],g=b[1];b=b[2];if(!(typeof this._lastEventId==\"number\"&&d<=this._lastEventId)){if(typeof this._lastEventId==\"number\"&&d!=this._lastEventId+1)return this._protocolError(\"Ack id too high\");this._lastEventId=d;if(b==null)return this._receivedNullPacket();if(g==1)try{logger.debug(\"before base64 decode:\",b);b=base64.decode(b);logger.debug(\"after base64 decode:\",b)}catch(h){return this._protocolError(\"Unable to decode base64 payload\")}if(this._options.encoding==\"utf8\"){this._utf8ReadBuffer+=\nb;logger.debug(\"before utf8 decode, _utf8ReadBuffer:\",this._utf8ReadBuffer);d=utf8.decode(this._utf8ReadBuffer);b=d[0];this._utf8ReadBuffer=this._utf8ReadBuffer.slice(d[1]);logger.debug(\"after utf8 decode, _utf8ReadBuffer:\",this._utf8ReadBuffer,\"data:\",b)}logger.debug(\"dispatching data:\",b);try{this._doOnRead(b)}catch(e){logger.error(\"application code threw an error. (re-throwing in timeout):\",e);setTimeout(function(){logger.debug(\"timeout fired, throwing error\",e);throw e;},0)}}}this._doConnectComet()}};\nthis._doOnRead=function(a){if(typeof this.onread==\"function\"){logger.debug(\"call onread function\",a);this.onread(a)}else logger.debug(\"skipping onread callback (function missing)\")};this._doOnDisconnect=function(a){if(typeof this.ondisconnect==\"function\"){logger.debug(\"call ondisconnect function\",a);this.ondisconnect(a)}else logger.debug(\"skipping ondisconnect callback (function missing)\")};this._doOnConnect=function(){if(typeof this.onconnect==\"function\"){logger.debug(\"call onconnect function\");\ntry{this.onconnect()}catch(a){logger.debug(\"onconnect caused errror\",a);setTimeout(function(){throw a;},0)}}else logger.debug(\"skipping onconnect callback (function missing)\")};this._resetTimeoutTimer=function(){clearTimeout(this._timeoutTimer);this._timeoutTimer=$setTimeout(bind(this,function(){logger.debug(\"connection timeout expired\");this.close(new errors.SessionTimeout)}),this._getTimeoutInterval())};this._getTimeoutInterval=function(){return 45E3}});\n", "filePath": "jsio/net/csp/client.js"},
'net.interfaces': {"src": "jsio(\"import net\");var ctx=jsio.__env.global;exports.Protocol=Class(function(){this.connectionMade=function(){};this.dataReceived=function(){};this.connectionLost=function(){};this.connectionFailed=function(){}});exports.Client=Class(function(){this.init=function(a){this._protocol=a};this.connect=function(a,b){this._remote=new this._protocol;this._remote._client=this;net.connect(this._remote,a,b)}});\nexports.Server=Class(function(){this.init=function(a){this._protocolClass=a};this.buildProtocol=function(){return new this._protocolClass};this.listen=function(a,b){return net.listen(this,a,b)}});exports.Transport=Class(function(){this.write=function(){throw Error(\"Not implemented\");};this.getPeer=function(){throw Error(\"Not implemented\");}});\nexports.Listener=Class(function(){this.init=function(a,b){this._server=a;this._opts=b||{}};this.onConnect=function(a){try{var b=this._server.buildProtocol();b.transport=a;b.server=this._server;a.protocol=b;a.makeConnection(b);b.connectionMade()}catch(c){logger.error(c)}};this.listen=function(){throw Error(\"Abstract class\");};this.stop=function(){}});\nexports.Connector=Class(function(){this.init=function(a,b){this._protocol=a;this._opts=b};this.onConnect=function(a){a.makeConnection(this._protocol);this._protocol.transport=a;try{this._protocol.connectionMade()}catch(b){throw logger.error(b);}};this.onDisconnect=function(){try{this._protocol.connectionLost()}catch(a){throw logger.error(a);}};this.getProtocol=function(){return this._protocol}});\n", "filePath": "jsio/net/interfaces.js"},
'Orbited': {"src": "jsio(\"from net.protocols.buffered import BufferedProtocol\");jsio(\"import net\");jsio(\"import std.uri\");jsio(\"import std.JSON\");jsio(\"import std.utf8 as utf8\");var DEFAULT_BASE_URI;\nfunction setup(){for(var a=document.getElementsByTagName(\"script\"),b=0,c;c=a[b];++b)if(c.src.match(\"(^|/)Orbited.js$\")){found=true;a=new std.uri.Uri(c.src.substring(0,c.src.length-10));b=new std.uri.Uri(window.location);DEFAULT_BASE_URI=(a.getProtocol()||b.getProtocol())+\"://\"+(a.getHost()||b.getHost())+\":\"+(a.getPort()||b.getPort()||\"80\")+(a.getPath()||b.getPath());break}}setup();logger.info(\"DEFAULT_BASE_URI\",DEFAULT_BASE_URI);\nvar READYSTATE_WAITING=-1,READYSTATE_CONNECTING=0,READYSTATE_OPEN=1,READYSTATE_CLOSING=2,READYSTATE_CLOSED=3;\nexports.TCPSocket=Class(function(){this.init=function(){this._proxyUri=exports.TCPSocket.proxyUri||DEFAULT_BASE_URI;this._proxyUri.match(\"/$\")||(this._proxyUri+=\"/\");this.readyState=READYSTATE_WAITING;this._buffer=\"\"};this.open=function(a,b,c){if(!exports.settings.proxyUri)throw Error(\"Could not automatically determine Orbited's uri, and Orbited.TCPSocket.opts.proxyUri was not manually specified\");var d=common.getMultiplexer();this._isBinary=!!c;this._host=a;this._port=b;this._conn=d.openConnection();\nthis._conn.onOpen=bind(this,\"_onOpen\");this._conn.onFrame=bind(this,\"_onFrame\");this._conn.onClose=bind(this,\"_onClose\")};this._onClose=function(){logger.info(\"got _onClose\");if(this.readyState!=READYSTATE_CLOSED){this.readyState=READYSTATE_CLOSED;releaseMultiplexer();this._trigger(\"close\")}};this._onOpen=function(){logger.info(\"onOpen!\");this._conn.send(JSON.stringify({hostname:this._host,port:this._port,origin:document.location.toString(),protocol:\"tcp\"}))};this._onFrame=function(a){logger.info(\"_onFrame\",\na);switch(this.readyState){case READYSTATE_CONNECTING:if(a==\"1\"){this.readyState=READYSTATE_OPEN;this._trigger(\"open\")}else this._onClose();break;case READYSTATE_OPEN:this._buffer+=a;var b=utf8.decode(this._buffer);a=b[0];this._buffer=this._buffer.slice(b[1]);a.length&&this._trigger(\"read\",a);break}};this.send=function(a){if(!(this.readyState>=READYSTATE_CLOSING)){this._isBinary||(a=utf8.encode(a));this._conn.send(a)}};this.close=function(){if(!(this.readyState>=READYSTATE_CLOSING)){this.readyState=\nREADYSTATE_CLOSING;this._conn.close();this._conn.onClose=bind(this,\"_onClose\")}};this._trigger=function(a,b){this[\"on\"+a].call(this,b)};this.onread=function(){};this.onopen=function(){};this.onclose=function(){}});exports.TCPSocket.opts={};\nexports.WebSocket=Class(function(){this.init=function(a){this._url=a;this.readyState=READYSTATE_CONNECTING;this.bufferedAmount=0;logger.info(\"opts\",exports.WebSocket.opts);this._conn=getMultiplexer(exports.WebSocket.opts.proxyUri).openConnection();this._conn.onOpen=bind(this,\"_onOpen\");this._conn.onFrame=bind(this,\"_onFrame\");this._conn.onClose=bind(this,\"_onClose\")};this.send=function(a){if(!(this.readyState>=READYSTATE_CLOSING)){var b=utf8.encode(a);logger.info(\"data\",JSON.stringify(a));logger.info(\"encoded\",\nJSON.stringify(b));this._conn.send(b)}};this._onClose=function(){logger.info(\"got _onClose\");if(this.readyState!=READYSTATE_CLOSED){this.readyState=READYSTATE_CLOSED;releaseMultiplexer();this._trigger(\"close\")}};this._onOpen=function(){logger.info(\"onOpen!\");this._conn.send(JSON.stringify({origin:document.location.toString(),url:this._url,protocol:\"ws_\"+exports.WebSocket.opts.protocolVersion}))};this._onFrame=function(a){logger.info(\"_onFrame\",a);switch(this.readyState){case READYSTATE_CONNECTING:if(a==\n\"1\"){this.readyState=READYSTATE_OPEN;this._trigger(\"open\")}else this._onClose();break;case READYSTATE_OPEN:this._trigger(\"message\",utf8.decode(a)[0]);break}};this._trigger=function(a,b){this[\"on\"+a].call(this,b)};this.close=function(){if(!(this.readyState>=READYSTATE_CLOSING)){this.readyState=READYSTATE_CLOSING;this._conn.close();this._conn.onClose=bind(this,\"_onClose\")}};this.onopen=function(){};this.onmessage=function(){};this.onerror=function(){};this.onclose=function(){}});var installed=false;\nexports.WebSocket.install=function(a){if(installed)throw Error(\"orbited.Websocket already installed\");validateOpts(a);exports.WebSocket.opts=a;installed=true;if(!(!a.forceProxy&&hasNativeWebsocket(a.protocolVersion)))window.WebSocket=exports.WebSocket};\nfunction validateOpts(a){a.protocolVersion=a.protocolVersion||\"hixie75\";a.forceProxy=!!a.forceProxy;if(!a.proxyUri)a.proxyUri=DEFAULT_BASE_URI;if(!a.proxyUri)throw Error(\"proxyUri undefined, and unable to auto-detect based on script tag includes\");a.proxyUri.match(\"/$\")||(a.proxyUri+=\"/\")}function hasNativeWebsocket(){return!!window.WebSocket}var multiplexer=null,count=0;\nfunction getMultiplexer(a){if(!multiplexer){multiplexer=new OrbitedMultiplexingProtocol;multiplexer.onClose=function(){multiplexer=null};logger.info(\"call net.connect\",\"csp\",{url:a+\"csp\"});net.connect(multiplexer,\"csp\",{url:a+\"csp\"})}count+=1;return multiplexer}function releaseMultiplexer(){if(--count==0){multiplexer.transport.loseConnection();multiplexer=null}}var OPEN_FRAME=0,CLOSE_FRAME=1,DATA_FRAME=2;DELIMITER=\",\";\nvar Connection=Class(function(){this.init=function(a,b){this._multiplexer=a;this._id=b};this.send=function(a){this._id=id;this._multiplexer.sendFrame(this._id,DATA_FRAME,a)};this.close=function(){this._multiplexer.closeConnection(this._id)};this.onFrame=function(){};this.onClose=function(){};this.onOpen=function(){}}),OrbitedMultiplexingProtocol=Class(BufferedProtocol,function(a){this.init=function(){a(this,\"init\",arguments);this._connections={};this._size=this._last_id=-1;this._connected=false};\nthis.openConnection=function(){var b=++this._last_id,c=this._connections[b]=new Connection(this,b);this._connected&&this._sendOpen(b);return c};this.closeConnection=function(b){this._connections[b]&&this._connected&&this._sendClose(b)};this._sendOpen=function(b){this.sendFrame(b,OPEN_FRAME)};this._sendClose=function(b){this.sendFrame(b,CLOSE_FRAME)};this.sendFrame=function(b,c,d){d=d||\"\";if(!this._connected)throw Error(\"Multiplexer not connected\");b=b+DELIMITER+c+DELIMITER+d;this.transport.write(b.length+\nDELIMITER+b)};this.connectionMade=function(){this._connected=true;for(id in this._connections)this._sendOpen(id)};this.onClose=function(){};this.connectionLost=function(){this.onClose();for(id in this._connections)this._connections[id].onClose()};this._dispatchPayload=function(b){var c=b.indexOf(DELIMITER);if(c!=-1){var d=parseInt(b.substring(0,c)),e=b.indexOf(DELIMITER,c+1);if(e!=-1){c=parseInt(b.substring(c+1,e));b=b.substring(e+1);e=this._connections[d];if(!(!e||typeof c!=\"number\"))switch(c){case OPEN_FRAME:e.onOpen();\nbreak;case CLOSE_FRAME:delete this._connections[d];e.onClose();break;case DATA_FRAME:e.onFrame(b);break}}}};this.bufferUpdated=function(){for(;;){if(this._size==-1)if(this.buffer.hasDelimiter(DELIMITER)){this._size=parseInt(this.buffer.consumeToDelimiter(DELIMITER));this.buffer.consumeBytes(DELIMITER.length)}else break;if(!this.buffer.hasBytes(this._size))break;this._dispatchPayload(this.buffer.consumeBytes(this._size));this._size=-1}}});\n", "filePath": "Orbited.js"},
'base': {"src": "exports.log=jsio.__env.log;exports.GLOBAL=jsio.__env.global;\nexports.bind=function(a,b){if(arguments.length>2){var d=Array.prototype.slice.call(arguments,2);return typeof b==\"string\"?function(){if(a[b])return a[b].apply(a,d.concat(Array.prototype.slice.call(arguments,0)));else throw logger.error(\"No method:\",b,\"for context\",a);}:function(){return b.apply(a,d.concat(Array.prototype.slice.call(arguments,0)))}}else return typeof b==\"string\"?function(){if(a[b])return a[b].apply(a,arguments);else throw logger.error(\"No method:\",b,\"for context\",a);}:function(){return b.apply(a,\narguments)}};\nexports.Class=function(a,b){if(!a)throw Error(\"parent or prototype not provided\");if(b)if(a instanceof Array){b.prototype={};for(var d=0,g;g=a[d];++d)for(var c in g.prototype)c in b.prototype||(b.prototype[c]=g.prototype[c]);a=a[0]}else b.prototype=a.prototype;else b=a;d=function(){if(this.init)return this.init.apply(this,arguments)};d.prototype=new b(function(h,i,e){e=e||[];for(var f=b;f=f.prototype;)if(f[i])return f[i].apply(h,e);throw Error(\"method \"+i+\" does not exist\");});return d.prototype.constructor=d};\nexports.$setTimeout=function(a,b){var d=Array.prototype.slice.call(arguments,2);return setTimeout(function(){try{a.apply(this,d)}catch(g){}},b)};exports.$setInterval=function(a,b){var d=Array.prototype.slice.call(arguments,2);return setInterval(function(){try{a.apply(this,d)}catch(g){}},b)};exports.$clearTimeout=function(a){return a?clearTimeout(a):null};exports.$clearInterval=function(a){return a?clearInterval(a):null};\nexports.logging=function(){var a={DEBUG:1,LOG:2,INFO:3,WARN:4,ERROR:5},b={},d=false;a.setProduction=function(c){d=!!c};a.get=function(c){return b.hasOwnProperty(c)?b[c]:b[c]=new g(c)};a.set=function(c,h){b[c]=h};a.getAll=function(){return b};a.__create=function(c,h){h.logger=a.get(c)};var g=exports.Class(function(){function c(e,f){return function(){if(!d&&e>=this._level)return i.apply(i,[f,this._name].concat(h.call(arguments,0)));return arguments[0]}}this.init=function(e,f){this._name=e;this._level=\nf||a.LOG};this.setLevel=function(e){this._level=e};var h=Array.prototype.slice,i=exports.log;this.debug=c(a.DEBUG,\"DEBUG\");this.log=c(a.LOG,\"LOG\");this.info=c(a.INFO,\"INFO\");this.warn=c(a.WARN,\"WARN\");this.error=c(a.ERROR,\"ERROR\")});return a}();var logger=exports.logging.get(\"jsiocore\");\n", "filePath": "jsio/base.js"},
'net.csp.transports': {"src": "jsio(\"from base import *\");jsio(\"import std.uri as uri\");jsio(\"import std.base64 as base64\");jsio(\"import .errors\");jsio(\"from util.browserdetect import BrowserDetect\");var createXHR=exports.createXHR=function(){return window.XMLHttpRequest?new XMLHttpRequest:window.XDomainRequest?new XDomainRequest:window.ActiveXObject?new ActiveXObject(\"Msxml2.XMLHTTP\"):null};function isLocalFile(e){return/^file:\\/\\//.test(e)}function isWindowDomain(e){return uri.isSameDomain(e,window.location.href)}\nfunction canUseXHR(e){if(isLocalFile(e))return false;var f=createXHR();if(!f)return false;if(isWindowDomain(e))return true;if(window.XMLHttpRequest&&(f.__proto__==XMLHttpRequest.prototype||f instanceof window.XMLHttpRequest)&&f.withCredentials!==undefined||window.XDomainRequest&&f instanceof window.XDomainRequest)return true}var transports=exports.transports={};\nexports.chooseTransport=function(e,f){switch(f.preferredTransport){case \"jsonp\":return transports.jsonp;case \"xhr\":default:if(canUseXHR(e))return transports.xhr;return transports.jsonp}};var PARAMS={xhrstream:{is:\"1\",bs:\"\\n\"},xhrpoll:{du:\"0\"},xhrlongpoll:{},sselongpoll:{bp:\"data: \",bs:\"\\r\\n\",se:\"1\"},ssestream:{bp:\"data: \",bs:\"\\r\\n\",se:\"1\",is:\"1\"}};\nexports.Transport=Class(function(){this.handshake=function(){throw Error(\"handshake Not Implemented\");};this.comet=function(){throw Error(\"comet Not Implemented\");};this.send=function(){throw Error(\"send Not Implemented\");};this.encodePacket=function(){throw Error(\"encodePacket Not Implemented\");};this.abort=function(){throw Error(\"abort Not Implemented\");}});\nvar baseTransport=Class(exports.Transport,function(){this.init=function(){this._aborted=false;this._handshakeArgs={d:\"{}\",ct:\"application/javascript\"}};this.handshake=function(e,f){logger.debug(\"handshake:\",e,f);this._makeRequest(\"send\",e+\"/handshake\",this._handshakeArgs,this.handshakeSuccess,this.handshakeFailure)};this.comet=function(e,f,c,g){logger.debug(\"comet:\",e,f,c,g);args={s:f,a:c};this._makeRequest(\"comet\",e+\"/comet\",args,this.cometSuccess,this.cometFailure)};this.send=function(e,f,c,g,h){logger.debug(\"send:\",\ne,f,g,h);args={d:g,s:f,a:c};this._makeRequest(\"send\",e+\"/send\",args,this.sendSuccess,this.sendFailure)}});\ntransports.xhr=Class(baseTransport,function(e){var f=function(c){logger.debug(\"aborting XHR\");try{if(\"onload\"in c)c.onload=c.onerror=c.ontimeout=null;else if(\"onreadystatechange\"in c)c.onreadystatechange=null;c.abort&&c.abort()}catch(g){logger.debug(\"error aborting xhr\",g)}};this.init=function(){e(this,\"init\");this._xhr={send:createXHR(),comet:createXHR()}};this.abort=function(){this._aborted=true;for(var c in this._xhr)this._xhr.hasOwnProperty(c)&&f(this._xhr[c])};this.encodePacket=function(c,g){return g.indexOf(\"\\u0000\")==\n-1?[c,0,g]:[c,1,base64.encode(g)]};this._onReadyStateChange=function(c,g,h){var a=\"\";try{var d=this._xhr[c];if(d.readyState!=4)return;a=eval(d.responseText);if(d.status!=200){logger.debug(\"XHR failed with status \",d.status);h(d.status,a);return}logger.debug(\"XHR data received\")}catch(b){d=this._xhr[c];logger.debug(\"Error in XHR::onReadyStateChange\",b);h(d.status,a);f(d);logger.debug(\"done handling XHR error\");return}g(a)};this._makeRequest=function(c,g,h,a,d){if(!this._aborted){var b=this._xhr[c],\nj=h.d||null;\"d\"in h&&delete h.d;b.open(\"POST\",g+\"?\"+uri.buildQuery(h));b.setRequestHeader(\"Content-Type\",\"text/plain\");if(\"onload\"in b){b.onload=bind(this,\"_onReadyStateChange\",c,a,d);b.onerror=b.ontimeout=d}else if(\"onreadystatechange\"in b)b.onreadystatechange=bind(this,\"_onReadyStateChange\",c,a,d);b.overrideMimeType&&b.overrideMimeType(\"text/plain; charset=ISO-8859-1\");setTimeout(bind(b,\"send\",j),0)}}});\ntransports.jsonp=Class(baseTransport,function(e){var f=function(){var a=document.createElement(\"iframe\");with(a.style){display=\"block\";width=height=border=margin=padding=\"0\";overflow=visibility=\"hidden\"}a.cbId=0;a.src='javascript:document.open();document.write(\"<html><body></body></html>\")';document.body.appendChild(a);return a},c=function(a){var d=a.contentWindow,b=d.document;logger.debug(\"removing script tags\");b.getElementsByTagName(\"script\");var j=b.getElementsByTagName(\"script\")[0];b=b.getElementsByTagName(\"script\")[1];\nj&&j.parentNode.removeChild(j);b&&b.parentNode.removeChild(b);logger.debug(\"deleting iframe callbacks\");d[\"cb\"+(a.cbId-1)]=function(){};d[\"eb\"+(a.cbId-1)]=function(){}},g=function(a){$setTimeout(function(){a&&a.parentNode&&a.parentNode.removeChild(a)},6E4)};this.init=function(){e(this,\"init\");this._onReady=[];this._isReady=false;this._createIframes()};this._createIframes=function(){if(!document.body)return $setTimeout(bind(this,\"_createIframes\"),100);this._isReady=true;this._ifr={send:f(),comet:f()};\nvar a=this._onReady;this._onReady=[];for(var d=0,b;b=a[d];++d)this._makeRequest.apply(this,b)};this.encodePacket=function(a,d){return[a,1,base64.encode(d)]};this.abort=function(){this._aborted=true;for(var a in this._ifr)if(this._ifr.hasOwnProperty(a)){var d=this._ifr[a];c(d);g(d)}};this._makeRequest=function(a,d,b,j,r){if(!this._isReady)return this._onReady.push(arguments);b.n=Math.random();$setTimeout(bind(this,function(){var n=this._ifr[a],i=n.contentWindow,k=i.document,p=k.body,o=false,l=n.cbId++,\ns=i[\"eb\"+l]=function(q){if(!(q&&q.readyState!=\"loaded\")){o||logger.debug(\"error making request:\",m);c(n);if(!o){logger.debug(\"calling eb\");r.apply(null,arguments)}}};i[\"cb\"+l]=function(){logger.debug(\"successful: \",m,[].slice.call(arguments,0));o=true;logger.debug(\"calling the cb\");j.apply(null,arguments);logger.debug(\"cb called\")};switch(a){case \"send\":b.rs=\";\";b.rp=\"cb\"+l;break;case \"comet\":b.bs=\";\";b.bp=\"cb\"+l;break}var m=d+\"?\"+uri.buildQuery(b);if(BrowserDetect.isWebKit){k.open();k.write('<script src=\"'+\nm+'\"><\\/script>');k.write(\"<script>eb\"+l+\"(false)<\\/script>\")}else{i=k.createElement(\"script\");i.src=m;if(i.onreadystatechange===null)i.onreadystatechange=bind(window,s,i);p.appendChild(i);if(!BrowserDetect.isIE){i=k.createElement(\"script\");i.innerHTML=\"eb\"+l+\"(false)\";p.appendChild(i)}}h()}),0)};var h=BrowserDetect.isFirefox?function(){if(!h.iframe)h.iframe=document.createElement(\"iframe\");if(document.body){document.body.insertBefore(h.iframe,document.body.firstChild);document.body.removeChild(h.iframe)}}:\nfunction(){}});\n", "filePath": "jsio/net/csp/transports.js"},
'std.uri': {"src": "var attrs=[\"source\",\"protocol\",\"authority\",\"userInfo\",\"user\",\"password\",\"host\",\"port\",\"relative\",\"path\",\"directory\",\"file\",\"query\",\"anchor\"];exports.Uri=Class(function(){this.init=function(a,b){var e=exports.parse(a,b);for(c in e)this[\"_\"+c]=e[c]};for(var d=0,c;c=attrs[d];++d)(function(a){var b=a.charAt(0).toUpperCase()+a.slice(1);this[\"get\"+b]=function(){return this[\"_\"+a]};this[\"set\"+b]=function(e){this[\"_\"+a]=e}}).call(this,c);this.toString=this.render=function(){return this._source}});\nexports.buildQuery=function(d){var c=[];for(key in d)c.push(encodeURIComponent(key)+\"=\"+encodeURIComponent(d[key]));return c.join(\"&\")};exports.parseQuery=function(d){d=d.split(\"&\");for(var c=d.length,a={},b=0;b<c;++b){var e=d[b].split(\"=\"),f=decodeURIComponent(e[0]);if(f)a[f]=decodeURIComponent(e[1])}return a};\nvar strictRegex=/^(?:([^:\\/?#]+):)?(?:\\/\\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\\/?#]*)(?::(\\d*))?))?((((?:[^?#\\/]*\\/)*)([^?#]*))(?:\\?([^#]*))?(?:#(.*))?)/,looseRegex=/^(?:(?![^:@]+:[^:@\\/]*@)([^:\\/?#.]+):)?(?:\\/\\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\\/?#]*)(?::(\\d*))?)(((\\/(?:[^?#](?![^?#\\/]*\\.[^?#\\/.]+(?:[?#]|$)))*\\/?)?([^?#\\/]*))(?:\\?([^#]*))?(?:#(.*))?)/,queryStringRegex=/(?:^|&)([^&=]*)=?([^&]*)/g;\nexports.parse=function(d,c){for(var a={},b=(c?strictRegex:looseRegex).exec(d),e=0,f;f=attrs[e];++e)a[f]=b[e]||\"\";var g=a.queryKey={};a.query.replace(queryStringRegex,function(h,i,j){if(h)g[i]=j});return a};exports.isSameDomain=function(d,c){var a=exports.parse(d),b=exports.parse(c);return a.port==b.port&&a.host==b.host&&a.protocol==b.protocol};\n", "filePath": "jsio/std/uri.js"},
'net.protocols.buffered': {"src": "jsio(\"from net.interfaces import Protocol\");jsio(\"from net.buffer import Buffer\");exports.BufferedProtocol=Class(Protocol,function(){this.init=function(){this.buffer=new Buffer};this.bufferUpdated=function(){};this.dataReceived=function(a){this.buffer.append(a);this.bufferUpdated()}});\n", "filePath": "jsio/net/protocols/buffered.js"},
'net': {"src": "jsio(\"import net.env\");jsio(\"import std.JSON as JSON\");JSON.createGlobal();exports.listen=function(a,b,c){if(!b)throw logger.error(\"No transport provided for net.listen\");a=new (net.env.getListener(b))(a,c);a.listen();return a};exports.connect=function(a,b,c){a=new (net.env.getConnector(b))(a,c);a.connect();return a};exports.quickServer=function(a){jsio(\"import net.interfaces\");return new net.interfaces.Server(a)};\n", "filePath": "jsio/net.js"},
'util.browserdetect': {"src": "exports.BrowserDetect=new (function(){function e(c){for(var b=0,a;a=c[b];b++){var f=a.string,h=a.prop;a.identity=a.identity||a.subString;d=a.versionSearch||a.identity;if(f){if(f.indexOf(a.subString)!=-1)return a.identity}else if(h)return a.identity}}function g(c){var b=c.indexOf(d);if(b!=-1)return parseFloat(c.substring(b+d.length+1))}var d,i=[{string:navigator.platform,subString:\"Win\",identity:\"Windows\"},{string:navigator.platform,subString:\"Mac\"},{string:navigator.userAgent,subString:\"iPhone\",identity:\"iPhone/iPod\"},\n{string:navigator.platform,subString:\"Linux\"}];this.browser=e([{string:navigator.userAgent,subString:\"Chrome\"},{string:navigator.userAgent,subString:\"OmniWeb\",versionSearch:\"OmniWeb/\"},{string:navigator.vendor,subString:\"Apple\",identity:\"Safari\",versionSearch:\"Version\"},{prop:window.opera,identity:\"Opera\"},{string:navigator.vendor,subString:\"iCab\"},{string:navigator.vendor,subString:\"KDE\",identity:\"Konqueror\"},{string:navigator.userAgent,subString:\"Firefox\"},{string:navigator.vendor,subString:\"Camino\"},\n{string:navigator.userAgent,subString:\"Netscape\"},{string:navigator.userAgent,subString:\"MSIE\",identity:\"IE\",versionSearch:\"MSIE\"},{string:navigator.userAgent,subString:\"Gecko\",identity:\"Mozilla\",versionSearch:\"rv\"},{string:navigator.userAgent,subString:\"Mozilla\",identity:\"Netscape\",versionSearch:\"Mozilla\"}])||\"unknown\";this.version=g(navigator.userAgent)||g(navigator.appVersion)||\"unknown\";this.OS=e(i)||\"unknown\";this.isWebKit=/ AppleWebKit\\//.test(navigator.userAgent);this[\"is\"+this.browser]=this.version});\n", "filePath": "jsio/util/browserdetect.js"},
'std.utf8': {"src": "exports.UnicodeCodecError=function(a){this.message=a};var UnicodeCodecError=exports.UnicodeCodecError;UnicodeCodecError.prototype.toString=function(){return\"UnicodeCodecError\"+(this.message?\": \"+this.message:\"\")};exports.encode=function(a){try{return unescape(encodeURIComponent(a))}catch(b){throw new UnicodeCodecError(\"invalid input string\");}};\nexports.decode=function(a){if(/[^\\x00-\\xFF]/.test(a))throw new UnicodeCodecError(\"invalid utf-8 bytes\");var b,c;b=c=a.length;if(a.charCodeAt(b-1)>=128){for(var d=1;d<=3;d++)if(a.charCodeAt(b-d)>=192){c=b-d;break}try{decodeURIComponent(escape(a.slice(c)));c=b}catch(e){}}try{return[decodeURIComponent(escape(a.slice(0,c))),c]}catch(f){throw new UnicodeCodecError(\"invalid utf-8 bytes\");}};\n", "filePath": "jsio/std/utf8.js"}
		
	};
	
	function bind(context, method/*, args... */) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function(){
			method = (typeof method == 'string' ? context[method] : method);
			return method.apply(context, args.concat(Array.prototype.slice.call(arguments, 0)));
		}
	}
	
	jsio = bind(this, importer, null, '');
	jsio.__filename = 'jsio.js';
	jsio.modules = [];
	jsio.setCachedSrc = function(pkg, filePath, src) {
		sourceCache[pkg] = { filePath: filePath, src: src };
	}
	jsio.path = {};
	jsio.setPath = function(path) { jsio.path.__default__ = typeof path == 'string' ? [path] : path; }
	jsio.setEnv = function(env) {
		if(ENV && (env == ENV || env == ENV.name)) { return; }
		
		if(typeof env == 'string') {
			switch(env) {
				case 'node':
					ENV = new ENV_node();
					break;
				case 'browser':
				default:
					ENV = new ENV_browser();
					break;
			}
			ENV.name = env;
		} else {
			ENV = env;
		}
		
		jsio.__env = ENV;
		jsio.__dir = ENV.getCwd();
		if(!jsio.path.__default__) { jsio.setPath(ENV.getPath()); }
	}
	
	if (typeof process !== 'undefined' && process.version) {
		jsio.setEnv('node');
	} else if (typeof XMLHttpRequest != 'undefined' || typeof ActiveXObject != 'undefined') {
		jsio.setEnv('browser');
	}
	
	// DONE
	
	/*
	function ENV_abstract() {
		this.global = null;
		this.getCwd = function() {};
		this.getPath = function() {};
		this.eval = function(code, path) {};
		this.findModule = function(pathString) {};
		this.log = function(args...) {};
	}
	*/
	
	function ENV_node() {
		var fs = require('fs'),
			sys = require('sys');
		
		this.global = GLOBAL;
		this.getCwd = process.cwd;
		this.log = function() {
			var msg;
			try {
				sys.error(msg = Array.prototype.map.call(arguments, function(a) {
					if ((a instanceof Error) && a.message) {
						return 'Error:' + a.message + '\nStack:' + a.stack + '\nArguments:' + a.arguments;
					}
					return typeof a == 'string' ? a : JSON.stringify(a);
				}).join(' '));
			} catch(e) {
				sys.error(msg = Array.prototype.join.call(arguments, ' ') + '\n');
			}
			return msg;
		}
		
		this.getPath = function() {
			var segments = __filename.split('/');
			segments.pop();
			return segments.join('/') || '.';
		}
		this.eval = process.compile;
		this.findModule = function(possibilities) {
			for (var i = 0, possible; possible = possibilities[i]; ++i) {
				try {
					possible.src = fs.readFileSync(possible.filePath);
					return possible;
				} catch(e) {
				}
			}
			return false;
		}

		this.require = require;
		this.include = include;
	}
	
	function ENV_browser() {
		var XHR = window.XMLHttpRequest || function() { return new ActiveXObject("Msxml2.XMLHTTP"); }
		
		this.global = window;
		this.global.jsio = jsio;
		
		var SLICE = Array.prototype.slice;
		this.log = function() {
			var args = SLICE.call(arguments, 0);
			if (typeof console != 'undefined' && console.log) {
				if (console.log.apply) {
					console.log.apply(console, arguments);
				} else { // IE doesn't support log.apply, and the argument cannot be arguments - it must be an array
					console.log(args);
				}
			}
			return args.join(' ');
		}
		
		var cwd = null, path = null;
		this.getCwd = function() {
			if(!cwd) {
				var location = window.location.toString();
				cwd = location.substring(0, location.lastIndexOf('/') + 1);
			}
			return cwd;
		}
		
		this.getPath = function() {
			if(!path) {
				try {
					var filename = new RegExp('(.*?)' + jsio.__filename + '(\\?.*)?$');
					var scripts = document.getElementsByTagName('script');
					for (var i = 0, script; script = scripts[i]; ++i) {
						var result = script.src.match(filename);
						if (result) {
							path = result[1];
							if (/^[A-Za-z]*:\/\//.test(path)) { path = makeRelativePath(path, this.getCwd()); }
							break;
						}
					}
				} catch(e) {}
				
				if(!path) { path = '.'; }
			}
			return path;
		}

		// IE6 won't return an anonymous function from eval, so use the function constructor instead
		var rawEval = typeof eval('(function(){})') == 'undefined'
			? function(src, path) { return (new Function('return ' + src))(); }
			: function(src, path) { var src = src + '\n//@ sourceURL=' + path; return window.eval(src); }

		// provide an eval with reasonable debugging
		this.eval = function(code, path) {
			try { return rawEval(code, path); } catch(e) {
				if(e instanceof SyntaxError) {
					e.message = "a syntax error is preventing execution of " + path;
					e.type = "syntax_error";
					try {
						var cb = function() {
							var el = document.createElement('iframe');
							el.style.cssText = "position:absolute;top:-999px;left:-999px;width:1px;height:1px;visibility:hidden";
							el.src = 'javascript:document.open();document.write("<scr"+"ipt src=\'' + path + '\'></scr"+"ipt>")';
							setTimeout(function() {try{document.body.appendChild(el)}catch(e){}}, 0);
						};
						if (document.body) { cb(); }
						else { window.addEventListener('load', cb, false); }
					} catch(f) {}
				}
				throw e;
			}
		}
		
		this.findModule = function(possibilities) {
			for (var i = 0, possible; possible = possibilities[i]; ++i) {
				var xhr = new XHR();
				try {
					xhr.open('GET', possible.filePath, false);
					xhr.send(null);
				} catch(e) {
					ENV.log('e:', e);
					continue; // firefox file://
				}
				
				if (xhr.status == 404 || // all browsers, http://
					xhr.status == -1100 || // safari file://
					// XXX: We have no way to tell in opera if a file exists and is empty, or is 404
					// XXX: Use flash?
					//(!failed && xhr.status == 0 && !xhr.responseText && EXISTS)) // opera
					false)
				{
					continue;
				}
				
				possible.src = xhr.responseText;
				return possible;
			}
			
			return false;
		}
	};
	
	function ensureHasTrailingSlash(str) { return str.length && str.replace(/([^\/])$/, '$1/') || str; }
	function removeTrailingSlash(str) { return str.replace(/\/$/,''); }
	
	function guessModulePath(pathString) {
		// resolve relative paths
		if(pathString.charAt(0) == '.') {
			// count the number of dots
			var i = 0;
			while(pathString.charAt(i + 1) == '.') { ++i; }

			// remove one path segment for each dot from the cwd 
			var prefix = removeTrailingSlash(ENV.getCwd());
			if (i) { prefix = prefix.split('/').slice(0, -i).join('/'); }
			
			return [{filePath: prefix + '/' + pathString.substring(i + 1).split('.').join('/') + '.js'}];
		}
		
		// resolve absolute paths with respect to jsio packages/
		var pathSegments = pathString.split('.'),
			baseMod = pathSegments[0],
			modPath = pathSegments.join('/');
		
		if (baseMod in jsio.path) {
			return [{filePath: ensureHasTrailingSlash(jsio.path[baseMod]) + modPath + '.js'}];
		}
		
		var out = [];
		var paths = typeof jsio.path.__default__ == 'string' ? [jsio.path.__default__] : jsio.path.__default__;
		for (var i = 0, len = paths.length; i < len; ++i) {
			var path = ensureHasTrailingSlash(paths[i]);
			out.push({filePath: path + modPath + '.js', baseMod: baseMod, basePath: path});
		}
		return out;
	}
	
	// load a module from a file
	function loadModule(pathString) {
		var possibilities = guessModulePath(pathString),
			module = ENV.findModule(possibilities);
		if(!module) {
			var paths = [];
			for (var i = 0, p; p = possibilities[i]; ++i) { paths.push(p.filePath); }
			throw new Error("Module not found: " + pathString + " (looked in " + paths.join(', ') + ")");
		}
		
		if (!(module.baseMod in jsio.path)) {
			jsio.path[module.baseMod] = module.basePath;
		}
		
		return module;
	}
	
	function execModule(context, module) {
		var code = "(function(_){with(_){delete _;(function(){" + module.src + "\n}).call(this)}})";
		var fn = ENV.eval(code, module.filePath);
		try {
			fn.call(context.exports, context);
		} catch(e) {
			if(e.type == "syntax_error") {
				throw new Error("error importing module: " + e.message);
			} else if (e.type == "stack_overflow") {
				ENV.log("Stack overflow in", module.filePath, ':', e);
			} else {
				ENV.log("ERROR LOADING", module.filePath, ':', e);
			}
			throw e;
		}
	};
	
	function resolveRelativePath(pkg, path, pathSep) {
		// does the pkg need to be resolved, i.e. is it a relative path?
		if(!path || (pathSep = pathSep || '.') != pkg.charAt(0)) { return pkg; }
		
		var i = 1;
		while(pkg.charAt(i) == pathSep) { ++i; }
		path = path.split(pathSep).slice(0, -i);
		if(path.length) {
			path = path.join(pathSep);
			if(path.charAt(path.length - 1) != pathSep) { path += pathSep; }
		}
		return path + pkg.substring(i);
	}
	
	function resolveImportRequest(path, request) {
		var match, imports = [];
		if((match = request.match(/^(from|external)\s+([\w.$]+)\s+import\s+(.*)$/))) {

			imports[0] = {
				from: resolveRelativePath(match[2], path),
				external: match[1] == 'external', "import": {}
			};
			
			match[3].replace(/\s*([\w.$*]+)(?:\s+as\s+([\w.$]+))?/g, function(_, item, as) {
				imports[0]["import"][item] = as || item;
			});
		} else if((match = request.match(/^import\s+(.*)$/))) {
			match[1].replace(/\s*([\w.$]+)(?:\s+as\s+([\w.$]+))?,?/g, function(_, pkg, as) {
				fullPkg = resolveRelativePath(pkg, path);
				imports[imports.length] = as ? {from: fullPkg, as: as} : {from: fullPkg, as: pkg};
			});
		} else {
			var msg = 'Invalid jsio request: jsio(\'' + request + '\')';
			throw SyntaxError ? new SyntaxError(msg) : new Error(msg);
		}
		return imports;
	};
	
	function makeContext(pkgPath, filePath) {
		var ctx = {
			exports: {},
			global: ENV.global
		};
		
		ctx.jsio = bind(this, importer, ctx, pkgPath);
		if(pkgPath != 'base') {
			ctx.jsio('from base import *');
			ctx.logging.__create(pkgPath, ctx);
		}
		
		// TODO: FIX for "trailing ." case
		var cwd = ENV.getCwd();
		var i = filePath.lastIndexOf('/');
		
		ctx.jsio.__env = jsio.__env;
		ctx.jsio.__dir = i > 0 ? makeRelativePath(filePath.substring(0, i), cwd) : '';
		ctx.jsio.__filename = i > 0 ? filePath.substring(i) : filePath;
		ctx.jsio.__path = pkgPath;
		return ctx;
	};
	
	function makeRelativePath(path, relativeTo) {
		var i = path.match('^' + relativeTo);
		if (i && i[0] == relativeTo) {
			var offset = path[relativeTo.length] == '/' ? 1 : 0
			return path.slice(relativeTo.length + offset);
		}
		return path;
	};
	
	function importer(context, path, request, altContext) {
		context = context || ENV.global;
		var imports = resolveImportRequest(path, request);
		
		// import each item in the request
		for(var i = 0, item, len = imports.length; (item = imports[i]) || i < len; ++i) {
			var pkg = item.from;
			var modules = jsio.modules;
			
			// eval any packages that we don't know about already
			if(!(pkg in modules)) {
				try {
					var module = sourceCache[pkg] || loadModule(pkg);
				} catch(e) {
					ENV.log('\nError executing \'', request, '\': could not load module', pkg, '\n\tpath:', path, '\n\trequest:', request, '\n');
					throw e;
				}
				
				if(!item.external) {
					var newContext = makeContext(pkg, module.filePath);
					execModule(newContext, module);
					modules[pkg] = newContext.exports;
				} else {
					var newContext = {};
					for(var j in item['import']) {
						newContext[j] = undefined;
					}
					execModule(newContext, module);
					modules[pkg] = newContext;
					for(var j in item['import']) {
						if(newContext[j] === undefined) {
							newContext[j] = ENV.global[j];
						}
					}
				}
			}
			
			var c = altContext || context;
			if(item.as) {
				// remove trailing/leading dots
				var segments = item.as.match(/^\.*(.*?)\.*$/)[1].split('.');
				for(var k = 0, slen = segments.length - 1, segment; (segment = segments[k]) && k < slen; ++k) {
					if(!segment) continue;
					if (!c[segment]) { c[segment] = {}; }
					c = c[segment];
				}
				c[segments[slen]] = modules[pkg];
			} else if(item['import']) {
				if(item['import']['*']) {
					for(var k in modules[pkg]) { c[k] = modules[pkg][k]; }
				} else {
					try {
						for(var k in item['import']) { c[item['import'][k]] = modules[pkg][k]; }
					} catch(e) {
						ENV.log('module: ', modules);
						throw e;
					}
				}
			}
		}
	}
})();

jsio("import Orbited as Orbited");
