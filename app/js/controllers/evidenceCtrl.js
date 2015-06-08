/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$sce', '$scope', '$http',
		'defaults', '$controller', '$cookieStore', 'Session', '$rootScope', '$routeParams', 'camomileService',

		function ($sce, $scope, $http, defaults, $controller, $cookieStore, Session, $rootScope, $routeParams, camomileService) {

			$controller('CommonCtrl', {
				$scope: $scope,
				$http: $http,
				defaults: defaults,
				Session: Session
			});

			$scope.queues = [];
			$scope.model.queueTableData = [];
			$scope.model.incomingQueue = {};
			$scope.model.outcomingQueue = {};
			$scope.model.queueData = {};
			$scope.model.availableEntry = [];
			$scope.model.videoMetaData = "";

			$scope.model.boundingBox = {};

			$scope.model.queueType = $routeParams.type;

			$(function () {
				$("#entry_input").autocomplete({
					source: $scope.model.availableEntry
				});
			});

			// store the entry typed in the textbox
			$scope.model.entryTyped = "";

			// Store the selected table's line
			$scope.model.selectedQueueLineIndex = "";

			$scope.model.resetTransparentPlan = function () {
				var transparentPlan = d3.select("#transparent-plan");
				// Remove old element
				transparentPlan.selectAll("svg").remove();

				$scope.model.boundingBox = {};
			};

			$scope.model.updateIsDisplayedVideo = function (activate) {
				$scope.model.isDisplayedVideo = activate;
			};

			// PBR : get queue data from config
			$scope.model.incomingQueue = $rootScope.queues.evidenceIn;
			$scope.model.outcomingQueue = $rootScope.queues.evidenceOut;

			// initialize page state
			$scope.model.updateIsDisplayedVideo(false);

			$scope.model.updateTransparentPlan = false;

			$scope.model.description_flag = false;

			$scope.model.displayDescription = function () {
				$scope.model.description_flag = true;
			};

			var _getVideo = function (id_medium, callback) {

				if ($scope.model.useDefaultVideoPath) {
					callback(null, $sce.trustAsResourceUrl(camomileService.getMediumURL(id_medium, 'webm')));
				} else {
					camomileService.getMedium(id_medium, function (err, medium) {
						callback(err, $sce.trustAsResourceUrl($scope.model.videoPath + '/' + medium.url + '.mp4'));
					});
				}
			};

			// Initializes the data from the queue
			// rename from "initQueueData" to "popQueueElement"
			$scope.model.popQueueElement = function () {

				// Get queue first element and pop it from the queue
				camomileService.dequeue($scope.model.incomingQueue, function (err, data) {

					if (err) {
						alert(data.error);
						$scope.$apply(function () {
							$scope.model.video = undefined;
							$scope.model.isDisplayedVideo = false;
							$scope.model.queueTableData = [];
							$scope.model.queueData.data = [];
							$scope.model.updateIsDisplayedVideo(false);
						});

						return;
					}

					$scope.model.resetTransparentPlan();

					// Update the next button's status
					$scope.model.updateIsDisplayedVideo(true);

					$scope.model.queueData = data;
					$scope.model.corrected_data = "";
					$scope.model.queueTableData = [];

					$scope.model.initialDate = new Date();

					$scope.model.corrected_data = $scope.model.queueData.data.person_name;
					$scope.model.initialData = $scope.model.queueData.data.person_name;

					// Update the add entry button's status
					$scope.model.updateIsDisplayedVideo($scope.model.corrected_data != "");

					// Get the video

					async.parallel({
							video: function (callback) {
								_getVideo($scope.model.queueData.fragment.id_medium, callback);
							},
							serverDate: function (callback) {
								camomileService.getDate(function (err, data) {
									callback(null, data.date);
								});
							}
						},
						function (err, results) {
							$scope.model.video = results.video;
							$scope.model.serverDate = results.serverDate;
							$scope.model.clientDate = Date.now();

							$scope.model.restrict_toggle = 2;
							$scope.model.current_time_temp = $scope.model.queueData.fragment.start;
							$scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start || 0);
							if ($scope.model.infbndsec < 0) {
								$scope.model.infbndsec = 0;
							}
							$scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end || 0);
							if ($scope.model.supbndsec > $scope.model.fullDuration) {
								$scope.model.supbndsec = $scope.model.fullDuration;
							}
							$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.queueData.fragment.start;
							});

						});
				});
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence, itWasMyLastAnnotationForToday) {

				if (isEvidence && ($scope.model.boundingBox.w === undefined || $scope.model.boundingBox.w === 0)) {
					alert("Please draw a bounding box around the face.");
					return;
				}

				var dataToPush = {};

				dataToPush.log = {};
				dataToPush.log.user = Session.username;
				dataToPush.log.date = $scope.model.serverDate;
				dataToPush.log.duration = Date.now() - $scope.model.clientDate;

				dataToPush.input = {};
				dataToPush.input.id_evidence = $scope.model.queueData.id_evidence;
				dataToPush.input.id_layer_evidence = $scope.model.queueData.id_layer_evidence;
				dataToPush.input.source = $scope.model.queueData.data.source;
				dataToPush.input.person_name = $scope.model.initialData;

				dataToPush.output = {};
				dataToPush.output.is_evidence = isEvidence;

				if (isEvidence) {
					dataToPush.output.person_name = $scope.model.corrected_data;
					dataToPush.output.time = $scope.model.current_time;
					dataToPush.output.bounding_box = $scope.model.boundingBox;
				}

				camomileService.enqueue($scope.model.outcomingQueue, dataToPush, function (err, data) {

					if (err) {
						console.log("Something went wrong");
					} else {
						if (!itWasMyLastAnnotationForToday) {
							$scope.model.popQueueElement();
						} else {
							$scope.$apply(function () {
								$scope.model.video = undefined;
								$scope.model.isDisplayedVideo = false;
								$scope.model.queueTableData = [];
								$scope.model.queueData.data = [];
								$scope.model.updateIsDisplayedVideo(false);
							});
						}
					}

				});
			};

			var player = $("#player");
			var transparentPlan = d3.select("#transparent-plan").style("width", "100%")
				.style("height", (player.height()) + "px");

			var originPosition;
			transparentPlan.on("mouseup", function () {
				originPosition = undefined;
			});

			var drag = d3.behavior.drag()
				.origin(Object)
				.on("drag", function () {

					// mouse position
					var mouse = d3.mouse(this);

					originPosition = originPosition ? originPosition : mouse;
					// Remove old element
					transparentPlan.selectAll("svg").remove();

					var size = mouse[0] - originPosition[0];
					size = size > 0 ? size : 0;
					// Rectangle style
					transparentPlan.append("svg")
						.style("width", "100%")
						.style("height", "100%")
						.append("rect")
						.attr("x", originPosition[0])
						.attr("y", originPosition[1])
						.attr("width", size)
						.attr("height", size)
						.style("fill", "none")
						.style("stroke", "red")
						.style("stroke-width", 5);

					// Store bounding box;
					$scope.model.boundingBox.x = originPosition[0] / player.width();
					$scope.model.boundingBox.y = originPosition[1] / player.height();
					$scope.model.boundingBox.w = size / player.width();
					$scope.model.boundingBox.h = size / player.height();

				});

			transparentPlan.call(drag);

		}
	]);