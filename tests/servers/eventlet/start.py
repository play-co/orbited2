import eventlet
from eventlet import wsgi
from eventlet import websocket
import static
from paste.urlmap import URLMap

# demo app
import os
import random

@websocket.WebSocketWSGI
def handle(ws):
    """  This is the websocket handler function.  Note that we 
    can dispatch based on path in here, too."""
    print 'HANDLE!', ws.path
    while True:
        print 'calling ws.wait'
        m = ws.wait()
        print 'GOT', m
        if m is None:
            break
        ws.send(m)
                  

def listen_tcp():
    def handle(client):
        while True:
            data = client.recv(1024)
            if not data: break
            client.sendall(data)
    server = eventlet.listen(('localhost', 8014))
    print "Now listening echo:8014"
    pool = eventlet.GreenPool(10000)
    
    while True:
        new_sock, address = server.accept()
        pool.spawn_n(handle, new_sock)
    
def main():
    app = URLMap()
    app['/echo'] = handle
    static_path = os.path.join(os.path.split(os.path.abspath(__file__))[0], 'static')
    app['/'] = static.Cling(static_path)

    # run an example app from the command line            
    listener = eventlet.listen(('localhost', 8013))
    print "\nListening http://localhost:8013/ in your websocket-capable browser.\n"
    eventlet.spawn(listen_tcp)
    wsgi.server(listener, app)
    
if __name__ == "__main__":
    main()