/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
	.controller('DiffCtrl', ['$sce', '$scope', '$http',
		'CMError', 'defaults', 'palette', '$controller', 'Session', 'camomile2pyannoteFilter', 'pyannote2camomileFilter', '$rootScope', 'camomileService',
		function ($sce, $scope, $http, CMError, defaults, palette, $controller, Session, camomile2pyannoteFilter, pyannote2camomileFilter, $rootScope, camomileService) {

			$controller('ExplorationBaseCtrl',
				{
					$scope: $scope,
					$http: $http,
					defaults: defaults,
					palette: palette,
					Session: Session
				});


			// placeholder definitions
			var defaultReferenceLayer = {
				'label': 'Reference',
				'_id': 'Reference_init',
				'layer': []
			};

			var defaultHypothesisLayer = {
				'label': 'Hypothesis',
				'_id': 'Hypothesis_init',
				'layer': []
			};

			var defaultDiffLayer = {
				'label': 'Difference',
				'_id': 'Difference_init',
				'layer': []
			};

			// model.layers is mapped in cm-timeline using the defaults
			$scope.model.layers = [
				defaultReferenceLayer,
				defaultHypothesisLayer,
				defaultDiffLayer
			];

			// get list of reference annotations from a given layer,
			// replace current reference layer,
			// and update difference with hypothesis when it's done
			$scope.get_reference_annotations = function (corpus_id, medium_id, layer_id, do_update) {

				if(do_update == undefined)
				{
					do_update = true;
				}
				$scope.model.layers[0] = {
					'label': 'Reference',
					'_id': layer_id + "_0"
				};

				camomileService.getAnnotations(function(err, data)
					{
						if(!err)
						{
							$scope.$apply(function(){
								$scope.model.layers[0].layer = data;

								if(do_update)
								{
									$scope.model.layersUpdated = true;
									$scope.compute_diff();
								}
								else if($scope.model.layers[0].layer != undefined && $scope.model.layers[1].layer != undefined)
								{
									$scope.model.layersUpdated = true;
									$scope.compute_diff();
								}
							});
						}
						else
						{
							alert(data.message);
						}

					},
					{
						filter: {
							id_layer: layer_id,
							id_medium: medium_id
						}
					});
			};

			// get list of hypothesis annotations from a given layer,
			// replace current hypothesis layer,
			// and update difference with reference when it's done
			$scope.get_hypothesis_annotations = function (corpus_id, medium_id, layer_id, do_update) {

				if(do_update == undefined)
				{
					do_update = true;
				}
				$scope.model.layers[1] = {
					'label': 'Hypothesis',
					'_id': layer_id + "_1"
				};

				camomileService.getAnnotations(function(err, data)
					{
						if(!err)
						{
							$scope.$apply(function(){
								$scope.model.layers[1].layer = data;
								if(do_update)
								{
									$scope.model.layersUpdated = true;
									$scope.compute_diff();
								}
								else if($scope.model.layers[0].layer != undefined && $scope.model.layers[1].layer != undefined)
								{
									$scope.model.layersUpdated = true;
									$scope.compute_diff();
								}

							});
						}
						else
						{
							alert(data.message);
						}

					},
					{
						filter: {
							id_layer: layer_id,
							id_medium: medium_id
						}
					});
			};

			// recompute difference between reference and hypothesis,
			// and replace diff layer.
			$scope.compute_diff = function () {

				if ($scope.model.selected_medium != undefined
					&& $scope.model.layers[1].layer != undefined
					&& $scope.model.layers[1].layer.length > 0
					&& $scope.model.layers[0].layer != undefined
					&& $scope.model.layers[0].layer.length > 0) {
					var reference_and_hypothesis = {
						'hypothesis': camomile2pyannoteFilter($scope.model.layers[1].layer),
						'reference': camomile2pyannoteFilter($scope.model.layers[0].layer)
					};

					CMError.diff(reference_and_hypothesis).success(function (data) {
						$scope.model.layers[2] = {
							'label': 'Difference',
							'_id': 'Computed_' + $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
							'mapping': defaults.diffMapping,
							'tooltipFunc': defaults.tooltip
						};

						$scope.model.layers[2].layer = pyannote2camomileFilter(data);
						$scope.model.layersUpdated = true;
					});
				}

			};


			$scope.computeLastLayer = function () {
				$scope.compute_diff();
			};


		/*********************************************************************************************************/

			// Videogular
			$scope.API = null;

			$scope.onPlayerReady = function(API) {
				$scope.API = API;
			};

			$scope.updateTime = function(currentTime, duration) {
				$scope.timeline.setCustomTime(currentTime*1000);
				$scope.wavesurfer.seekAndCenter(currentTime*1000/$scope.API.totalTime);
			};

			$scope.updateState = function(state) {
				// if state == 'pause' $scope.pause = true else $scope.pause = false;
			};

		/*********************************************************************************************************/

			// Wavesurfer
			var activeUrl = null;
			$scope.paused = true;

			$scope.$on('wavesurferInit', function (e, wavesurfer) {
				$scope.wavesurfer = wavesurfer;

				$scope.wavesurfer.enableDragSelection({
					// color: randomColor(0.2)
				});
				
				$scope.wavesurfer.on('ready', function () {
					$scope.wavesurfer.zoom(100);
					console.log('Wavesurfer loaded');
				});

				$scope.wavesurfer.on('play', function () {
					$scope.paused = false;
					$scope.$apply();
				});

				$scope.wavesurfer.on('pause', function () {
					$scope.paused = true;
					$scope.$apply();
				});

				$scope.wavesurfer.on('finish', function () {
					$scope.paused = true;
					$scope.wavesurfer.seekTo(0);
					$scope.$apply();
				});

				$scope.wavesurfer.on('seek', function () {
					// $scope.timeline.off();
					// console.log($scope.wavesurfer.getCurrentTime());
					// $scope.API.seekTime($scope.wavesurfer.getCurrentTime());
					$scope.timeline.setCustomTime($scope.wavesurfer.getCurrentTime()*1000);
				});

				$scope.wavesurfer.on('mouseup', function (e) {
					console.log('mouseup');
				});

				$scope.wavesurfer.on('region-click', function(region, e) {
					e.stopPropagation();
					// Play on shift click
					if (e.shiftKey) region.play();
				});

				$scope.wavesurfer.on('region-created', function(region) {
					$scope.wavesurfer.clearRegions();
				});

				$scope.wavesurfer.on('region-updated', (function(region) {
					$scope.items.update({
						id: -1,
						group: 0,
						content: "rename me",
						start: region.start*1000,
						end: region.end*1000
					});
					// console.log($scope.wavesurfer.getCurrentTime());
					$scope.API.seekTime($scope.wavesurfer.getCurrentTime());
					$scope.timeline.setCustomTime($scope.wavesurfer.getCurrentTime()*1000);
				}));

				// $scope.wavesurfer.on('region-removed', saveRegions);
				// $scope.wavesurfer.on('region-in', showNote);

				$scope.wavesurfer.on('region-play', function (region) {
					region.once('out', function () {
						$scope.paused = false;
						$scope.wavesurfer.play(region.start);
						$scope.wavesurfer.pause();
						$scope.paused = true;
					});
				});

				/* Minimap plugin */
				$scope.wavesurfer.initMinimap({
					height: 30,
					waveColor: '#ddd',
					progressColor: '#999',
					cursorColor: '#999'
				});

				$scope.wavesurfer.on('ready', function() {
					var wavesurferTimeline = Object.create(WaveSurfer.Timeline);
					wavesurferTimeline.init({
						wavesurfer: $scope.wavesurfer,
						container: '#wavesurfer-timeline'
					});
				});
			});

			$scope.play = function (url) {
				if (!$scope.wavesurfer) {
					return;
				}

				activeUrl = url;

				console.log('tototototototo');

				$scope.wavesurfer.once('ready', function () {
					$scope.wavesurfer.play();
					$scope.$apply();
				});

				$scope.wavesurfer.load(activeUrl);
			};

			$scope.isPlaying = function (url) {
				return url == activeUrl;
			};

		/*********************************************************************************************************/

			// Vis.js Timeline
			$scope.id = 0;

			$scope.options = {
				editable: {add: true, remove: true, updateGroup: true, updateTime: false},
				onAdd: function (item, callback) {
					item.content = prompt('Enter label for new item:', item.content);
					if (item.content != null) {
						callback(item); // send back adjusted new item
					}
					else {
						callback(null); // cancel item creation
					}
				},
				// onMove: function (item, callback) {
				//   if (confirm('Do you really want to move the item to\n' +
				//       'start: ' + item.start + '\n' +
				//       'end: ' + item.end + '?')) {
				//     callback(item); // send back item as confirmation (can be changed)
				//   }
				//   else {
				//     callback(null); // cancel editing item
				//   }
				// },
				// onMoving: function (item, callback) {
				//   if (item.start < min) item.start = min;
				//   if (item.start > max) item.start = max;
				//   if (item.end   > max) item.end   = max;

				//   callback(item); // send back the (possibly) changed item
				// },
				onUpdate: function (item, callback) {
					content = prompt('Edit label:', item.content);
					if (content != item.content && content != null) {
						item.content = content;
						item.id = $scope.id;
						$scope.id += 1;
						$scope.items.remove(-1);
						callback(item); // send back adjusted item
					}
					else {
						callback(null); // cancel updating the item
					}
				},

				onRemove: function (item, callback) {
					if (confirm('Remove label "' + item.content + '" ?')) {
						callback(item); // confirm deletion
					}
					else {
						callback(null); // cancel deletion
					}
				},
				// showCustomTime: true, // now deprecated, use addCustomeTime() instead
				start: 0,
				min: 0,
				max: 1000*60*10,
				format: {minorLabels: {millisecond:'s[::]SS', second:'m[:]s', minute:'m'}},
				type: 'range',
				showMajorLabels: false,
				// snap: null,
				zoomMax: 1000*60*2, // 2 minutes
				zoomMin: 1000,      // 1 second
				maxHeight: '400px',
				minHeight: '200px',
				groupOrder: function (a, b) {
					return a.value - b.value;
				}
			};

			$scope.groups = new vis.DataSet([
				{id: 0, content: 'First', value: 1},
				{id: 1, content: 'Third', value: 3},
				{id: 2, content: 'Second', value: 2}
			]);

			$scope.items = new vis.DataSet([
				// {id: 0, group: 0, content: 'item 0', start: 0, end: 1000},
				// {id: 2, group: 1, content: 'item 2', start: 1500, end: 2000},
				// {id: 4, group: 1, content: 'item 4', start: 2500, end: 4000},
			]);
			

			$scope.items.on('update', function (event, properties) {
				$scope.API.seekTime(properties.data[0].start/1000);
				$scope.wavesurfer.seekAndCenter(properties.data[0].start/$scope.API.totalTime);
				
				// console.log(properties.data[0]);

				// Update wavesurfer region
				// if ($scope.wavesurfer) {
				// 	$scope.wavesurfer.clearRegions();
				// 	$scope.wavesurfer.addRegion({
				// 		start: properties.data[0].start/1000,
				// 		end: properties.data[0].end/1000
				// 	});
				// }
			});

			$scope.items.on('remove', function (event, properties) {
				$scope.wavesurfer.clearRegions();
			});

			$scope.items.on('*', function (event, properties) {
				// logEvent(event, properties);
			});

			function logEvent(event, properties) {
				msg = 'event=' + JSON.stringify(event) + ', ' + 'properties=' + JSON.stringify(properties);
				console.log(msg);
			};

			$scope.onSelect = function (props) {
				console.log('onSelect');
				var selection = $scope.timeline.getSelection();
				$scope.timeline.focus(selection);

				var x = ((($scope.items.get(selection[0])).start));
				x = Math.round(x * 1000) / 1000;
				console.log(x);

				// $scope.API.seekTime(x/1000);
				$scope.timeline.setCustomTime(x);
				$scope.wavesurfer.seekAndCenter(x/$scope.API.totalTime);				

				// Add region to wavesurfer
				if ($scope.wavesurfer) {
					$scope.wavesurfer.clearRegions();
					$scope.wavesurfer.addRegion({
						start: (($scope.items.get(selection[0])).start)/1000,
						end: (($scope.items.get(selection[0])).end)/1000
					});
				}
			};

			$scope.onClick = function (props) {
				console.log('onClick');
			};

			$scope.onDoubleClick = function (props) {
				console.log('onDoubleClick');
			};

			$scope.onRightClick = function (props) {
				console.log('onRightClick');
			};

			$scope.onload = function (timeline) {
				$scope.timeline = timeline;
				console.log('Timeline loaded');
			};

			$scope.onRangeChange = function (props) {
				console.log('onRangeChange');
			};

			$scope.onRangeChanged = function (props) {
				console.log('onRangeChanged');
				// $scope.API.seekTime((props.time).getTime()/1000);
			};

			$scope.onTimeChange = function (props) {
				console.log('onTimeChange');
				$scope.API.seekTime((props.time).getTime()/1000);
				$scope.wavesurfer.seekAndCenter((props.time).getTime()/$scope.API.totalTime);
			};

			$scope.onTimeChanged = function (props) {
				console.log('onTimeChanged');
				$scope.API.seekTime((props.time).getTime()/1000);
			};

			$scope.events = {
				select: $scope.onSelect,
				click: $scope.onClick,
				doubleClick: $scope.onDoubleClick,
				contextmenu: $scope.onRightClick,
				onload: $scope.onload,
				rangechange: $scope.onRangeChange,
				rangechanged: $scope.onRangeChanged,
				timechange: $scope.onTimeChange,
				timechanged: $scope.onTimeChanged
			};

		/*********************************************************************************************************/


			// the selected corpus has changed
			$scope.$watch('model.selected_corpus', function (newValue, oldValue, scope) {
				if (newValue) {
					scope.get_media(scope.model.selected_corpus);
					// blank the medium selection
					scope.model.selected_medium = undefined;
					$scope.resetSummaryView(true);
				}
			});


			$scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
				// when the medium changes, the viz is reinit, and the select box gets the new layers
				// TODO: no more necessary since all videos have the same layers
//				scope.model.selected_reference = undefined;
//				scope.model.selected_hypothesis = undefined;

				if (newValue) {
					// scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/medium/" + scope.model.selected_medium + "/video");

					if($scope.model.useDefaultVideoPath) {
						$scope.model.video = [{
							src: $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.selected_medium, "webm")),
							type: "video/webm"
						}, {
							src: $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.selected_medium, "mp4")),
							type: "video/mp4"
						}, {
							src: $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.selected_medium, "ogg")),
							type: "video/ogg"
						}];
					}
					else {
						camomileService.getMedium(scope.model.selected_medium, function(err, data) {
							$scope.model.video = [{
								src: $sce.trustAsResourceUrl('http://' + $scope.model.videoPath+ '/' + data.url + 'webm'),
								type: "video/webm"
							}, {
								src: $sce.trustAsResourceUrl('http://' + $scope.model.videoPath+ '/' + data.url + 'mp4'),
								type: "video/mp4"
							}, {
								src: $sce.trustAsResourceUrl('http://' + $scope.model.videoPath+ '/' + data.url + 'ogg"'),
								type: "video/ogg"
							}];
						});
					}

				/*********************************************************************************************************/


					$scope.wavesurfer.load("audio0.wav");

					$scope.data = {groups: $scope.groups, items: $scope.items};


				/*********************************************************************************************************/

					scope.get_layers(scope.model.selected_corpus);

					// re-initialize the reference is needed
					if (scope.model.selected_reference != undefined) {
						$scope.get_reference_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_reference, false);
					}

					// re-initialize the hypothesis is needed
					if (scope.model.selected_hypothesis != undefined) {
						$scope.get_hypothesis_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_hypothesis, false);
					}

					$scope.resetSummaryView(true);

				}
			});

			$scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
				// handle the reinit case
				if (newValue === undefined) {
					scope.model.layers[0] = defaultReferenceLayer;
					scope.compute_diff();
				} else {
					scope.get_reference_annotations(
						scope.model.selected_corpus,
						scope.model.selected_medium,
						scope.model.selected_reference);
					$scope.resetSummaryView(true);
				}
			});

			$scope.$watch('model.layers[0].layer', function () {
				if ($scope.model.layers[0].layer) {
					$scope.items.clear();
					// console.log($scope.model.layers[0].layer);
					for (var i = 0; i < $scope.model.layers[0].layer.length; i++) {
						// console.log(parseInt($scope.browse.annotations[i]['_id'], 16));

						$scope.items.add({
							title: parseInt($scope.model.layers[0].layer[i]['_id'], 16),
							id: i,
							group: 1,
							content: $scope.model.layers[0].layer[i]['data'],
							start: $scope.model.layers[0].layer[i]['fragment']['start']*1000,
							end: $scope.model.layers[0].layer[i]['fragment']['end']*1000
						});
					};
					if ($scope.timeline) $scope.timeline.setWindow(0, 12000);
					$scope.id = $scope.model.layers[0].layer.length;
				}
			});

			$scope.$watch('model.selected_reference === undefined && model.selected_hypothesis === undefined',
				function (newValue, oldValue) {
					// to avoid triggering at init (only case where new and old are both true)
					if (!newValue) {
						$scope.model.restrict_toggle = 1;
					} else if (!oldValue) {
						$scope.model.restrict_toggle = 0;
					}
				});


			$scope.$watch('model.selected_hypothesis', function (newValue, oldValue, scope) {
				// handle the reinit case
				if (newValue === undefined) {
					scope.model.layers[1] = defaultHypothesisLayer;
					scope.compute_diff();
				} else {
					scope.get_hypothesis_annotations(
						scope.model.selected_corpus,
						scope.model.selected_medium,
						scope.model.selected_hypothesis);
					$scope.resetSummaryView(true);
				}
			});

		}]);

