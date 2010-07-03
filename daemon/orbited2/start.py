import server
import config

def main():
    c = config.OrbitedConfig()
    s = server.OrbitedServer(c)
    ev = s.run()
    try:
        ev.wait()
    except KeyboardInterrupt:
        print "Caught Ctr-C; Closing."
if __name__ == "__main__":
    main()
    