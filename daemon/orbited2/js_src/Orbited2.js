jsio('from net.protocols.buffered import BufferedProtocol')
jsio('import net');
jsio('import std.uri');
jsio('import std.JSON');
jsio('import std.utf8 as utf8');


var originalWebSocket = window.WebSocket;


var baseUri = new std.uri.Uri(window.location);

var defaultOrbitedUri;

function setup() {
	var scripts = document.getElementsByTagName('script');
	for (var i = 0, script; script = scripts[i]; ++i) {
		var MATCH_STRING = 'Orbited.js'
		if (script.src.match('(^|/)' + MATCH_STRING + '$')) {
			found = true;
			var uri = new std.uri.Uri(script.src.substring(0, script.src.length-MATCH_STRING.length));
			defaultOrbitedUri = ((uri.getProtocol() || baseUri.getProtocol()) + "://" +
					(uri.getHost() || baseUri.getHost()) + ":" + (uri.getPort() || baseUri.getPort() || '80') +
					(uri.getPath() || baseUri.getPath()));
			break;
		}
	}
}
setup();




// TCPSocket code

var READYSTATE_WAITING = -1;
var READYSTATE_CONNECTING = 0;
var READYSTATE_OPEN = 1;
var READYSTATE_CLOSING = 2;
var READYSTATE_CLOSED = 3;

exports.TCPSocket = Class(function() {
	
	this.init = function(opts) {
		this._orbitedUri  = opts.orbitedUri || defaultOrbitedUri;
		if (!this._orbitedUri.match('/$')) {
			this._orbitedUri += '/';
		}
		this.readyState = READYSTATE_WAITING;
		this._buffer = "";
	}
	
	this.open = function(host, port, isBinary) {
		if (!this._orbitedUri) {
			throw new Error("Could not automatically determine Orbited's uri, and Orbited.TCPSocket.opts.orbitedUri was not manually specified in TCPSocket constructor");
		}
		var multiplexer = getMultiplexer(this._orbitedUri);
		this._isBinary = !!isBinary;
		this._host = host;
		this._port = port;
		this._conn = multiplexer.openConnection();
		this._conn.onOpen = bind(this, _onOpen);
		this._conn.onFrame = bind(this, _onFrame);
		this._conn.onClose = bind(this, _onClose);
		this.readyState = READYSTATE_CONNECTING;
	}
	
	var _onClose = function() {
		if (this.readyState == READYSTATE_CLOSED) { return; }
		this.readyState = READYSTATE_CLOSED;
		releaseMultiplexer();
		bind(this, _trigger)('close');
	}
	
	var _onOpen = function() {
		this._conn.send(JSON.stringify({
			hostname: this._host,
			port: this._port,
			protocol: 'tcp'
		}));
	}
	
	var _onFrame = function(payload) {
		switch(this.readyState) {
			case READYSTATE_CONNECTING:
				if (payload == '1') {
					this.readyState = READYSTATE_OPEN;
					bind(this, _trigger)('open');
				} else {
					this._onClose();
				}
				break;
			case READYSTATE_OPEN:
				this._buffer += payload;
				var result = utf8.decode(this._buffer);
				payload= result[0];
				this._buffer = this._buffer.slice(result[1]);
				if (payload.length) {
					bind(this, _trigger)('read', payload);
				}
				break;
		}
	}
	
	this.send = function(data) {
		if ( this.readyState >= READYSTATE_CLOSING) { return; }
		if (!this._isBinary) {
			data = utf8.encode(data)
		}
		this._conn.send(data);
	}
	
	this.close = function() {
		if (this.readyState >= READYSTATE_CLOSING) { return; }
		this.readyState = READYSTATE_CLOSING;
		this._conn.close();
		this._conn.onClose = bind(this, '_onClose');
	}

	var _trigger = function(signal, data) {
		// TODO: use real signal handlers and real events
		var fn = this['on' + signal];
		if (fn) {
			fn.call(this, data);
		}
	}

	
});

// WebSocket code

