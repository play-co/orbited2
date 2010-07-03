import collections
import sys
import urlparse
try:
    import json
except:
    import simplejson as json

import eventlet

DELIMETER = ','

FRAME_OPEN = 0
FRAME_CLOSE = 1
FRAME_DATA = 2
CONNECT_TIMEOUT = 30

class OrbitedProtocol(object):
    
    def __init__(self, server, sock, addr):
        self._server = server
        self._sock = sock
        self._addr = addr
        self._browser_conns = {}
        eventlet.spawn(self._run)
        
    def _run(self):
        buffer = ""
        length = -1
        while True:
            data = self._sock.recv(4096)
#            print "READ:", repr(data)
            if not data:
                break
            buffer += data
            # TODO: optimize
            if length == -1:
                if DELIMETER not in buffer: continue
                length, buffer = buffer.split(DELIMETER,1)
#                print 'str length', repr(length)
                length = int(length)
#                print 'set length to', length
            if len(buffer) < length:
                continue
            payload = buffer[:length]
#            print 'buffer', repr(buffer)
#            print 'length', length
#            print 'payload', repr(payload)
            buffer = buffer[length:]
            length = -1
            self._dispatch_payload(payload)
            
            
    def _dispatch_payload(self, payload):
        try:
            id, frame_type, data = payload.split(DELIMETER, 2)
            frame_type = int(frame_type)
        except Exception, e:
            raise
            return
        if frame_type == FRAME_OPEN:
            if id in self._browser_conns:
                # ERROR
                return
            self._browser_conns[id] = BrowserConn(self, id)
        else:
            if id not in self._browser_conns:
                # ERROR
                return
            self._browser_conns[id].on_frame(frame_type, data)
            
            
    def send_frame(self, id, frame_type, data=""):
        if isinstance(data, unicode):
            data = data.encode('utf-8', 'replace')
        payload = str(id) + ',' + str(frame_type) + ',' + data
        frame = str(len(payload)) + ',' + payload
#        print "WRITE:", repr(frame)
        self._sock.send(frame)
            
class BrowserConn(object):
    
    def __init__(self, protocol, id):
        self._protocol = protocol
        self._id = id
        self._protocol.send_frame(id, FRAME_OPEN)
        self._state = 'initial'
        self._remote_conn = None
        
    def on_frame(self, frame_type, data):
        if frame_type == FRAME_DATA:
            self._process_frame(data)
        elif frame_type == FRAME_CLOSE:
            self.close()

    def close(self, reason=""):
        if self._state == 'closed':
            return
        self._state = 'closed'
        self._protocol.send_frame(self._id, FRAME_CLOSE, reason)
        
        
    def send_frame(self, data):
        self._protocol.send_frame(self._id, FRAME_DATA, data)
        
    def _connect(self, handshake):
        protocol = handshake.pop('protocol', 'tcp')
        if protocol == 'tcp':
            conn_class = RemoteTcpConnection
        elif protocol == 'ws_hixie75':
            conn_class = RemoteWS75Connection
        elif protocol == 'ws_hixie76':
            conn_class = RemoteWS76Connection
        else:
            self.close('Invalid protocol')
            
        err_reason = 'connection timed out'
        with eventlet.timeout.Timeout(CONNECT_TIMEOUT, False):
            try:
                self._remote_conn = conn_class(handshake, self)
            except Exception, e:
                err_reason = "Exception: %s" % (e,)
        if not self._remote_conn:
            self.close(err_reason)
        self.send_frame('1')
        self._state = 'open'
        
        
    def _process_frame(self, data):
        if self._state == 'initial':
            try:
                handshake = json.loads(data)
            except Exception, e:
            # Protocol Error
                self.close("Invalid handshake (malformed json)")
            else:
                eventlet.spawn(self._connect, handshake)
                self._state = 'connecting'
                
        elif self._state == 'open':
            self._remote_conn.send(data)
        else:
            # Protocol Error
            self.close()

