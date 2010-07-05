import server
import config
import sys
import logging


def main():
    logging.basicConfig()
    c = config.OrbitedConfig(sys.argv)
    s = server.OrbitedServer(c)
    ev = s.run()
    try:
        ev.wait()
    except KeyboardInterrupt:
        print "Caught Ctr-C; Closing."
if __name__ == "__main__":
    main()
    