exports.WebSocket = Class(function() {
	
	this.init = function(url, protocol) {
		// TODO: what do we do with protocol?
		this.URL = url;
		this.readyState = READYSTATE_CONNECTING;
		this.bufferedAmount = 0;
		var multiplexer = getMultiplexer(exports.WebSocket.opts.orbitedUri);
		this._conn = multiplexer.openConnection();
		this._conn.onOpen = bind(this, _onOpen);
		this._conn.onFrame = bind(this, _onFrame);
		this._conn.onClose = bind(this, _onClose);
		
		// Callbacks
		this.onclose = null;
		this.onerror = null;
		this.onmessage = null;
		this.onopen = null;
		
	}
	
	this.send = function(data) {
		if ( this.readyState >= READYSTATE_CLOSING) { return; }
		data = utf8.encode(data);
		this._conn.send(data);
	}
	
	var _onClose = function() {
		if (this.readyState == READYSTATE_CLOSED) { return; }
		this.readyState = READYSTATE_CLOSED;
		releaseMultiplexer();
		bind(this, _trigger)('close');
	}
	
	var _onOpen = function() {
		var uri = new std.uri.Uri(this.URL);
		this._conn.send(JSON.stringify({
			hostname: uri.getHost(),
			port: parseInt(uri.getPort()) || (uri.getProtocol() == 'ws' ? 80 : 443),
			path: uri.getPath() || "/",
			protocol: 'ws_' + exports.WebSocket.opts.protocolVersion
		}));
	}
	
	var _onFrame = function(payload) {
		switch(this.readyState) {
			case READYSTATE_CONNECTING:
				if (payload == '1') {
					this.readyState = READYSTATE_OPEN;
					bind(this, _trigger)('open');
				} else {
					this._onClose();
				}
				break;
			case READYSTATE_OPEN:
				var result = utf8.decode(payload);
				// TODO: what about result[1] (leftover) ?
				// TODO: what about "U+FFFD REPLACEMENT CHARACTER" ?
				bind(this, _trigger)('message', result[0]);
				break;
		}
	}
	
	var _trigger = function(signal, data) {
		// TODO: use real signal handlers and real events
		var fn = this['on' + signal];
		if (fn) {
			fn.call(this, { data: data});
		}
	}
	
	this.close = function() {
		if (this.readyState >= READYSTATE_CLOSING) { return; }
		this.readyState = READYSTATE_CLOSING;
		this._conn.close();
		this._conn.onClose = bind(this, _onClose);
	}
	
	
});


var installed = false;
exports.WebSocket.install = function(opts) {
	if (installed) {
		throw new Error("orbited.Websocket already installed");
	}
	validateOpts(opts);
	exports.WebSocket.opts = opts;
	installed = true;
	if (!opts.forceProxy && hasNativeWebSocket(opts.protocolVersion)) {
		return;
	}
	window.WebSocket = exports.WebSocket;
	window.WebSocket.__original__ = originalWebSocket;
}

function validateOpts(opts) {
	opts.protocolVersion = opts.protocolVersion || 'hixie76';
	opts.forceProxy = !!opts.forceProxy;
	if (!opts.orbitedUri) {
		opts.orbitedUri = defaultOrbitedUri;
	}
	if (!opts.orbitedUri) {
			throw new Error("orbitedUri not specified; unable to auto-detect it based on script tag includes");
	}
	if (!opts.orbitedUri.match('/$')) {
		opts.orbitedUri += '/';
	}
}

function hasNativeWebSocket(rev) {
	// Actually detect different revisions. This could get complicated...
	
	if (!originalWebSocket) { return false; }
	if (!rev) { return true; }
	if (navigator.userAgent.match("Chrome/5")) {
		return rev == 'hixie75';
	}
	if (navigator.userAgent.match("Chrome/6")) {
		return rev == 'hixie76';
	}
	if (navigator.userAgent.match("Version/5\.0 Safari")) {
		return rev == 'hixie75';
	}
	// unknown.. when in doubt, say no.
	return false;
}


// Multiplexing Connection Code (shared between TCPSocket and WebSocket)

var multiplexer = null;
var count = 0;

