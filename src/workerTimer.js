self.onmessage = event =>
	{
		setTimeout(function(){
			postMessage({args:event.data.args});
		},event.data.delay);
	}