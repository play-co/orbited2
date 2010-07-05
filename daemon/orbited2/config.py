from optparse import OptionParser
import logging
import sys
from collections import defaultdict

ALLOWED_INCOMING_PROTOCOLS = [ 'ws', 'csp' ]

ALLOWED_REMOTE_PROTOCOLS = [ 'ws/hixie75', 'ws/hixie76', 'tcp' ]



class ConfigException(Exception):
    pass

class OrbitedConfig(object):
    logger = logging.getLogger('config')
    def __init__(self, args):
        config = self._parse_args(args)
        self._load_config(config)
        
    def _parse_args(self, args):
        parser = OptionParser()
        parser.add_option("-c", "--config", dest="config", type="string", default="./orbited2.cfg", metavar="PATH", help="Location of config file specified by PATH")
        options, args = parser.parse_args(args)
        return options.config
        
    def _load_config(self, dest):
        try:
            raw_config = open(dest, 'r').read()
        except IOError, e:
            self.logger.error("Could not load configuration file, %s" % (e,))
            sys.exit(1)
        exec(raw_config)
        """, {
            'Listen': Listen,
            'RemoteDestination': RemoteDestination
        })"""
        self.rules = ConfigBase.items


class ConfigBase(object):
    items = defaultdict(lambda: [])

    def __init__(self, *args, **kwargs):
        self.items[self.__class__.__name__].append(self)

    def __repr__(self):
        import pprint
        pp = pprint.PrettyPrinter()
        return pp.pformat(self.__dict__)

class Listen(ConfigBase):
    def __init__(self,
        port=8000,
        protocols=['ws', 'csp'],
        interface='127.0.0.1'
    ):
        ConfigBase.__init__(self)
        if not isinstance(port, int):
            raise Exception("port must be an integer")
        for protocol in protocols:
            if protocol not in ALLOWED_INCOMING_PROTOCOLS:
                raise Exception("protocol must be one of %s" % (ALLOWED_INCOMING_PROTOCOLS,))
        if not isinstance(interface, str):
            raise Exception("interface must be a string")
        
        self.port = port
        self.protocols = protocols
        self.interface=interface
        
class RemoteDestination(ConfigBase):
    def __init__(self, 
        name=None,
        hostname=None,
        port=None,
        host_header=None,
        protocol='ws/hixie76'
    ):
        ConfigBase.__init__(self)
        if not name:
            raise ConfigException("name required")
        if not isinstance(name, str):
            raise ConfigException("name must be a string")
        
        if not hostname:
            raise ConfigException("hostname required")
        if not isinstance(hostname, str):
            raise ConfigException("hostname must be a string")

        if not port:
            raise ConfigException("portrequired")
        if not isinstance(port, int):
            raise ConfigException("port must be an integer")
        
        if not host_header:
            raise ConfigException("host_header required")
        if not isinstance(host_header, str):
            raise ConfigException("host_header must be a string")
        if protocol not in ALLOWED_REMOTE_PROTOCOLS:
            raise ConfigException("invalid protocol, please choose one of: %s" % (ALLOWED_PROTOCOLS,))
        
        self.name = name
        self.hostname = hostname
        self.port = port
        self.host_header = host_header
        self.protocol = protocol
