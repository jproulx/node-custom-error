test:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket -u tdd --reporter spec
.PHONY: test
