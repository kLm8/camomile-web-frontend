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

					var options = {
						align: 'center', // left | right (String)
						autoResize: true, // false (Boolean)
						editable: true,
						selectable: true,
						// start: null,
						// end: null,
						// height: null,
						// width: '100%',
						// margin: {
						//   axis: 20,
						//   item: 10
						// },
						// min: null,
						// max: null,
						// maxHeight: null,
						orientation: 'bottom',
						// padding: 5,
						showCurrentTime: true,
						showCustomTime: true,
						showMajorLabels: true,
						showMinorLabels: true
						// type: 'box', // dot | point
						// zoomMin: 1000,
						// zoomMax: 1000 * 60 * 60 * 24 * 30 * 12 * 10,
						// groupOrder: 'content'
					};

					var groups = new vis.DataSet([
							{id: 0, content: 'First', value: 1},
							{id: 1, content: 'Third', value: 3},
							{id: 2, content: 'Second', value: 2}
						]);

					var items = new vis.DataSet([
							{id: 0, group: 0, content: 'item 0', start: new Date(2014, 3, 17), end: new Date(2014, 3, 21)},
							{id: 1, group: 0, content: 'item 1', start: new Date(2014, 3, 19), end: new Date(2014, 3, 20)},
							{id: 2, group: 1, content: 'item 2', start: new Date(2014, 3, 16), end: new Date(2014, 3, 24)},
							{id: 3, group: 1, content: 'item 3', start: new Date(2014, 3, 23), end: new Date(2014, 3, 24)},
							{id: 4, group: 1, content: 'item 4', start: new Date(2014, 3, 22), end: new Date(2014, 3, 26)},
							{id: 5, group: 2, content: 'item 5', start: new Date(2014, 3, 24), end: new Date(2014, 3, 27)}
						]);

					$scope.model.data = {groups: groups, items: items};
					var orderedContent = 'content';
					var orderedSorting = function (a, b) {
						// option groupOrder can be a property name or a sort function
						// the sort function must compare two groups and return a value
						//     > 0 when a > b
						//     < 0 when a < b
						//       0 when a == b
						return a.value - b.value;
					};

					$scope.model.options = angular.extend(options, {
						groupOrder: orderedContent,
						editable: true
					});

					$scope.model.onSelect = function (items) {
						console.log('Select');
					};

					$scope.model.onClick = function (props) {
						console.log('Click');
					};

					$scope.model.onDoubleClick = function (props) {
						console.log('DoubleClick');
					};

					$scope.model.rightClick = function (props) {
						console.log('Right click!');
					};

					$scope.model.events = {
						select: $scope.model.onSelect,
						click: $scope.model.onClick,
						doubleClick: $scope.model.onDoubleClick,
						contextmenu: $scope.model.rightClick
					};


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

