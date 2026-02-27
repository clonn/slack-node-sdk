.PHONY: clean install test

clean:
	rm -rf node_modules

install:
	npm install

test:
	./node_modules/.bin/mocha test/
