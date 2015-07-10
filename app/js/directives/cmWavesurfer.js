angular.module('myApp.directives')
	.directive('cmWavesurfer', [function () {
		return {
			restrict: 'E',

			link: function ($scope, $element, $attrs) {
				$element.css('display', 'block');

				var options = angular.extend({ container: $element[0] }, {
					// backend: 'MediaElement',
					waveColor: 'violet',
					progressColor: 'purple',
					cursorColor: 'navy',
					height: '100'
				});

				var wavesurfer = WaveSurfer.create(options);

				/* Progress bar */
				(function () {
					var progressDiv = document.querySelector('#progress-bar');
					var progressBar = progressDiv.querySelector('.progress-bar');

					var showProgress = function (percent) {
						progressDiv.style.display = 'block';
						progressBar.style.width = percent + '%';
					};

					var hideProgress = function () {
						progressDiv.style.display = 'none';
					};

					wavesurfer.on('loading', showProgress);
					wavesurfer.on('ready', hideProgress);
					wavesurfer.on('destroy', hideProgress);
					wavesurfer.on('error', hideProgress);
				}());

				if ($attrs.url) {
					wavesurfer.load($attrs.url, $attrs.data || null);
				}

				$scope.$emit('wavesurferInit', wavesurfer);
			}
		};
	}]);
