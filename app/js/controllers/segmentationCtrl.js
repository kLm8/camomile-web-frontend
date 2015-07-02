/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
	.controller('SegmentationCtrl', ['$sce', '$scope', '$http',
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

			// get list of reference annotations from a given layer
			$scope.get_annotations = function (corpus_id, medium_id, layer_id) {
				camomileService.getAnnotations(function(err, data) {
					if(!err) {
						$scope.$apply(function() {
							$scope.model.current_layer = data;
						});
					}
					else {
						console.log('dommage');
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

		/*********************************************************************************************************/

			// Videogular
			$scope.API = null;

			$scope.onPlayerReady = function(API) {
				$scope.API = API;
			};

			$scope.updateTime = function(currentTime, duration) {
				$scope.timeline.setCustomTime(currentTime*1000);
				$scope.wavesurfer.seekTo(currentTime*1000/$scope.API.totalTime);
			};

			$scope.updateState = function(state) {
				// ...
			};

		/*********************************************************************************************************/

			// Wavesurfer
			var activeUrl = null;

			$scope.$on('wavesurferInit', function (e, wavesurfer) {
				$scope.wavesurfer = wavesurfer;

				$scope.wavesurfer.enableDragSelection({
					// color: randomColor(0.2)
				});
				
				$scope.wavesurfer.on('ready', function () {
					$scope.wavesurfer.zoom(100);
					console.log('Wavesurfer ready');
				});

				$scope.wavesurfer.on('play', function () {
					// ...
				});

				$scope.wavesurfer.on('pause', function () {
					// ...
				});

				$scope.wavesurfer.on('finish', function () {
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
					// console.log('mouseup');
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
						$scope.wavesurfer.play(region.start);
						$scope.wavesurfer.pause();
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
				onUpdate: function (item, callback) {
					content = prompt('Edit label:', item.content);
					if (content != item.content && content != null) {
						item.content = content;
						item.id = $scope.id;
						$scope.id += 1;
						$scope.$apply();
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
				// {id: 0, content: 'First', value: 1},
				// {id: 1, content: 'Third', value: 3},
				// {id: 2, content: 'Second', value: 2}
			]);

			/**********************************************************************************************/

			// Load the layers in the config
			$scope.model.current_layer = [];

			$http.get('config.json').
				success(function(data, status, headers, config) {
					// called asynchronously when response is available
					console.log('Layers loaded');
					// console.log(data.layers);

					for (var i = 0; i < data.layers.length; i++) {
						$scope.groups.add({
							id: i,
							content: data.layers[i]
						});
					};
			}).
				error(function(data, status, headers, config) {
					// called asynchronously if error
					alert("Error loading layers");
			});

			/**********************************************************************************************/

			$scope.items = new vis.DataSet([
				// {id: 0, group: 0, content: 'item 0', start: 0, end: 1000},
				// {id: 2, group: 1, content: 'item 2', start: 1500, end: 2000},
				// {id: 4, group: 1, content: 'item 4', start: 2500, end: 4000},
			]);
			

			$scope.items.on('update', function (event, properties) {
				$scope.API.seekTime(properties.data[0].start/1000);
				$scope.wavesurfer.seekTo(properties.data[0].start/$scope.API.totalTime);
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
				// console.log('onSelect');
				var selection = $scope.timeline.getSelection();
				$scope.timeline.focus(selection);

				var x = ((($scope.items.get(selection[0])).start));
				x = Math.round(x * 1000) / 1000;
				// console.log(x);

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
				// console.log('onClick');
			};

			$scope.onDoubleClick = function (props) {
				// console.log('onDoubleClick');
			};

			$scope.onRightClick = function (props) {
				// console.log('onRightClick');
			};

			$scope.onload = function (timeline) {
				$scope.timeline = timeline;
				console.log('Timeline loaded');
			};

			$scope.onRangeChange = function (props) {
				// console.log('onRangeChange');
			};

			$scope.onRangeChanged = function (props) {
				// console.log('onRangeChanged');
				// $scope.API.seekTime((props.time).getTime()/1000);
			};

			$scope.onTimeChange = function (props) {
				// console.log('onTimeChange');
				$scope.API.seekTime((props.time).getTime()/1000);
				$scope.wavesurfer.seekTo((props.time).getTime()/$scope.API.totalTime);
			};

			$scope.onTimeChanged = function (props) {
				// console.log('onTimeChanged');
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

			var visjs2camomile = function(visjs) {
				var camomile = [];

				for (var i = 0; i < visjs.length; i++) {

					var start = Math.round(visjs[i].start * 1000) / 1000000;
					var end = Math.round(visjs[i].end * 1000) / 1000000;
					var label = visjs[i].content;

					camomile.push({
						'fragment': {'start': start, 'end': end},
						'data': label,
						'id_medium': $scope.model.selected_medium
					});

				};

				return camomile
			};

			$scope.saveAnnotations = function() {
				var ids = $scope.groups.getIds();

				for (i in ids) {
					var content = $scope.groups.get(i).content;
					// get annotations on this layer
					var x = $scope.items.get({
						filter: function(item) {
							return item.group == i;
						}
					});

					// convert visjs data to Camomile format
					var annotations = visjs2camomile(x);

					// remove duplicates on this layer (not necessary, as there should be none)
					for (var i = 0; i < annotations.length-1; i++) {
						if (annotations[i].fragment.start == annotations[i+1].fragment.start &&
							annotations[i].fragment.end == annotations[i+1].fragment.end &&
							annotations[i].data.toLowerCase() == annotations[i+1].data.toLowerCase()) {
								annotations.splice(i, 1);
						}
					};

					// look for the layer if it exists in the DB
					var found = false;
					// console.log("Looking for : " + content);

					var id_layer = -1;
					for (var j = 0; j < $scope.model.available_layers.length; j++) {
						if (content.toLowerCase() == $scope.model.available_layers[j].name.toLowerCase()) {
							found = true;
							id_layer = j;
							break;
						};
					};

					if (found) {
						$scope.saveLayer(content, id_layer, annotations);
					}
					else {
						// console.log('Not found : creating layer \'' + content + '\'');
						camomileService.createLayer($scope.model.selected_corpus, 
													content, '', 'segment', 'label',
													annotations, 
													function(err, data) {
														if(err) alert(data.message);
														else $scope.get_layers($scope.model.selected_corpus);
													});
					};
				};

				alert("Annotations saved successfully.");
			};

			$scope.saveLayer = function(content, id_layer, annotations) {
				// console.log('Found layer ' + content + ' ' + id_layer);
				camomileService.getAnnotations(function (err, data) {
					if (!err) {
						// first remove annotations already saved
						for (var i = 0; i < data.length; i++) {
							for (var j = 0; j < annotations.length; j++) {
								if (annotations[j].fragment.start == data[i].fragment.start && 
									annotations[j].fragment.end == data[i].fragment.end) {
										annotations.splice(j, 1);
								};
							};
						};

						// then save the new annotations
						camomileService.createAnnotations($scope.model.available_layers[id_layer]._id, annotations, 
															function(err, data) {
																if(err) alert(data.message);
																else $scope.get_layers($scope.model.selected_corpus);
															});
					} else {
						console.log(err, data);
						alert(data.error);
					}
				}, {
					filter: {
						id_layer: $scope.model.available_layers[id_layer]._id,
						id_medium: $scope.model.selected_medium
					}
				});
			};


		/*********************************************************************************************************/


			// the selected corpus has changed
			$scope.$watch('model.selected_corpus', function (newValue, oldValue, scope) {
				if (newValue) {
					scope.get_media(scope.model.selected_corpus);
					// blank the medium selection
					scope.model.selected_medium = undefined;
				}
			});

			// the selected media changed
			$scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
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
								src: $sce.trustAsResourceUrl('http://' + $scope.model.videoPath+ '/' + data.url + 'ogg'),
								type: "video/ogg"
							}];
						});
					}

				/*********************************************************************************************************/


					// loading the audio waveform into wavesurfer.js
					// TODO: alignment -> don't change the location or the name of the .wav files (or .webm files)
					
					// $scope.wavesurfer.load("audio0.wav");

					camomileService.getMedium($scope.model.selected_medium, function(err, data) {
						// for instance : data.url = '36/Video/front/03_woz/36_Video_front_03woz_0'
						var array     = (data.url).split('/');
						var videoName = array[array.length-1]; 		// '36_Video_front_03woz_0'
						var id        = videoName.split('_')[0]; 	// '36'
						var category  = videoName.split('_')[3]; 	// '03woz'
						var num       = videoName.split('_')[4]; 	// '0'

						var audioName = id + '_Audio_' + category + '_' + num; 	// 36_Audio_03woz_0

						console.log('Loading audio: ' + audioName + '.wav');

						camomileService.getMedia(function(err, data) {
							// TODO: can't load a .wav file -> Camomile server restriction (same for .mov files)
							// HOW TO FIX: 
							// in camomile-server/routes.js add:
								// stream one medium in wav
								// app.get('/medium/:id_medium/wav',
								//   Authentication.middleware.isLoggedIn,
								//   _.middleware.fExistsWithRights(mMedium, _.READ),
								//   Medium.streamWav);
							// and in camomile-server/controllers/Medium.js add:
								// exports.streamWav = function (req, res) {
								//   streamFormat(req, res, 'wav');
								// };
							// the same could be done for .mov files

							// var audioPath = $rootScope.dataroot + '/' + data[0].url + '.wav';
							var audioPath = camomileService.getMediumURL(data[0]._id, 'wav');
							console.log('audio path: ' + audioPath); // "http://vmjoker:32772/medium/557ad06fff4a6b01002d64ab/wav"
							
							$http.get($sce.trustAsResourceUrl(audioPath))).
								success(function(data, status, headers, config) {
									// called asynchronously when response is available
									console.log('Audio loaded');
									console.log(data);
									$scope.wavesurfer.load(data); 
							}).
								error(function(data, status, headers, config) {
									// called asynchronously if error
									console.log("Error loading audio");
							});
							
							// "GET http://vmjoker:32772/medium/557ad06fff4a6b01002d64ab/wav 401 (Unauthorized)"

							// $scope.wavesurfer.load("audio0.wav");

						}, {
							filter: {
								id_corpus: $scope.model.selected_corpus,
								name: audioName
							}
						});
						
					});

					$scope.data = {groups: $scope.groups, items: $scope.items};


				/*********************************************************************************************************/

					// get the layers and store them in $scope.model.available_layers
					scope.get_layers(scope.model.selected_corpus);
				}
			});

			$scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
				if (newValue) {
					scope.get_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_reference);
				};
			});

			$scope.$watch('model.current_layer', function () {
				if ($scope.model.current_layer && $scope.model.current_layer.length > 0) {
					camomileService.getLayer($scope.model.current_layer[0]['id_layer'],
						function(err, data) {
							if(!err) {
								var ids = $scope.groups.getIds();
								var g = -1;

								for (i in ids) {
									if ($scope.groups.get(i).content.toLowerCase() == data.name.toLowerCase()) {
										g = i;
										break;
									};
								};

								var itemsToRemove = $scope.items.get({
									filter: function(item) {
										return item.group == g;
									}
								});
								for (var i = 0; i < itemsToRemove.length; i++) $scope.items.remove(itemsToRemove[i].id);

								for (var i = 0; i < $scope.model.current_layer.length; i++) {
									$scope.items.add({
										title: parseInt($scope.model.current_layer[i]['_id'], 16),
										id: $scope.id,
										group: g,
										content: $scope.model.current_layer[i]['data'],
										start: $scope.model.current_layer[i]['fragment']['start']*1000,
										end: $scope.model.current_layer[i]['fragment']['end']*1000
									});
									$scope.id += 1;
									$scope.$apply();
								};
								if ($scope.timeline) $scope.timeline.setWindow(0, 12000);
							}
							else {
								alert(data.error);
							}
						});
				}
			});

			$scope.$watch('id', function (newValue, oldValue, scope) {
				// console.log('ID of last annotation changed to : ' + newValue);
			});

			$scope.$watch('model.selected_reference === undefined && model.selected_hypothesis === undefined',
				function (newValue, oldValue) {
					// to avoid triggering at init (only case where new and old are both true)
					if (!newValue) {
						$scope.model.restrict_toggle = 1;
					} else if (!oldValue) {
						$scope.model.restrict_toggle = 0;
					}
				}
			);
		}]);