class RemoteTcpConnection(object):
    def __init__(self, handshake, browser_conn):
        self._handshake = handshake
        self._browser_conn = browser_conn
        self._protocol = handshake.get('protocol', 'tcp')
        self._sendlock = eventlet.semaphore.Semaphore()
        self.connect()
        
    def connect(self):
        if 'hostname' not in self._handshake:
            raise Exception("Invalid 'hostname' argument")
        if 'port' not in self._handshake:
            raise Exception("Invalid 'port' argument")
        self._sock = eventlet.connect((self._handshake['hostname'], self._handshake['port']))
        self._connected = True
        eventlet.spawn(self._run)
        
    def _run(self):
        try:
            while self._connected:
                data = self._sock.recv(8192)
                if not data:
                    self.close()
                    return
                self._browser_conn.send_frame(data)
        except:
            raise
            self.close()
        
    def send(self, data):
#        print 'SENDING', data
        self._sendlock.acquire()
        try:
            self._sock.sendall(data)
        finally:
            self._sendlock.release()
            
    def close(self):
        self._sock.shutdown(True)
        self._sock.close()        
        self._connected = False
        
        
class RemoteWS75Connection(RemoteTcpConnection):
    """Based on eventlet.websocket"""
    
    def __init__(self, handshake, browser_conn):
        self._handshake = handshake
        self._browser_conn = browser_conn
        self._protocol = handshake.get('protocol', 'tcp')
        
        self.version = 75
        self._msgs = collections.deque()
        self._sendlock = eventlet.semaphore.Semaphore()
        self._buf = ""
        
        self.connect()
        self.websocket_closed = False
        eventlet.spawn(self._run)
        
        
    def _run(self):
        while True:
            msg = self.wait()
            if msg is None:
                break
            self._browser_conn.send_frame(msg)
        self._browser_conn.close()
    def connect(self):
        if 'url' not in self._handshake:
            raise Exception("Invalid 'url' argument")
        if 'origin' not in self._handshake:
            raise Exception("Missing origin page")
        parsed = urlparse.urlparse(self._handshake['url'])
        if not parsed.hostname:
            raise Exception("Invalid hostname in 'url' argument")
        if parsed.scheme == 'wss':
            raise Exception("wss not supported yet. Use ssl for the browser->orbited connection, and it'll be secure.")
        if parsed.scheme != 'ws':
            raise Exception('invalid url scheme')
        port = parsed.port or 80
        self.socket = eventlet.connect((parsed.hostname, port))
        self._ws_handshake(parsed)


    # TODO: secure origin somehow (delve into csp stack, I guess...)
    def _ws_handshake(self, url):
        port = url.port or 80
        host  = url.hostname + (port == 80 and '' or ':' + str(port))
        print 'a'
        payload = ('GET %s HTTP/1.1\r\n'
                  'Upgrade: WebSocket\r\n'
                  'Connection: Upgrade\r\n'
                  'Host: %s\r\n'
                  'Origin: %s\r\n'
                  '\r\n') % (url.path or '/', host, self._handshake['origin'])
        print 'payload', payload
        self.socket.sendall(payload)
        buf = ""
        while '\r\n\r\n' not in buf:
            try:
                data = self.socket.recv(4096)
            except:
                raise Exception("Invalid server handshake response: ")
            if not data:
                raise Exception("Invalid server handshake a")
            buf += data
            print 'buf', repr(buf)
            if len(buf) > 4096:
                raise Exception("Invalid server handshake b")
        response, buf = buf.split('\r\n\r\n', 1)
        lines = response.split('\r\n')
        if lines[0] != "HTTP/1.1 101 Web Socket Protocol Handshake":
            raise Exception("Invalid server handshake (verb line)")
        if lines[1] != "Upgrade: WebSocket":
            raise Exception("Invalid server handshake (upgrade header)")
        if lines[2] != "Connection: Upgrade":
            raise Exception("Invalid server handshake (connection header)")
        headers = dict([ line.split(': ') for line in lines[3:] ])
        if headers.get('WebSocket-Origin', '') != self._handshake['origin']:
            raise Exception("Invalid server handshake (wrong WebSocket-Origin")


    # Following 5-6 methods are borrowed from eventlet's WebSocket implementation

    def send(self, message):
        """Send a message to the browser.  *message* should be
        convertable to a string; unicode objects should be encodable
        as utf-8."""
        packed = self._pack_message(message)
        # if two greenthreads are trying to send at the same time
        # on the same socket, sendlock prevents interleaving and corruption
        self._sendlock.acquire()
        try:
            self.socket.sendall(packed)
        finally:
            self._sendlock.release()
        
    def _pack_message(self, message):
        """Pack the message inside ``00`` and ``FF``

        As per the dataframing section (5.3) for the websocket spec
        """
        if isinstance(message, unicode):
            message = message.encode('utf-8')
        elif not isinstance(message, str):
            message = str(message)
        packed = "\x00%s\xFF" % message
        return packed

    def wait(self):
        """Waits for and deserializes messages. Returns a single
        message; the oldest not yet processed."""
        while not self._msgs:
            # Websocket might be closed already.
            if self.websocket_closed:
                return None
            # no parsed messages, must mean buf needs more data
            print 'ws recv'
            delta = self.socket.recv(8192)
            print 'WS RECV:', repr(delta)
            if delta == '':
                self.close()
                return None
            self._buf += delta
            msgs = self._parse_messages()
            self._msgs.extend(msgs)
        return self._msgs.popleft()

    def close(self):
        """Forcibly close the websocket; generally it is preferable to
        return from the handler method."""
        self.socket.shutdown(True)
        self.socket.close()        
        self.websocket_closed = True

    def _parse_messages(self):
        """ Parses for messages in the buffer *buf*.  It is assumed that
        the buffer contains the start character for a message, but that it
        may contain only part of the rest of the message.

        Returns an array of messages, and the buffer remainder that
        didn't contain any full messages."""
        msgs = []
        end_idx = 0
        buf = self._buf
        while buf:
            frame_type = ord(buf[0])
            if frame_type == 0:
                # Normal message.
                end_idx = buf.find("\xFF")
                if end_idx == -1: #pragma NO COVER
                    break
                msgs.append(buf[1:end_idx].decode('utf-8', 'replace'))
                buf = buf[end_idx+1:]
            elif frame_type == 255:
                # Closing handshake.
                assert ord(buf[1]) == 0, "Unexpected closing handshake: %r" % buf
                self.websocket_closed = True
                break
            else:
                raise ValueError("Don't understand how to parse this type of message: %r" % buf)
        self._buf = buf
        return msgs
