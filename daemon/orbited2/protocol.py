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
    
    def __init__(self, server, rules, sock, addr):
        self._rules = rules
        self._server = server
        self._sock = sock
        self._addr = addr
        self._browser_conns = {}
        
        
    def run(self):
        buffer = ""
        length = -1
        while True:
            data = self._sock.recv(4096)
#            print 'RECV<-Browser', repr(data)
            if not data:
                break
            buffer += data
            # TODO: optimize
            while True:
                if length == -1:
                    if DELIMETER not in buffer: break
                    length, buffer = buffer.split(DELIMETER,1)
                    length = int(length)
                if len(buffer) < length:
                    break
                payload = buffer[:length]
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
            if hasattr(self._sock, 'environ'):
                environ = self._sock.environ
            else:
                environ = {}
            self._browser_conns[id] = BrowserConn(self, environ, self._rules, id)
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
#        print "SEND->Browser", repr(frame)
        self._sock.sendall(frame)
            
class BrowserConn(object):
    
    def __init__(self, protocol, environ, rules, id):
        self._protocol = protocol
        self._environ = environ
        self._rules = rules
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
        err_reason = 'connection timed out'
        with eventlet.timeout.Timeout(CONNECT_TIMEOUT, False):
            try:
                _remote_conn = RemoteConnection(self, handshake, self._environ, self._rules)
                try:
                    _remote_conn.connect()
                    self._remote_conn = _remote_conn
                except Exception, e:
                    err_reason = "Exception: %s" % (e,)
                    _remote_conn.close()
            except Exception, e:
#                raise
                err_reason = "Exception: %s" % (e,)
#                print 'err', err_reason
        if not self._remote_conn:
            print 'err', err_reason
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

def ensure_allowed_and_get_protocol_class(rules, conn):
    for rule in rules:
        if rule.hostname == conn.hostname and rule.port == conn.port:
            if (rule.host_header == '*' or rule.host_header == conn.host_header):
                if rule.protocol == 'ws/hixie75':
                    return WebSocket75Protocol
                if rule.protocol == 'ws/hixie76':
                    return WebSocket76Protocol
                if rule.protocol == 'tcp':
                    return TcpProtocol
            break
#    print 'failed', conn.__dict__
    raise Exception("Unauthorized remote destination; update config to allow access.")

class RemoteConnection(object):
    
    def __init__(self, browser_conn, handshake, environ, rules):
        self._browser_conn = browser_conn
        
        if 'hostname' not in handshake:
            raise Exception("Invalid 'hostname' argument")
        if 'port' not in handshake:
            raise Exception("Invalid 'port' argument")
        if not isinstance(handshake['port'], int):
            raise Exception("Invalid 'port' argument (must be an integer")
        
        
        self.hostname = handshake['hostname']
        self.port = handshake['port']
        self.path = handshake.get('path', '/')
        self.host_header = environ.get('HTTP_HOST', '')
        self.origin = environ.get('HTTP_ORIGIN', '')

        self._msgs = collections.deque()
        self._sendlock = eventlet.semaphore.Semaphore()


        proto_cls = ensure_allowed_and_get_protocol_class(rules, self)
        self.proto = proto_cls(self)
        
        
    def connect(self):
        self.sock = eventlet.connect((self.hostname, self.port))
        self.closed = False
        self.proto.handshake(self.sock)
        
        eventlet.spawn(self._run)


    def _run(self):
        while True:
            msg = self.wait()
            if msg is None:
                break
#            print 'RECV<-Server', repr(msg)
            self._browser_conn.send_frame(msg)
        self._browser_conn.close()

    def wait(self):
        """Waits for and deserializes messages. Returns a single
        message; the oldest not yet processed."""
        while not self._msgs:
            # Websocket might be closed already.
            if self.closed:
                return None
            # no parsed messages, must mean buf needs more data
            delta = self.sock.recv(8192)
            if delta == '':
                self.close()
                return None
            self.proto.recv(delta)
            msgs = self.proto.parse_messages()
            self._msgs.extend(msgs)
        return self._msgs.popleft()
        
    def send(self, msg):
        msg = self.proto.pack_message(msg)
#        print 'SEND->SERVER', repr(msg)
        self._sendlock.acquire()
        try:
            self.sock.sendall(msg)
        finally:
            self._sendlock.release()
        
    def close(self):
        if self.closed:
            return
        self._sendlock.acquire()
        try:
            self.proto.close(self.sock)
        except:
            pass
        finally:
            self._sendlock.release()
        self.closed = True
        try:
            self.sock.shutdown(True)
        except:
            pass
        self.sock.close()               

