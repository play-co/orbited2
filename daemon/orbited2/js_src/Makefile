all:
	jsio_compile Orbited.pkg -j jsio -o ../static/Orbited.js -d
	jsio_compile Orbited.pkg -j jsio -o ../static/Orbited.min.js -g
	cp ../static/Orbited.min.js ../static/Orbited.min.js.bak
	rm ../static/Orbited.min.js.gz
	gzip ../static/Orbited.min.js
	mv ../static/Orbited.min.js.bak ../static/Orbited.min.js
clean:
	rm ../static/*.js
	rm ../static/*.js.gz