function getMultiplexer(baseUri) {
	if (!multiplexer) {
		multiplexer = new OrbitedMultiplexingProtocol();
		multiplexer.onClose = function() {
			multiplexer = null;
		}
		// TODO: Choose transport
		
		if (!!originalWebSocket) { 
			var uri = new std.uri.Uri(baseUri);
			uri.setProtocol('ws');
			var url = uri.render() + 'ws';
			net.connect(multiplexer, 'websocket', { url: url, constructor: originalWebSocket });
			multiplexer.mode = 'ws';
		}
		else { // Fallback ot csp
			net.connect(multiplexer, 'csp', { url: baseUri + 'csp' });
			multiplexer.mode = 'csp';
		}
	}
	count+=1;
	return multiplexer;
}

function releaseMultiplexer() {
	if (--count == 0) {
		
		multiplexer.transport.loseConnection();
		multiplexer = null;
	}
}

var OPEN_FRAME = 0;
var CLOSE_FRAME = 1;
var DATA_FRAME = 2;
DELIMITER = ',';

var Connection = Class(function() {
	
	this.init = function(multiplexer, id) {
		this._multiplexer = multiplexer;
		this._id = id;
	}
	
	this.send = function(data) {
		this._id = id;
		this._multiplexer.sendFrame(this._id, DATA_FRAME, data);
	}
	this.close = function() {
		this._multiplexer.closeConnection(this._id);
	}
	
	this.onFrame = function(data) { }
	this.onClose = function(code) {}
	this.onOpen = function() {}
	
});



var OrbitedMultiplexingProtocol = Class(BufferedProtocol, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);
		this._connections = {};
		this._last_id = -1;
		this._size = -1;
		this._connected = false;
	}

	this.openConnection = function() {
		var id = ++this._last_id;
		var conn = this._connections[id] = new Connection(this, id);
		if (this._connected) {
			this._sendOpen(id);
		}
		return conn;
	}
	this.closeConnection = function(id) {
		var conn = this._connections[id];
		if (!conn) { return; }
		if (this._connected) {
			this._sendClose(id);
		}
	}
	this._sendOpen = function(id) {
		this.sendFrame(id, OPEN_FRAME);
	}
	this._sendClose = function(id) {
		this.sendFrame(id, CLOSE_FRAME);
	}

	this.sendFrame = function(id, type, payload) {
		payload = payload || "";
		if (!this._connected) {
			throw new Error("Multiplexer not connected");
		}
		var idPayload = id + DELIMITER + type + DELIMITER + payload;
		var frame = idPayload.length + DELIMITER + idPayload;
		this.transport.write(frame);
	}
	
	this.connectionMade = function() {
		this._connected = true;
//		this.transport.setEncoding('plain');
		for (id in this._connections) {
			this._sendOpen(id);
		}
	}
	
	//callback 
	this.onClose = function() { }
	
	this.connectionLost = function() {
		this.onClose();
		for (id in this._connections) {
			this._connections[id].onClose();
		}
		
	}

	this._dispatchPayload = function(payload) {
		var i = payload.indexOf(DELIMITER);
		if (i == -1) { return; } // ERR 
		var id = parseInt(payload.substring(0,i))
		var j = payload.indexOf(DELIMITER, i+1);
		if (j == -1) { return; } // ERR 
		var frameType = parseInt(payload.substring(i+1,j));
		var data = payload.substring(j+1);
		var conn = this._connections[id];
		if (!conn || typeof(frameType) != 'number') {
			return; // ERR
		}
		switch(frameType) {
			case OPEN_FRAME:
				conn.onOpen();
				break;
			case CLOSE_FRAME:
				delete this._connections[id];
				conn.onClose();
				break;
			case DATA_FRAME:
				conn.onFrame(data);
				break;
		}
	}
	
	this.bufferUpdated = function() {
		while (true) {
			if (this._size == -1) {
				if (this.buffer.hasDelimiter(DELIMITER)) {
					this._size = parseInt(this.buffer.consumeToDelimiter(DELIMITER));
					this.buffer.consumeBytes(DELIMITER.length);
				} else {
					// Wait for delimiter
					break;
				}
			}
			
			if (!this.buffer.hasBytes(this._size)) {
				// Wait for more bytes
				break;
			}
			
			var payload = this.buffer.consumeBytes(this._size);
			this._dispatchPayload(payload);
			this._size = -1;
		}
	}
	
});