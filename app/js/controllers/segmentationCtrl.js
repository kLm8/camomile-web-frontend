/**
 * Created by Clément on 07/03/15.
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
						console.log(data.message);
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
					$scope.wavesurfer.zoom(50); // zoom has to be adapted -> bigger value makes the waveform disappear
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
						group: $scope.lastGroup,
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
			$scope.lastGroup = 0;
			$scope.hashTable = {};
			$scope.itemsToRemove = new vis.DataSet([]);

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
						if (item.content != 'rename me') {
							// content has changed
							item.content = content;
						} else {
							// save item
							item.content = content;
							item.id = $scope.id;
							$scope.hashTable[item.id] = '';
							$scope.lastGroup = item.group;
							$scope.id += 1;
							$scope.$apply();
							$scope.items.remove(-1);
						};
						callback(item); // send back adjusted item
					}
					else {
						callback(null); // cancel updating the item
					}
				},

				onRemove: function (item, callback) {
					if (confirm('Remove label "' + item.content + '" ?')) {
						item.content = 'DELETE__' + item.content;
						$scope.itemsToRemove.add(item);
						callback(item); // confirm deletion
					}
					else {
						callback(null); // cancel deletion
					}
				},
				// showCustomTime: true, // deprecated, use addCustomeTime() instead
				start: 0,
				min: 0,
				max: 1000*60*10, // 10 minutes
				format: {minorLabels: {millisecond:'s[::]SS', second:'m[:]s', minute:'m'}},
				type: 'range',
				showMajorLabels: false,
				// snap: null,
				zoomMax: 1000*60*2, // 2 minutes
				zoomMin: 1000,      // 1 second
				maxHeight: '800px',
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
						// one layer = one group
						$scope.groups.add({
							id: i,
							content: data.layers[i]
						});
					};
			}).
				error(function(data, status, headers, config) {
					// called asynchronously if error
					console.log("Error loading layers");
			});

			/**********************************************************************************************/

			// Vis.js' events callbacks
			$scope.items = new vis.DataSet([
				// {id: 0, group: 0, content: 'item 0', start: 0, end: 1000},
				// {id: 2, group: 1, content: 'item 2', start: 1500, end: 2000},
				// {id: 4, group: 1, content: 'item 4', start: 2500, end: 4000},
			]);
			

			$scope.items.on('update', function (event, properties) {
				$scope.lastGroup = properties.data[0].group;
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

				// get the beginning to center timeline + wavesurfer
				var x = ((($scope.items.get(selection[0])).start));
				x = Math.round(x * 1000) / 1000;
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

			// set the callbacks
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

			/**
			 * Zoom the timeline a given percentage in or out
			 * @param {Number} percentage   For example 0.1 (zoom out) or -0.1 (zoom in)
			 */
			$scope.zoom = function (percentage) {
				var range = $scope.timeline.getWindow();
				var interval = range.end - range.start;

				$scope.timeline.setWindow({
					start: range.start.valueOf() - interval * percentage,
					end:   range.end.valueOf()   + interval * percentage
				});
			};

			/**
			 * Move the timeline a given percentage to left or right
			 * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
			 */
			$scope.move = function (percentage) {
				var range = $scope.timeline.getWindow();
				var interval = range.end - range.start;

				$scope.timeline.setWindow({
					start: range.start.valueOf() - interval * percentage,
					end:   range.end.valueOf()   - interval * percentage
				});
			};

			/**
			 * Center the timeline
			 */
			$scope.center = function () {
				var range = $scope.timeline.getWindow();
				var interval = range.end - range.start;

				var x = Math.round($scope.timeline.getCustomTime() * 1000) / 1000;
				console.log(x);

				$scope.timeline.setWindow({
					start: 	x - interval/2,
					end: 	x + interval/2
				});
			};

		/*********************************************************************************************************/

			/**
			 * Convert visjs data to Camomile format
			 * @param {array} visjs   array of Vis.js items
			 * @return {array} 		  array of Camomile segments
			 */
			var visjs2camomile = function(visjs) {
				var camomile = [];

				for (var i = 0; i < visjs.length; i++) {

					var start = Math.round(visjs[i].start * 1000) / 1000000;
					var end = Math.round(visjs[i].end * 1000) / 1000000;
					var label = visjs[i].content;

					camomile.push({
						'_id': visjs[i].id,
						'fragment': {'start': start, 'end': end},
						'data': label,
						'id_medium': $scope.model.selected_medium
					});

				};

				return camomile
			};

			/**
			 * Save the annotations to the database
			 */
			$scope.saveAnnotations = function() {
				var ids = $scope.groups.getIds();

				for (i in ids) {
					var content = '';
					var annotations = {};

					// TODO: Update usernames requirements (hardcode is bad)
					// is user an annotator ?
					if (Session.username.toLowerCase().indexOf("annotateur") > -1) {
						content = $scope.groups.get(i).content + '_' + Session.username;
					} 
					// or a viewer ?
					else if (Session.username.toLowerCase().indexOf("viewer") > -1) {
						break;
					} 
					// or a segmenter
					else {
						content = $scope.groups.get(i).content;
					};

					// get annotations on this layer
					var x = $scope.items.get({
						filter: function(item) {
							return item.group == i;
						}
					});
					// get annotations to remove on this layer
					var y = $scope.itemsToRemove.get({
						filter: function(item) {
							return item.group == i;
						}
					});

					// convert visjs data to Camomile format
					var a = visjs2camomile(x);
					var b = visjs2camomile(y);
					// annotations = angular.extend({}, a, b);
					annotations = a.concat(b);

					// var keys = [];
					// for (var key in annotations) {
					// 	if (annotations.hasOwnProperty(key)) keys.push(key);
					// };

					// // remove duplicates on this layer
					// for (var i = 0; i < keys.length-1; i++) {
					// 	for (var j = 1; j < keys.length; j++) {
					// 		if (annotations[keys[i]].fragment.start == annotations[keys[j]].fragment.start &&
					// 			annotations[keys[i]].fragment.end == annotations[keys[j]].fragment.end &&
					// 			annotations[keys[i]].data.toLowerCase() == annotations[keys[j]].data.toLowerCase()) {
					// 				var string = 'DELETE__' + annotations[keys[j]].data;
					// 				annotations[keys[j]].data = string;
					// 		};
					// 	};
					// };

					// console.log('annotations');
					// console.log(annotations);
					// console.log('annotations.length');
					// console.log(annotations.length);

					// remove duplicates on this layer
					for (var i = 0; i < annotations.length-1; i++) {
						if (annotations[i].fragment.start == annotations[i+1].fragment.start &&
							annotations[i].fragment.end == annotations[i+1].fragment.end &&
							annotations[i].data.toLowerCase() == annotations[i+1].data.toLowerCase()) {
								annotations.splice(i, 1);
								console.log('spliced');
						};
					};

					// console.log('annotations.length after loop');
					// console.log(annotations.length);




					var id_layer = $scope.searchLayer(content);
					var found = id_layer == -1 ? false : true; // is the layer found ?

					if (found) {
						console.log('Saving layer ' + content);
						$scope.saveLayer(content, id_layer, annotations, true);
					}
					else {
						console.log('Creating layer \'' + content + '\'');
						camomileService.createLayer($scope.model.selected_corpus, 
													content, '', 'segment', 'label',
													annotations, 
													function(err, data) {
														if(err) alert(data.message);
														else $scope.get_layers($scope.model.selected_corpus);
													});
					};

					// if user is "segmenteur", update layers for "annotateur"
					if (Session.username.toLowerCase().indexOf("segmenteur") > -1) {
						var usernames = ["annotateur1", "annotateur2", "annotateur3"];
						for (var i = 0; i < usernames.length; i++) {
							var content_annotateur = content + '_' + usernames[i];
							var id_layer_annotateur = $scope.searchLayer(content_annotateur);
							var found_annotateur = id_layer_annotateur == -1 ? false : true;

							if (found_annotateur) {
								console.log('Updating layer : ' + content_annotateur);
								$scope.saveLayer(content_annotateur, id_layer_annotateur, annotations, false);
							}
							else {
								console.log('Creating layer \'' + content_annotateur + '\'');
								camomileService.createLayer($scope.model.selected_corpus, 
															content_annotateur, '', 'segment', 'label',
															annotations, 
															function(err, data) {
																if(err) alert(data.message);
																else $scope.get_layers($scope.model.selected_corpus);
															});
							};
						};
					};
				};

				if (Session.username.toLowerCase().indexOf("viewer") > -1) {
					alert(Session.username + " can't save annotations.");
				} else {
					alert("Annotations saved successfully.");
				};
			};

			/**
			 * Look for the layer if it exists in the DB
			 * @param {string} content   Name of the layer
			 * @return {int}			 ID of the layer (-1 if not found)
			 */
			$scope.searchLayer = function(content) {
				// console.log("Looking for : " + content);

				var id_layer = -1;
				for (var j = 0; j < $scope.model.available_layers.length; j++) {
					if (content.toLowerCase() == $scope.model.available_layers[j].name.toLowerCase()) {
						id_layer = j;
						break;
					};
				};

				return id_layer;
			};

			/**
			 * Save the annotations in the layer
			 * @param {string} content 		Name of the layer
			 * @param {int} id_layer 		ID of the layer
			 * @param {array} annotations 	Array of Camomile annotations
			 * @param {bool} update 		Used to update and delete (or not) the annotations
			 */
			$scope.saveLayer = function(content, id_layer, annotations, update) {
				// TODO: update: async.waterfall() should be used there with getAnnotations()->checkAnnotation()->getAnnotation()->...
				// 				 saving mechanism should be upgraded
				camomileService.getAnnotations(function (err, data) {
					if (!err) {
						// first remove annotations already saved
						console.log(annotations);
						for (var i = 0; i < data.length; i++) {
							for (var j = 0; j < annotations.length; j++) {
								if (annotations[j].fragment.start == data[i].fragment.start && 
									annotations[j].fragment.end == data[i].fragment.end &&
									annotations[j].data == data[i].data) {
										annotations.splice(j, 1);
										console.log('spliced2');
								};
							};
						};

						// then save or update the new annotations
						for (var k in annotations) {
							if (annotations.hasOwnProperty(k)) {
								// console.log('annotation: ' + annotations[k].data + ' id: ' + annotations[k]._id + ' hash: ' + $scope.hashTable[annotations[k]._id]);
								if ($scope.hashTable[annotations[k]._id] != '') {
									// update annotation
									// console.log('Updating existing annotation');
									$scope.checkAnnotation($scope.model.available_layers[id_layer]._id, annotations[k], update);
								} else {
									// create annotation
									// console.log('Creating new annotation');
									$scope.createAnnotation($scope.model.available_layers[id_layer]._id, annotations[k]);
								};
							};
						};
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

			/**
			 * Update an existing annotation
			 * @param {int} layerID 		ID of the layer
			 * @param {array} annotation 	Annotation's data
			 * @param {bool} update 		Used to update and delete (or not) the annotations
			 */
			$scope.checkAnnotation = function(layerID, annotation, update) {
				camomileService.getAnnotation($scope.hashTable[annotation._id], function (err, data) {
					if (!err) {
						// check if annotation's layer has changed
						if (data.id_layer != layerID) {
							// console.log('Layer has changed');
							// changed: create new annotation and delete the old one if update = true
							$scope.createAnnotation(layerID, annotation);
							
							if (update) {
								// $scope.deleteAnnotation(annotation._id); // deletion can't be done (permissions)
								var string = 'DELETE__' + annotation.data;
								camomileService.updateAnnotation($scope.hashTable[annotation._id],
																 {fragment: annotation.fragment, data: string},
																 function(err, data) {
																	if(err) alert(data.message);
																	else $scope.get_layers($scope.model.selected_corpus);
																 });
							};
						} else {
							// console.log('Updating the annotation on the same layer');
							// not changed, update the annotation
							camomileService.updateAnnotation($scope.hashTable[annotation._id],
															 {fragment: annotation.fragment, data: annotation.data},
															 function(err, data) {
																if(err) alert(data.message);
																else $scope.get_layers($scope.model.selected_corpus);
															 });
						};
					};
				});
			};

			/**
			 * Create an annotation
			 * @param {int} layerID 		ID of the layer
			 * @param {array} annotation 	Annotation's data
			 */
			$scope.createAnnotation = function(layerID, annotation) {
				camomileService.createAnnotation(layerID,
												 annotation.id_medium,
												 annotation.fragment,
												 annotation.data, 
												 function(err, data) {
													if(err) alert(data.message);
													else {
														// console.log('id: ' + data._id);
														$scope.hashTable[annotation._id] = data._id;
														// console.log('annotation: ' + annotation.data + ' ' +
														// 			'id: ' + annotation._id + ' ' +
														// 			'hash: ' + $scope.hashTable[annotation._id]);

														$scope.get_layers($scope.model.selected_corpus);
													};
												 });
			};

			// lambda users can't delete an annotation (no permission)
			// $scope.deleteAnnotation = function(annotationID) {
			// 	camomileService.deleteAnnotation($scope.hashTable[annotationID],
			// 									 function(err, data) {
			// 										if(err) alert(data.message);
			// 										else $scope.get_layers($scope.model.selected_corpus);
			// 									 });
			// };


		/*********************************************************************************************************/

			// remove annotations on a layer
			$scope.cleanLayer = function (layer_name) {
				layer_name = layer_name.replace('_'+Session.username, '');

				var ids = $scope.groups.getIds();
				var g = -1;
				for (i in ids) {
					if ($scope.groups.get(i).content.toLowerCase() == layer_name.toLowerCase()) {
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

				return g;
			};


			// a layer has been (un)checked
			$scope.toggleCheck = function (layer) {
				if (!layer.selected) {
					// load layer
					$scope.model.selected_reference = layer._id;
					$scope.model.selected_reference_name = layer.name;
				} else {
					// clean layer
					$scope.cleanLayer(layer.name);
				};
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
					
					// $scope.wavesurfer.load("audio0.wav");

					camomileService.getMedium($scope.model.selected_medium, function(err, data) {
						$scope.model.video_name = data.name;

						// for instance : data.url = '36/Video/front/03_woz/36_Video_front_03woz_0'
						var array     = (data.url).split('/');
						var videoName = array[array.length-1]; 		// '36_Video_front_03woz_0'
						var id        = videoName.split('_')[0]; 	// '36'
						var category  = videoName.split('_')[3]; 	// '03woz'
						var num       = videoName.split('_')[4]; 	// '0'

						var audioName = id + '_Audio_' + category + '_' + num; 	// 36_Audio_03woz_0

						// console.log('Loading audio: ' + audioName + '.wav');

						camomileService.getMedia(function(err, data) {
							// var audioPath = $rootScope.dataroot + '/' + data[0].url + '.wav';
							var audioPath = camomileService.getMediumURL(data[0]._id, 'wav');
							// console.log('audio path: ' + audioPath); // "http://vmjoker:32772/medium/557ad06fff4a6b01002d64ab/wav"

							// GET request
							var req = {
								method: 'GET',
								url: audioPath,
								// cookies needed for authentication of GET request on Camomile DB :
								xsrfCookieName: 'camomile.sid',
								withCredentials: true,
								responseType: 'arraybuffer' // returns audio data in an ArrayBuffer
							};

							$http(req).
								success(function(data, status, headers, config) {
									// called asynchronously when response is available
									console.log('Audio loaded');
									var blob = new Blob([data], {type: "audio/wav"}); // create a Blob from the ArrayBuffer
									$scope.wavesurfer.loadBlob(blob); // load the Blob in WaveSurfer.js
							}).
								error(function(data, status, headers, config) {
									// called asynchronously if error
									console.log("Error loading audio");
							});

						}, {
							filter: {
								id_corpus: $scope.model.selected_corpus,
								name: audioName
							}
						});
						
					});

					$scope.items.clear();
					$scope.data = {groups: $scope.groups, items: $scope.items};


				/*********************************************************************************************************/

					// get the layers and store them in $scope.model.available_layers
					scope.get_layers(scope.model.selected_corpus);
				}
			});

			$scope.$watch('model.available_layers', function (newValue, oldValue, scope) {
				if (newValue) {
					// add a 'selected' field used in the checkbox
					for (var i = 0; i < scope.model.available_layers.length; i++) {
						scope.model.available_layers[i]['selected'] = false;
					};
				};
			});

			$scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
				if (newValue) {
					// get annotations for the selected layer
					// if user is an annotator, get the annotations on his specific layer (duplicate of segmenter's layer)
					if (Session.username.toLowerCase().indexOf("annotateur") > -1) {
						var layer = scope.model.selected_reference_name + '_' + Session.username;
						console.log('Loading annotations of ' + Session.username + ' on ' + layer);
						var id_layer = $scope.searchLayer(layer);
						var found = id_layer == -1 ? false : true;
						if (found) {
							scope.get_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.available_layers[id_layer]._id);
						} else {
							// layer not found -> has to be segmented first by user "segmenteur"
							console.log('No annotations available');
						};
					} else {
						console.log('Loading segmentation layer');
						scope.get_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_reference);
					};					
				};
			});

			$scope.$watch('model.current_layer', function () {
				if ($scope.model.current_layer && $scope.model.current_layer.length > 0) {
					camomileService.getLayer($scope.model.current_layer[0]['id_layer'],
						function(err, data) {
							if(!err) {
								g = $scope.cleanLayer(data.name);

								// load the items in the timeline
								for (var i = 0; i < $scope.model.current_layer.length; i++) {
									if ($scope.model.current_layer[i]['data'].indexOf("DELETE__") == -1) {
										$scope.items.add({
											// title: parseInt($scope.model.current_layer[i]['_id'], 16),
											// title: $scope.model.current_layer[i]['_id'],
											id: $scope.id,
											group: g,
											content: $scope.model.current_layer[i]['data'],
											start: $scope.model.current_layer[i]['fragment']['start']*1000,
											end: $scope.model.current_layer[i]['fragment']['end']*1000
										});
										// remember which $scope.id corresponds to which layer._id
										$scope.hashTable[$scope.id] = $scope.model.current_layer[i]['_id'];
										$scope.id += 1;
										$scope.$apply();
									};
								};
								if ($scope.timeline) $scope.timeline.setWindow(0, 12000);
							}
							else {
								console.log(data.error);
							}
						});
				}
			});

			// $scope.$watch('id', function (newValue, oldValue, scope) {
			// 	console.log('ID of last annotation changed to : ' + newValue);
			// });

			// $scope.$watch('hashTable', function (newValue, oldValue, scope) {
			// 	console.log('hashTable updated : ');
			// 	console.log(newValue);
			// });

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