class TcpProtocol(object):
    
    def __init__(self, conn):
        self.conn = conn
        self._buf = ""
        
    def handshake(self, sock):
        return
    
    def pack_message(self, data):
        return data
    
    def recv(self, data):
        self._buf += data
        
    def parse_messages(self):
        msgs = [self._buf]
        self._buf = ""
        return msgs
        
    def close(self, sock):
        pass


class WebSocket75Protocol(TcpProtocol):
            
    def handshake(self, sock):
        conn = self.conn
        ws_host_header = conn.hostname + (conn.port == 80 and '' or ':' + str(conn.port))
        payload = ('GET %s HTTP/1.1\r\n'
                  'Upgrade: WebSocket\r\n'
                  'Connection: Upgrade\r\n'
                  'Host: %s\r\n'
                  'Origin: %s\r\n'
                  '\r\n') % (conn.path, ws_host_header, conn.origin)
        sock.sendall(payload)
        buf = self._read_response(sock)
        response, buf = buf.split('\r\n\r\n', 1)
        lines = response.split('\r\n')
        self._check_verb(lines[0])
        self._check_upgrade(lines[1])
        self._check_connection(lines[2])
        headers = dict([ line.split(': ') for line in lines[3:] ])
        if headers.get('WebSocket-Origin', '') != conn.origin:
            raise Exception("Invalid server handshake (wrong WebSocket-Origin")

    def _read_response(self, sock):
        buf = ""
        while '\r\n\r\n' not in buf:
            try:
                data = sock.recv(4096)
            except Exception, e:
                raise Exception("Invalid server handshake response. (Error occurred: %s)" % (e,))
            if not data:
                raise Exception("Invalid server handshake (missing \\r\\n\\r\\n)")
            buf += data
            if len(buf) > 4096:
                raise Exception("Invalid server handshake (Too large before \\r\\n\\r\\n)")
        return buf
        
    def _check_verb(self, line):
        if line != "HTTP/1.1 101 Web Socket Protocol Handshake":
            raise Exception("Invalid server handshake (verb line)")

    def _check_upgrade(self, line):
        if line != "Upgrade: WebSocket":
            raise Exception("Invalid server handshake (upgrade header)")

    def _check_connection(self, line):
        if line != "Connection: Upgrade":
            raise Exception("Invalid server handshake (connection header)")
        

    def pack_message(self, message):
        """Pack the message inside ``00`` and ``FF``

        As per the dataframing section (5.3) for the websocket spec
        """
        if isinstance(message, unicode):
            message = message.encode('utf-8')
        elif not isinstance(message, str):
            message = str(message)
        packed = "\x00%s\xFF" % message
        return packed


    def parse_messages(self):
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
        
class WebSocket76Protocol(WebSocket75Protocol):
    
    # TODO: This handshake is a bit ridiculous. I've taken the exact example
    #       Sec-Websocket-Keys from the rev 76 spec, and hard coded them into
    #       my handshake. This will work, but it really isn't want WS clients
    #       should be doing...
    
    def handshake(self, sock):
        conn = self.conn
        ws_host_header = conn.hostname + (conn.port == 80 and '' or ':' + str(conn.port))
        payload = ('GET %s HTTP/1.1\r\n'
                  'Upgrade: WebSocket\r\n'
                  'Connection: Upgrade\r\n'
                  'Sec-WebSocket-Key2: 12998 5 Y3 1  .P00\r\n'
                  'Sec-WebSocket-Key1: 4 @1  46546xW%%0l 1 5\r\n'
                  'Host: %s\r\n'
                  'Origin: %s\r\n'
                  '\r\n^n:ds[4U') % (conn.path, ws_host_header, conn.origin)
        sock.sendall(payload)
        buf = self._read_response(sock)
        response, buf = buf.split('\r\n\r\n', 1)
#        print 'RESPONSE:', response.replace('\r', '\\r').replace('\n', '\\n\n')
        lines = response.split('\r\n')
        self._check_verb(lines[0])
        self._check_upgrade(lines[1])
        self._check_connection(lines[2])
        headers = dict([ line.split(': ') for line in lines[3:] ])
        if headers.get('Sec-WebSocket-Origin', '') != conn.origin:
            raise Exception("Invalid server handshake (wrong WebSocket-Origin)")
        
        while len(buf) < 16:
            try:
                data = sock.recv(4096)
            except Exception, e:
                raise Exception("Invalid server handshake response. (Error occurred: %s)" % (e,))
            if not data:
                raise Exception("Invalid server handshake (missing 16 byte security key body)")
        security_key = buf[:16]
        if security_key != "8jKS'y:G*Co,Wxa-":
            print repr(security_key), '!=', repr("8jKS'y:G*Co,Wxa-")
            raise Exception("Invalid server handshake (wrong 16 byte security key)")
        self._buf = buf[16:]
    def close(self, sock):
        sock.sendall(self.pack_message(""))