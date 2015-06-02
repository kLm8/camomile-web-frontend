angular.module('myApp.directives')
    .directive('cmWavesurfer', [function () {
    	return {
            restrict: 'E',

            link: function ($scope, $element, $attrs) {
                $element.css('display', 'block');

                var options = angular.extend({ container: $element[0] }, {
                    waveColor: 'violet',
                    progressColor: 'purple',
                    cursorColor: 'navy',
                    height: '100'
                });

                var wavesurfer = WaveSurfer.create(options);

                if ($attrs.url) {
                    wavesurfer.load($attrs.url, $attrs.data || null);
                }

                $scope.$emit('wavesurferInit', wavesurfer);
            }
        };
    }]);
