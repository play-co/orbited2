============
Introduction
============

Overview
========

Orbited2's purpose is to ease the development of Websocket-based applications by normalizing the protocol and api across varying browser and server implementations. 


 #. Choose a WebSocket server framework/library (like node.js, or eventlet.)
 #. Write a WebSocket application.
 #. Deploy Orbited2. It will put a normalized Websocket API in *all* browsers.



The Problem
-----------

WebSocket is a far better real-time web protocol than anything we've seen so far, but it only works in a couple of the latest browsers. Additionally, the protocol is so new that it changes very quickly; a WebSocket application you write today might well stop working tomorrow. Further compounding the problem are the multitude of entrenched intermediaries, namely forward proxies, reverse proxies,  firewalls, virus scanners, and more -- these obstacles will intercept and deny WebSocket connections.

The Solution
------------

This code works in *all* browsers, and it will always use the best communication mechanism possible.

.. sourcecode:: javascript

    Orbited2.WebSocket.install({
        protocolVersion: "hixie76",
    })

    var ws = new WebSocket('ws://example.com/app')

 
Installation
============

Orbited2 is written in python and depends on setuptools for installation. The fastest way to install hookbox is to type: 

.. sourcecode:: none

    # easy_install orbited2


If you are missing python or setuptools, please refer to the following links:

* `install python <http://python.org/download>`_
* `install setuptools <http://peak.telecommunity.com/DevCenter/EasyInstall#installation-instructions>`_

To confirm your installation succeeded, type:

.. sourcecode:: none

    # orbited2 --help

Github
======

The development version of Orbited2 is located on github:

* http://github.com/mcarter/orbited2

You can get a copy of the latest source by cloning the repository:

.. sourcecode:: none

    # git clone git://github.com/mcarter/orbited2.git


To install Orbited2 from source, ensure you have python and setuptools, then run:


.. sourcecode:: none

    # cd orbited2/daemon
    # python setup.py install
