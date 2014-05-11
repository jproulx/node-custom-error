REPORTER = spec
lint:
	./node_modules/.bin/jshint ./error.js

test:
	@$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -u tdd --reporter $(REPORTER)

test-cov:
	@$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -u tdd --reporter travis-cov

test-all: test test-cov


.PHONY: test
