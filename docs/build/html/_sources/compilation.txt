===========
Compilation
===========

Curious users may wish to modify the source code and recompile Orbited2. Here's how, courtesy of Niklas.

1. Check-out js.io from github (https://github.com/gameclosure/js.io)
2. Make a symlink from js.io/jsio to /usr/bin/jsio (for easier use)
3. Enter daemon/orbited/js_src and make sure your orbited.pkg looks something like this:

.. code-block:: none

    {
       "root": "./Orbited2",
       "externalName": "Orbited2",
       "transports": ["csp", "websocket"],
       "environments": ["browser"],
       "additional_dependancies": [ ]
    }

4. Compile the source (while in js_src) with:

.. code-block:: none

    jsio compile Orbited2.pkg -o Orbited2-new.js

5. You're done. Celebrate!