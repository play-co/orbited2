jsio('from net.protocols.buffered import BufferedProtocol')
jsio('import net');
jsio('import std.uri as Uri');
jsio('import std.JSON');
jsio('import std.utf8 as utf8');
jsio('import lib.Enum as Enum');

exports.logging = logging;
exports.logger = logger;

//logger.setLevel(0)

var originalWebSocket = window.WebSocket;


var baseUri = new Uri(window.location);

var defaultOrbitedUri;

function setup() {
	var scripts = document.getElementsByTagName('script'),
		target = 'Orbited.js',
		re = new RegExp('(^|/)' + target + '$');
	
	for (var i = 0, script; script = scripts[i]; ++i) {
		var src = script.src;
		if (re.test(src)) {
			var uri = new Uri(src.substring(0, src.length - target.length));
			defaultOrbitedUri = ((uri.getProtocol() || baseUri.getProtocol())
					+ "://"
					+ (uri.getHost() || baseUri.getHost()) + ":"
					+ (uri.getPort() || baseUri.getPort() || '80')
					+ (uri.getPath() || baseUri.getPath()));
			break;
		}
	}
}

setup();

// TCPSocket code

var READY_STATE = Enum({
	WAITING: -1,
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
});

exports.TCPSocket = Class(function() {
	
	this.init = function(opts) {
		this._orbitedUri  = opts.orbitedUri || defaultOrbitedUri;
		if (!/\/$/.test(this._orbitedUri)) {
			this._orbitedUri += '/';
		}
		this.readyState = READY_STATE.WAITING;
		this._buffer = "";
		this._forceTransport = opts.forceTransport;
	}
	
	this.open = function(host, port, isBinary) {
		if (!this._orbitedUri) {
			throw new Error("Could not automatically determine Orbited's uri, and Orbited.TCPSocket.opts.orbitedUri was not manually specified in TCPSocket constructor");
		}
		var multiplexer = getMultiplexer(this._orbitedUri, this._forceTransport);
		this._isBinary = !!isBinary;
		this._host = host;
		this._port = port;
		this._conn = multiplexer.openConnection();
		this._conn.onOpen = bind(this, _onOpen);
		this._conn.onFrame = bind(this, _onFrame);
		this._conn.onClose = bind(this, _onClose);
		this.readyState = READY_STATE.CONNECTING;
	}
	
	var _onClose = function() {
		if (this.readyState == READY_STATE.CLOSED) { return; }
		this.readyState = READY_STATE.CLOSED;
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
			case READY_STATE.CONNECTING:
				if (payload == '1') {
					this.readyState = READY_STATE.OPEN;
					bind(this, _trigger)('open');
				} else {
					this._onClose();
				}
				break;
			case READY_STATE.OPEN:
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
		if (this.readyState >= READY_STATE.CLOSING) { return; }
		if (!this._isBinary) {
			data = utf8.encode(data)
		}
		this._conn.send(data);
	}
	
	this.close = function() {
		if (this.readyState >= READY_STATE.CLOSING) { return; }
		this.readyState = READY_STATE.CLOSING;
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
		this.readyState = READY_STATE.CONNECTING;
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
		if (this.readyState >= READY_STATE.CLOSING) { return; }
		data = utf8.encode(data);
		this._conn.send(data);
	}
	
	var _onClose = function() {
		if (this.readyState == READY_STATE.CLOSED) { return; }
		this.readyState = READY_STATE.CLOSED;
		releaseMultiplexer();
		bind(this, _trigger)('close');
	}
	
	var _onOpen = function() {
		var uri = new Uri(this.URL);
		this._conn.send(JSON.stringify({
			hostname: uri.getHost(),
			port: parseInt(uri.getPort()) || (uri.getProtocol() == 'ws' ? 80 : 443),
			path: uri.getPath() || "/",
			protocol: 'ws_' + exports.WebSocket.opts.protocolVersion
		}));
	}
	
	var _onFrame = function(payload) {
		switch(this.readyState) {
			case READY_STATE.CONNECTING:
				if (payload == '1') {
					this.readyState = READY_STATE.OPEN;
					bind(this, _trigger)('open');
				} else {
					this._onClose();
				}
				break;
			case READY_STATE.OPEN:
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
		if (this.readyState >= READY_STATE.CLOSING) { return; }
		this.readyState = READY_STATE.CLOSING;
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

function getMultiplexer(baseUri, forceTransport) {
	logger.debug('getMultiplexer', baseUri, forceTransport);
	if (!multiplexer) {
		multiplexer = new OrbitedMultiplexingProtocol(baseUri);
		multiplexer.onClose = function() {
			multiplexer = null;
		}
		// TODO: Choose transport
		var _transport = forceTransport;
		if (!_transport) {
			if (!!originalWebSocket) { _transport = 'ws'; }
			else { _transport = 'csp'; }
		}
		logger.debug('_transport is', _transport);
		switch(_transport) {
			case 'ws':
				var uri = new Uri(baseUri);
				uri.setProtocol('ws');
				var url = uri.render() + 'ws';
				logger.debug('connecting with ws')
				net.connect(multiplexer, 'websocket', { url: url, wsConstructor: originalWebSocket });
				multiplexer.connectionLost = bind(multiplexer, '_connectionLost', 'websocket');
				multiplexer.mode = 'ws';
				break;
			case 'csp':
				logger.debug('connecting with csp')
				net.connect(multiplexer, 'csp', { url: baseUri + 'csp' });
				multiplexer.mode = 'csp';
				multiplexer.connectionLost = bind(multiplexer, '_connectionLost', 'csp');
				break;
		}
	}
	
	++count;
	return multiplexer;
}

function releaseMultiplexer() {
	if (--count == 0) {
		
		multiplexer.transport.loseConnection();
		multiplexer = null;
	}
}

var FRAME = Enum({
	'OPEN': 0, 
	'CLOSE': 1, 
	'DATA': 2
});
DELIMITER = ',';

var Connection = Class(function() {
	
	this.init = function(multiplexer, id) {
		this._multiplexer = multiplexer;
		this._id = id;
	}
	
	this.send = function(data) {
		this._id = id;
		this._multiplexer.sendFrame(this._id, FRAME.DATA, data);
	}
	this.close = function() {
		this._multiplexer.closeConnection(this._id);
	}
	
	this.onFrame = function(data) { }
	this.onClose = function(code) {}
	this.onOpen = function() {}
	
});



var OrbitedMultiplexingProtocol = Class(BufferedProtocol, function(supr) {
	
	this.init = function(baseUri) {
		supr(this, 'init', arguments);
		this._baseUri = baseUri;
		this._connections = {};
		this._last_id = -1;
		this._size = -1;
		this._connected = false;
	}

	this.openConnection = function() {
		logger.debug('opening multiplexing connection');
		var id = ++this._last_id;
		var conn = this._connections[id] = new Connection(this, id);
		if (this._connected) {
			logger.debug('already opened, triggering now');
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
		logger.debug('_sendOpen', id, FRAME.OPEN);
		KKK = FRAME;
		JJJ = FRAME.OPEN;
		this.sendFrame(id, FRAME.OPEN);
	}
	this._sendClose = function(id) {
		this.sendFrame(id, FRAME.CLOSE);
	}

	this.sendFrame = function(id, type, payload) {
		payload = payload || "";
		if (!this._connected) {
			throw new Error("Multiplexer not connected");
		}
		var idPayload = id + DELIMITER + type + DELIMITER + payload;
		var frame = idPayload.length + DELIMITER + idPayload;
		logger.debug('frame:', frame, 'id:', id, 'type:', type, 'payload:', payload);
		this.transport.write(frame);
	}
	
	this.connectionMade = function() {
		logger.debug('connectionMade on multiplexer');
		this._connected = true;
//		this.transport.setEncoding('plain');
		for (id in this._connections) {
			this._sendOpen(id);
		}
	}
	
	//callback 
	this.onClose = function() { }

	this._connectionLost = function(transportName, reason, wasConnected) {
		if (!wasConnected) {
			if (transportName == 'websocket') {
				net.connect(this, 'csp', {url: this._baseUri + 'csp' });
				this.connectionLost = bind(this, '_connectionLost', 'csp');
				this.mode = 'csp';
			}
		} else {
			this.onClose();
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
			case FRAME.OPEN:
				conn.onOpen();
				break;
			case FRAME.CLOSE:
				delete this._connections[id];
				conn.onClose();
				break;
			case FRAME.DATA:
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
