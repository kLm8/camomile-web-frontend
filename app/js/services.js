'use strict';
angular.module('myApp.services', ['ngResource'])

// http://stackoverflow.com/questions/19472017/angularjs-promise-not-binding-to-template-in-1-2
// getting values from resolved promises can be a problem in recent angularjs versions
// yet, DataRoot and ToolRoot have to be obtained from asynchronous requests
// so instead of classical service solution, we fill the rootScope at starting time (see app.js)
//	.value('DataRoot', 'Placeholder')
//	.value('ToolRoot', 'Placeholder')

    // Service used to get a queue from its ID
	.factory('QueuesBrowser', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/queue/:queueId', {
					queueId: '@queueId'
				},
				{
                    // Return a queue from queue list given the id
					'get': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: false
					}
				}
			);
		}
	])

    // Service used to modify an element of a queue (get will pop the element prom the queue, update will put it as last element of the queue)
	.factory('QueueElementModifier', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/queue/:queueId/next', {
					queueId: '@queueId'
				},
				{
                    // Every time get is called, the returned queue's element got removed from the queue
					'get': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: false
					},
                    // Allows to modify an element of a queue, putting it as last element of the queue
					'update': {
						method: 'PUT',
						withCredentials: true
					}
				}
			);
		}
	])

	.factory('Corpus', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/corpus/:corpusId', {
					corpusId: '@corpusId'
				}, {
					'query': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: true
					}
				});
		}
	])

	.factory('Media', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/media/:mediaId', {
					mediaId: '@mediaId'
				}, {
					'query': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: true
					}
				});
		}
	])

	.factory('Layer', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/layer/:layerId', {
					layerId: '@layerId'
				}, {
					'query': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: true
					}
				});
		}
	])

	.factory('Annotation', ['$resource', '$rootScope',
		function ($resource, $rootScope) {
			return $resource(
				$rootScope.dataroot + '/annotation/:annotationId', {
					annotationId: '@annotationId'
				}, {
					'query': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: true
					}, 'queryForAnUpdate': {
						method: 'GET',
						withCredentials: true,
						format: '.json',
						isArray: false
					},
					'update': {
						method: 'PUT',
						withCredentials: true
					}, 
					'remove': {
						method: 'DELETE',
						withCredentials: true,
						isArray: false
					}
				});
		}
	])

	.factory('CMError', ['$http', '$rootScope',
		function ($http, $rootScope) {
			return {
				diff: function (hypLayers) {
					var url = $rootScope.toolroot + '/error/diff';
					return $http.post(url, hypLayers);
				},
				regression: function (hypLayers) {
					var url = $rootScope.toolroot + '/error/regression';
					return $http.post(url, hypLayers);
				}
			}
		}
	])

	.factory('Session', ['$http', '$rootScope',
		function ($http, $rootScope) {
			return {

				isLogged: false,
				username: undefined,

				login: function (credentials) {
					var url = $rootScope.dataroot + '/login';
					return $http.post(url, credentials, {
						withCredentials: true
					});
				},

				logout: function (credentials) {
					var url = $rootScope.dataroot + '/logout';
					return $http.post(url, credentials, {
						withCredentials: true
					});
				}
			}
		}
	])


	.factory('DateUtils', function () {
		return {
			parseDate: function (nSec) {
				var parseFunc = d3.time.format("%H:%M:%S.%L").parse;

				var secToTime = function (s) {
					function addZ(n) {
						return (n < 10 ? '0' : '') + n;
					}

					var ms = s % 1;
					s = Math.floor(s);
					var secs = s % 60;
					s = (s - secs) / 60;
					var mins = s % 60;
					var hrs = (s - mins) / 60;

					// hack to force ms with 3 decimal parts
					ms = parseFloat(ms.toString()).toFixed(3).slice(2);

					return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
				};

				return parseFunc(secToTime(nSec));
			},
			timestampFormat: function (date) {
				return (d3.time.format("%H:%M:%S.%L"))(date);
			}

		};
	})

	.factory('LangUtils', function () {
		return {
			is_array: function (value) {
				return value &&
					typeof value === 'object' &&
					typeof value.length === 'number' &&
					typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
			}
		};
	})

// palette of categorical colors for use throughout the application.
// was especially thought to avoid confusion with green, red and yellow,
// reserved for other usages (see diff and regressionMapping
	.value('palette', ["#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#A65628", "#F781BF", "#66C2A5",
		"#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#E5C494", "#8DD3C7", "#FFFFB3", "#BEBADA",
		"#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5",
		"#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC",
		"#F2F2F2", "#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC",
		"#CCCCCC" ])

// default values and functions for the application
// the function(){}() pattern allows the definition of a private scope and reusable utilities.
	.value('defaults', function () {
		var keyFunc = function (d) {
			return d.data[0];
		};

		return {
			'keyFunc': keyFunc,
			'tooltip': keyFunc,
			'diffMapping': {
				'colors': {
					"selection_color": "#FF0000",
					"correct": "#00FF00",
					"missed detection": "#E6FF00",
					"false alarm": "#FFE600",
					"confusion": "#FF0000"
				},
				'getKey': keyFunc
			},
			'regressionMapping': {
				'colors': {
					"selection_color": "#FF0000",
					"both_correct": "#FFFF00",
					"both_incorrect": "#666666",
					"improvement": "#00FF00",
					"regression": "#FF0000"
				},
				'getKey': keyFunc
			}
		}
	}());
