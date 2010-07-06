import os
import eventlet
import eventlet.websocket
import csp_eventlet
import protocol
import static
from paste.urlmap import URLMap

class OrbitedServer(object):

    def __init__(self, config):
        self._config = config
        self._csp_sock = csp_eventlet.Listener()
        self._init_listen_rules()
        
    def _init_listen_rules(self): 
        self._wsgi_apps = {}
        static_path = os.path.join(os.path.split(os.path.abspath(__file__))[0], 'static')
        for rule in self._config.rules['Listen']:
            wsgi_app = URLMap()
            wsgi_app['/static'] = static.Cling(static_path)            
            if 'ws' in rule.protocols:
                wsgi_app['/ws'] = eventlet.websocket.WebSocketWSGI(self._wsgi_websocket)
            if 'csp' in rule.protocols:
                wsgi_app['/csp'] = self._csp_sock
            self._wsgi_apps[(rule.interface, rule.port)] = wsgi_app


    def run(self):
        for (iface, port), app in self._wsgi_apps.items():
            print "Orbited listening on http://%s:%s" % (iface or "0.0.0.0", port)
            eventlet.spawn(eventlet.wsgi.server, eventlet.listen((iface,port)), app, log=EmptyLogShim())
        ev = eventlet.event.Event()        
        eventlet.spawn(self._run, ev)
        return ev

    def _run(self, ev):
        while True:
            try:
                csp_sock, addr = self._csp_sock.accept()
                eventlet.spawn(self._accepted, csp_sock, addr)
            except:
                ev.send_exception(*sys.exc_info())
                break

    def _accepted(self, sock, addr=None):
        p = protocol.OrbitedProtocol(self, self._config.rules['RemoteDestination'], sock, addr)
        p.run()
        
    def _wsgi_websocket(self, ws):
        self._accepted(SockWebSocketWrapper(ws))


class SockWebSocketWrapper(object):
    def __init__(self, ws):
        self._ws = ws
        
    def recv(self, num):
        # not quite right (ignore num)... but close enough for our use.
        data = self._ws.wait()
        if data:
            data = data.encode('utf-8')
        return data

    def send(self, data):
        self._ws.send(data)
        return len(data)

    def sendall(self, data):
        self.send(data)

    def __getattr__(self, key):
        return getattr(self._ws, key)

class EmptyLogShim(object):
    def write(self, *args, **kwargs):
        return