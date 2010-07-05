=============
Configuration
=============

Orbited2 takes a single command line argument, -c (or --config) and the file location of your config file. The default is orbited2.cfg. This config file has two directives.

Overview
========

A user would run:
    
.. code-block:: none

    user@host:~# orbited2 --config /etc/orbited2.cfg

A configuration example:
    
..  code-block:: python

    # Contents of /etc/orbited2.cfg
    
    # Access Control

    RemoteDestination(
        name="ws_echo", # for logging purposes
        hostname="127.0.0.1", 
        port=8083, 
        host_header = '*', # let any scripts from anywhere access this remote destination
        protocol="ws/hixie76" # normalize outgoing connections to WebSocket draft 76
    )

    # Listen
    
    Listen (
        port=8000,
        interface="0.0.0.0" # bind to all ports
    )



RemoteDestination
=================

The RemoteDestination directive specifies a remote server that Orbited2 will proxy to. If a webpage tries to use Orbited2 to open a connection to a remote destination that has no corresponding RemoteDestination directive, the connection will be denied. You may have as many remote destinations as you like, so long as they are each given a unique name.

name (required)
---------------

Unique name for logging purposes

hostname (required)
-------------------

Destination hostname. This is a string that may represent either an ip address or a hostname.

port (required)
---------------

Destination port; an integer.

host_header (required)
----------------------

All connections to this remote destination via orbited will only be authorized if the "Host" header in the initial HTTP request matches the value of this rule. This value should just be the domain name of your website, in most cases. For testing purposes you may put a '*' here.

protocol
--------

The outgoing protocol. The default is "ws/hixie76". Valid options are: "tcp", "ws/hixie75", and "ws/hixie76". We will support new versions of the WebSocket protocol as they are released. 

If you are using the Orbited.TCPSocket javascript api, then the value of protocol must be 'tcp'.

If you are using the Orbited.WebSocket.install javascript api, the `protocolVersion` value given there should match the revision number given here.


Listen
======

The Listen directive specifies an interface and port where Orbited2 should listen, as well as a set of protocols it should listen for. You may have as many Listen directives as you like. An example

.. sourcecode:: python

    Listen (
        port=8000,
        interface="0.0.0.0"
    )


interface (required)
--------------------

A string representing the interface that hookbox should bind to.


port (required)
---------------

An integer specifying the port that hookbox should bind to.

