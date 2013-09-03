/** Dispatch.js (C) Pixelspark, 2013
Author: Tommy van der Vorst (tommy@pixelspark.nl).

Dispatch.js provides coroutine-based execution machinery. A coroutine is represented in ES6
as a generator function which yields after starting lengthy asynchronous operations. By using
a special 'resume' object, dispatch.js will resume execution where we left off as soon as the 
callback is completed.

Use as follows:
dispatch(function*(resume) {
	yield setTimeout(resume(), 1000);
	var x = yield someOtherAsyncOperation(resume());
});

If a callback is set (second parameter) it is called when the job is complete (which makes
nesting dispatches easy). If more than two parameters are set, the function will be called
with those parameters plus the resume function added as last parameter.

Note that there are two ways to call another dispatched function. One is by using dispatch
in conjunction with resume (e.g. yield dispatch(someOtherFunction, paramA, paramB resume())).
The other (which is probably more readable) is to use delegated yield, i.e.: 
yield* someOtherFunction(paramA, paramB);.

It is possible to fire off two asynchronous operations at the same time and wait for both
to be completed in parallel. In order to do this, simply call two asynchronous functions
without yielding, and then afterwards 'yield null' as much times as there are outstanding
asynchronous operations. The following example should take ten seconds to complete, not 55:

for(var a=0; a<10; a++) setTimeout(resume(), 1000*(a+1)); // spawn
for(var a=0; a<10; a++) yield null; // wait until all is done

Note that the return values of the yields are currently not guaranteed to be in-order.

If you want to use a dispatched function as a callback, simply use the dispatch.callback 
helper function, which will create a function that dispatches the given coroutine function
each time it is called. The coroutine will be called with all the callback's parameters,
to which the resume function is appended:

HTTP.createServer(Dispatch.callback(function*(req, res, resume) {
	yield setTimeout(resume(), 1000);
	res.end("Hello world");
})).listen(7887);
**/
function dispatch(job, callback) {
	// Did we receive more than two arguments?
	var jobArguments = [];
	if(arguments.length>0) {
		jobArguments = Array.prototype.slice.call(arguments);
		jobArguments.shift();
		callback = jobArguments.pop();
	}

	function resume() {
		if(arguments.length>0) throw new Error("use the resume function to create a callback, not as the callback itself (e.g. setTimeout(resume(),1000) instead of setTimeout(resume, 1000)).");
		var called = false;
		
		return function() {
			if(called) throw new Error("resume callback was called more than once");
			called = true;
			var a = arguments;
			setImmediate(function() { step.apply(this, a); });
		};
	}

	function step(err, value) {
		if(err) {
			return it.throw(new Error(err));
		}
		
		var returnValue = value;
		if(arguments.length!=2) {
			returnValue = Array.prototype.slice.call(arguments);
			returnValue.shift();
		}
		
		var v = it.next(returnValue);
		if(v.done) {
			return callback ? callback(null, v.value) : null;
		}
	}
	
	jobArguments.push(resume);
	var it = job.apply(this, jobArguments);
	step();
}

dispatch.callback = function(body) {
	return function() {
		// Make sure all parameters passed to this callback proxy are forwarded to dispatch
		var args = Array.prototype.slice.call(arguments);
		args.unshift(body);
		args.push(null);
		dispatch.apply(body, args);
	}
};

module.exports = dispatch;