'''

    def _process(self):
        self._buffer = ""
        while self._connected:
            try:
                data = self._recv_channel.get()
            except Exception, e:
                self._frame_channel.put(e)
                break
            print 'deal with', repr(data)
            if not data:
                self._frame_channel.put(Exception("connection closed"))
            self._buffer += data
            self._process_websocket()
'''
"""
       GET /demo HTTP/1.1
        Host: example.com
        Connection: Upgrade
        Sec-WebSocket-Key2: 12998 5 Y3 1  .P00
        Sec-WebSocket-Protocol: sample
        Upgrade: WebSocket
        Sec-WebSocket-Key1: 4 @1  46546xW%0l 1 5
        Origin: http://example.com

        ^n:ds[4U


# If it's new-version, we need to work out our challenge response
        if self.protocol_version == 76:
            key1 = self._extract_number(environ['HTTP_SEC_WEBSOCKET_KEY1'])
            key2 = self._extract_number(environ['HTTP_SEC_WEBSOCKET_KEY2'])
            # There's no content-length header in the request, but it has 8
            # bytes of data.
            environ['wsgi.input'].content_length = 8
            key3 = environ['wsgi.input'].read(8)
            key = struct.pack(">II", key1, key2) + key3
            response = md5(key).digest()
        
        # Start building the response
        if self.protocol_version == 75:
            handshake_reply = ("HTTP/1.1 101 Web Socket Protocol Handshake\r\n"
                               "Upgrade: WebSocket\r\n"
                               "Connection: Upgrade\r\n"
                               "WebSocket-Origin: %s\r\n"
                               "WebSocket-Location: ws://%s%s\r\n\r\n" % (
                    environ.get('HTTP_ORIGIN'),
                    environ.get('HTTP_HOST'),
                    environ.get('PATH_INFO')))
        elif self.protocol_version == 76:
            handshake_reply = ("HTTP/1.1 101 Web Socket Protocol Handshake\r\n"
                               "Upgrade: WebSocket\r\n"
                               "Connection: Upgrade\r\n"
                               "Sec-WebSocket-Origin: %s\r\n"
                               "Sec-WebSocket-Protocol: %s\r\n"
                               "Sec-WebSocket-Location: ws://%s%s\r\n"
                               "\r\n%s"% (
                    environ.get('HTTP_ORIGIN'),
                    environ.get('HTTP_SEC_WEBSOCKET_PROTOCOL', 'default'),
                    environ.get('HTTP_HOST'),
                    environ.get('PATH_INFO'),
                    response))
"""