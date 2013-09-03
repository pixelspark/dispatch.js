# dispatch.js

Dispatch.js provides coroutine-based execution machinery. A coroutine is represented in ES6
as a generator function which yields after starting lengthy asynchronous operations. By using
a special 'resume' object, dispatch.js will resume execution where we left off as soon as the 
callback is completed.


## Prerequisites

Dispatch.js works in any JavaScript environment that supports modules and ES6 generations. To
use it in NodeJS, start Node with the '--harmony' command line flag.

## Usage

Use as follows:

````javascript
var dispatch = require("dispatch");
dispatch(function*(resume) {
	yield setTimeout(resume(), 1000);
	var x = yield someOtherAsyncOperation(resume());
	console.log(x);
});
````

The above would be equivalent to:

````javascript
setTimeout(function() {
	someOtherAsyncOperation(function(err, x) {
		console.log(x);
	});
}, 1000);
````

Although the dispatch-based code is a little longer, it eliminates the nested callback mess
that will emerge in more complex pieces of code. 

## Documentation

The dispatch function requires a generator function as its first parameter. Any subsequent
parameters are passed on to the function when it is executed, except for the last one, which
is used as a callback to signal the completion of execution of the function.

There are two ways to call another dispatched function from inside dispatch. The dispatch 
function accepts a callback that is called when the execution of the dispatched function 
completes. Calls to dispatched functions can therefore be nested by using dispatch in 
conjunction with resume. The other way (which is probably more readable) is to use delegated
yield. The following are thus equivalent:

````javascript
var dispatch = require("dispatch");
yield dispatch(someOtherFunction, paramA, paramB resume());
yield* someOtherFunction(paramA, paramB);
````

It is possible to fire off two asynchronous operations at the same time and wait for both
to be completed in parallel. In order to do this, simply call two asynchronous functions
without yielding, and then afterwards 'yield null' as much times as there are outstanding
asynchronous operations. The following example should take ten seconds to complete, not 55:

````javascript
for(var a=0; a<10; a++) setTimeout(resume(), 1000*(a+1)); // spawn
for(var a=0; a<10; a++) yield null; // wait until all is done
````

Note that the return values of the yields are currently not guaranteed to be in-order.

If you want to use a dispatched function as a callback, simply use the dispatch.callback 
helper function, which will create a function that dispatches the given coroutine function
each time it is called. The coroutine will be called with all the callback's parameters,
to which the resume function is appended:

````javascript
var dispatch = require("dispatch");
HTTP.createServer(dispatch.callback(function*(req, res, resume) {
	yield setTimeout(resume(), 1000);
	res.end("Hello world");
})).listen(7887);
````

Dispatch will ensure that its callbacks are always only ever called once. This goes for 
callbacks created with dispatch.callback as well as the functions returned from resume().

## Contact
- Tommy van der Vorst
- Twitter: [@tommyvdv](http://twitter.com/tommyvdv)
- Web: [http://pixelspark.nl](http://pixelspark.nl)

## License

### The MIT License
Copyright (c) 2013 [Pixelspark](http://pixelspark.nl)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.