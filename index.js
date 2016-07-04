var pcm = require('pcm');

var NoisyPartsDetector = function(options) {
  // configuration
  options = options || {};
  this.minNoiseAmplitude = options.minNoiseAmplitude || 0.05;
  this.sampleRate = options.sampleRate || 44100;
  this.minSilentDurationSecs = options.minSilentDurationSecs || 0.2;
  this.minSilentSamples = this.sampleRate * this.minSilentDurationSecs;
}

/**
 * callback takes two arguments: function(err, noisyPartsArray) {...}
 */
NoisyPartsDetector.prototype.detectNoisyParts = function(file, callback) {
  var start = 0;
  var index = 0;
  var lowCount = 0;
  var silentPart = [];

  pcm.getPcmData(file, { "stereo": true, "sampleRate": this.sampleRate },
    function(sample, channel) {
      // Sample is from [-1.0...1.0], channel is 0 for left and 1 for right
      if (channel == 0) {
        if (Math.abs(sample) < this.minNoiseAmplitude) {
          // silent part
          if (lowCount == 0) {
            start = index;
          }
          ++lowCount;
        } else {
          // noisy part
          if (lowCount > this.minSilentSamples) {
            silentPart.push(start);
            silentPart.push(index);
          }
          lowCount = 0;
        }
        ++index;
      }
    }.bind(this),
    function(err, output) {
      if (err) {
        callback(err, null);
        return;
      }
      if (lowCount > this.minSilentSamples) {
        silentPart.push(start);
        silentPart.push(index - 1);
      }
      var noisyPart = [];
      var offset = 0;
      for (var i = 0; i < silentPart.length; i += 2) {
        if (silentPart[i] > offset) {
          noisyPart.push(offset / this.sampleRate);
          noisyPart.push(silentPart[i] / this.sampleRate);
        }
        offset = silentPart[i + 1];
      }
      if (offset < index - 1) {
        noisyPart.push(offset / this.sampleRate);
        noisyPart.push((index - 1) / this.sampleRate);
      }
      noisyPart = noisyPart.map(function(t) {
        return t * 1000;
      })
      if (callback) callback(null, noisyPart);
    }.bind(this)
  );
}

module.exports = NoisyPartsDetector;
