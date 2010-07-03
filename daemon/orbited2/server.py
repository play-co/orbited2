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
        self._wsgi_app = URLMap()
        self._wsgi_app['/csp'] = self._csp_sock
        self._wsgi_app['/ws'] = self._wsgi_websocket
        static_path = os.path.join(os.path.split(os.path.abspath(__file__))[0], 'static')
        self._wsgi_app['/static'] = static.Cling(static_path)
        
#        self._framed_sock = framed_sock.Listener(self._csp_sock)
        
        self.port = 8000
        self.interface = '127.0.0.1'
        self._bound_socket = None

    def run(self):
        if not self._bound_socket:
            self._bound_socket = eventlet.listen((self.interface, self.port))
        # TODO: get the interface/port from the bound socket
        print "Orbited listening on http://%s:%s" % (self.interface or "0.0.0.0", self.port)
        
        eventlet.spawn(eventlet.wsgi.server, self._bound_socket, self._wsgi_app, log=EmptyLogShim())
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
        protocol.OrbitedProtocol(self, sock, addr)

    @eventlet.websocket.WebSocketWSGI
    def _wsgi_websocket(self, sock):
        self._accepted(sock)


class EmptyLogShim(object):
    def write(self, *args, **kwargs):
        return