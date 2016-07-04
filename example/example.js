var npd = new (require('../'));

npd.detectNoisyParts('./app/audio/mickey.ogg', function(err, noisyParts) {
	console.log(noisyParts);
});
