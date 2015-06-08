angular.module('myApp.controllers')
    .controller('QueueCtrl', ['$sce', '$scope', '$http',
        'defaults', '$controller', '$cookieStore', 'Session', '$rootScope', '$routeParams', 'camomileService',
        function ($sce, $scope, $http, defaults, $controller, $cookieStore, Session, $rootScope, $routeParams, camomileService) {

            $controller('CommonCtrl',
                {
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

            var DEFAULT_CONTEXT_VALUE;

            $scope.model.queueType = $routeParams.type;

            // Initialize the default context value
            if ($scope.model.queueType === 'head') {
                DEFAULT_CONTEXT_VALUE = 0;
            } else if ($scope.model.queueType === 'shot') {
                DEFAULT_CONTEXT_VALUE = 5;
            }

            $(function () {
                $("#entry_input").autocomplete({
                    source: $scope.model.availableEntry
                });
            });

            // default for annotation context
            $scope.model.context_size = DEFAULT_CONTEXT_VALUE;


            // store the entry typed in the textbox
            $scope.model.entryTyped = "";

            // Store the selected table's line
            $scope.model.selectedQueueLineIndex = "";

            // add context menu to the table's lines
            $scope.model.contextMenu = function (event) {
                var $contextMenu = $("#contextMenu");

                $scope.model.selectedQueueLineIndex = event.currentTarget.rowIndex - 1;

                $scope.model.edit_items = [
                    {id: '', value: $scope.model.queueTableData[$scope.model.selectedQueueLineIndex]}
                ];

                $contextMenu.css({
                    display: "block",
                    left: event.pageX,
                    top: event.pageY
                });


                return false;
            };

            // Add typed entry to queue entries
            $scope.model.addEntry = function () {
                $scope.model.entryTyped = document.getElementById("entry_input").value;
                $scope.model.queueTableData.push($scope.model.entryTyped);
                if ($scope.model.availableEntry.indexOf($scope.model.entryTyped) == -1) {
                    $scope.model.availableEntry.push($scope.model.entryTyped);
                }
                $scope.model.entryTyped = "";

                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };

            // Remove target element if a confirmation is given by the user
            $scope.model.remove_click = function () {
                if (confirm("Are you sure you want to remove this entry ?")) {
                    $scope.model.queueTableData.splice($scope.model.selectedQueueLineIndex, 1);
                    var elementIndex = $scope.model.queueTableData[$scope.model.selectedQueueLineIndex];
                    elementIndex = $scope.model.availableEntry.indexOf(elementIndex);
                    $scope.model.availableEntry.splice(elementIndex, 1);

                    // reactivate save button
                    $scope.model.updateSaveButtonStatus(true);

                }
            };

            // Override save method from the modal dialog
            $scope.model.edit_save_element = function (edit_items) {
                $scope.model.queueTableData[$scope.model.selectedQueueLineIndex] = edit_items[0].value;
                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };


            $scope.model.updateNextStatus = function (isInit) {
                var buttonNext = document.getElementById("buttonNext");
                if (isInit != undefined) {
                    $scope.model.disableNext = false;
                    buttonNext.innerHTML = "Start";
                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateIsDisplayedVideo(true);
                }
                else {
                    $scope.model.disableNext = $scope.model.queueData.data == undefined;
                    buttonNext.innerHTML = "Skip";
                }
                if ($scope.model.disableNext) {
                    buttonNext.setAttribute("class", "btn btn-primary disabled");
                    // also disable save button because nothing else to save!
                    $scope.model.updateSaveButtonStatus(false);
                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateIsDisplayedVideo(true);
                    // Removes all element from table
                    $scope.model.queueTableData = undefined;
                }
                else {
                    buttonNext.setAttribute("class", "btn btn-primary");
                }
            };


            $scope.model.updateSaveButtonStatus = function (activate) {
                $scope.model.disableSaveButton = !activate;
                var buttonSave = document.getElementById("buttonSave");
                if ($scope.model.disableSaveButton) {
                    // Disables save button
                    buttonSave.setAttribute("class", "btn btn-success disabled");
                }
                else {
                    buttonSave.setAttribute("class", "btn btn-success");
                }
            };


            $scope.model.resetTransparentPlan = function () {
                var transparentPlan = d3.select("#transparent-plan");
                // Remove old element
                transparentPlan.selectAll("svg").remove();
            };


            $scope.model.updateIsDisplayedVideo = function (activate) {
                $scope.model.isDisplayedVideo = !activate;
                var addEntryButton = document.getElementById("addEntryButton");
                var defaultButton = document.getElementById("defaultButtonId");
                var moreButton = document.getElementById("moreButtonId");
                if ($scope.model.isDisplayedVideo) {
                    // Disables add entry button
                    addEntryButton.setAttribute("class", "btn btn-default disabled");
                    defaultButton.setAttribute("class", "btn btn-default disabled");
                    moreButton.setAttribute("class", "btn btn-default disabled");
                    // Remove previous rects
                    $scope.model.resetTransparentPlan();
                }
                else {
                    addEntryButton.setAttribute("class", "btn btn-default");
                    defaultButton.setAttribute("class", "btn btn-default");
                    moreButton.setAttribute("class", "btn btn-default");
                    if ($scope.model.queueTableData == undefined) {
                        $scope.model.queueTableData = [];
                    }
                }
            };


            // PBR : get queue data from config
            if ($scope.model.queueType === "head") {
                $scope.model.incomingQueue = $rootScope.queues.headIn;
                $scope.model.outcomingQueue = $rootScope.queues.headOut;
            } else {
                $scope.model.incomingQueue = $rootScope.queues.shotIn;
                $scope.model.outcomingQueue = $rootScope.queues.shotOut;
            }

            // initialize page state
            $scope.model.updateNextStatus(true);
            $scope.model.updateSaveButtonStatus(false);
            $scope.model.updateIsDisplayedVideo(false);

            $scope.model.updateTransparentPlan = false;

            $scope.model.description_flag = false;

            $scope.model.displayDescription = function () {
                $scope.model.description_flag = true;
            };

            $scope.model.defaultContextButtonClicked = function () {
                $scope.model.context_size = DEFAULT_CONTEXT_VALUE;
            };

            // Initializes the data from the queue
            // rename from "initQueueData" to "popQueueElement"
            $scope.model.popQueueElement = function () {

                var proceedPopQueue = true;
                // Test if the entry has been added
                if ($scope.model.entryTyped != "") {

                    proceedPopQueue = confirm("Are you sure ? The entry hasn't been added");
                }

                if (proceedPopQueue) {

                    // Get queue first element and pop it from the queue
                    camomileService.dequeue($scope.model.incomingQueue, function (err, data) {
                        if(!err)
                        {
                            // Update the next button's status
                            $scope.model.updateNextStatus();
                            $scope.model.updateSaveButtonStatus(true);
                            $scope.model.updateIsDisplayedVideo(true);

                            $scope.model.queueData = data;
                            $scope.model.inData = [];
                            $scope.model.queueTableData = [];

//                        var date = new Date(); // already UTC date in JSON Format...
                            $scope.model.initialDate  = new Date(); // already UTC date in JSON Format...

                            // Re init the context_size value
                            $scope.model.context_size = DEFAULT_CONTEXT_VALUE;

                            if($scope.model.queueData.data != undefined)
                            {
                                //copy initial data
                                //for (var i in $scope.model.queueData.data) {
                                for (var i  = 0, maxI = $scope.model.queueData.data.length; i<maxI; i++){
                                    $scope.model.inData[i] = $scope.model.queueData.data[i];
                                    $scope.model.queueTableData[i] = $scope.model.queueData.data[i];
                                    if ($scope.model.availableEntry.indexOf($scope.model.queueData.data[i]) == -1) {
                                        $scope.model.availableEntry.push($scope.model.queueData.data[i]);
                                    }
                                }
                            }

                            // Update the next button's status
                            $scope.model.updateNextStatus();

                            // Update the add entry button's status
                            // we pass here only if err is not null - medium can be assumed
                            $scope.model.updateIsDisplayedVideo(true);

                            // Get the video
                            if ($scope.model.queueData.id_medium !== undefined) {

                                // Get queue element medium
                                camomileService.getMedium($scope.model.queueData.id_medium, function(err, data)
                                {
                                    if(!err)
                                    {
                                        $scope.$apply(function(){
                                            $scope.model.videoMetaData = data;
                                        });
                                    }
                                    else
                                    {
                                        console.log(err, data);
                                        alert(data.error);
                                    }

                                });

//								$scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/medium/" + $scope.model.queueData.id_medium + "/video");


								if($scope.model.useDefaultVideoPath)
								{
									$scope.model.video = $scope.model.videoThumbnail = $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.queueData.id_medium, 'webm'));
								}
								else
								{
									camomileService.getMedium($scope.model.queueData.id_medium, function(err, data)
									{
										$scope.model.video = $scope.model.videoThumbnail = $sce.trustAsResourceUrl($scope.model.videoPath+ '/' + data.url +'.webm');

									});
								}

								// fix: when using camomileService video was set afterwards
								//$scope.model.videoThumbnail = $scope.model.video;
								if ($scope.model.queueData !== undefined && $scope.model.queueData.fragment !== undefined && $scope.model.queueData.fragment.start !== undefined && $scope.model.queueData.fragment.end !== undefined) {
									$scope.model.restrict_toggle = 2;

									$scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start) - (parseInt($scope.model.context_size) || 0);
									if ($scope.model.infbndsec < 0) {
										$scope.model.infbndsec = 0;
									}
									$scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end) + (parseInt($scope.model.context_size) || 0);
									// fullDuration is set in a callback potentially happening after -> wait for event completion
									// -> dedicated watch of fullDuration
									//if ($scope.model.supbndsec > $scope.model.fullDuration) {
									//$scope.model.supbndsec = $scope.model.fullDuration;
									//}
									//
									//$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

                                	//console.log("nouveau current:",$scope.model.current_time)

                                    //TODO: Commenter le test pour mettre le plan transparent partout
                                    if ($scope.model.queueType === 'head') {
                                        // at the end of video loading, draw a rectangle on head as described in "position"
                                        $scope.model.updateTransparentPlan = true;
                                    }

                                }
                            }
                            else {
                                console.log(err, data);
                                alert(data.error);
                                $scope.model.updateIsDisplayedVideo(false);
                                $scope.model.video = undefined;
                            }

                        }
                        else
                        {
                            console.log(err, data);
                            alert(data.error);
                            $scope.$apply(function(){
                                $scope.model.video = undefined;
                                $scope.model.isDisplayedVideo = false;
                                $scope.model.queueTableData = [];
                                $scope.model.queueData.data = [];
                                document.getElementById("buttonNext").setAttribute("class", "btn btn-primary disabled");
                                $scope.model.updateSaveButtonStatus(false);
                                $scope.model.updateIsDisplayedVideo(false);
                            })


                        }
                    });
                }
            };


            // Event launched when click on the save button.
            $scope.model.saveQueueElement = function () {

                // Récuperation des données à transmettre au serveur
                var dataToPush = {};
                dataToPush["inData"] = {};
                dataToPush["inData"]["data"] = $scope.model.inData;
                dataToPush["inData"]["date"] = $scope.model.initialDate;
                dataToPush["outData"] = {};

                var date = new Date(); // already UTC ddate in JSON Format...

                var user = $cookieStore.get("current.user");
                var newData = [];
                var modified = false;

//                    for (var i in $scope.model.queueTableData) {
                for (var i = 0, maxI = $scope.model.queueTableData.length; i< maxI; i++) {
                    newData[i] = $scope.model.queueTableData[i];
                }

                if ($scope.model.inData.length == newData.length) {
//                        for (var j in newData) {
                    for (var j = 0, maxJ = newData.length; j < maxJ; j++) {
                        if (newData[j] != $scope.model.inData[j]) {
                            modified = true;
                        }
                    }
                }
                else {
                    modified = true;
                }
                dataToPush["outData"]["date"] = date;
                dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
                dataToPush["outData"]["user"] = user;
                dataToPush["outData"]["data"] = newData;

                //status
                if (modified) {
                    dataToPush["status"] = "MODIFIED";
                }
                else {
                    dataToPush["status"] = "VALIDATED";
                }

                $scope.model.queueData.data = dataToPush;

//						newOutcomingQueue.list = [$scope.model.queueData];

                // Update the queue by adding list element to the end of it
//						camomileService.enqueue(newOutcomingQueue._id, newOutcomingQueue.list, function(err, data){
                camomileService.enqueue($scope.model.outcomingQueue, dataToPush, function (err, data) {
                    if(err)
                    {
                        console.log(err, data);
                        alert(data.error);
                    }
                    else
                    {
                        console.log("save");
                        $scope.model.popQueueElement();
                    }
                });

            };

            // Event launched when click on the next button
            $scope.model.nextQueueElement = function () {

                var buttonNext = document.getElementById("buttonNext");

                buttonNext['data-title'] = "Skip this element and load the next one";

                // Push queue ONLY if a "Skip" as been done. NOT when "Start" has been pressed.
                if (buttonNext.innerHTML === "Skip") {

                    var dataToPush = {};
                    dataToPush["inData"] = {};
                    dataToPush["inData"]["data"] = $scope.model.inData;
                    dataToPush["inData"]["date"] = $scope.model.initialDate;
                    dataToPush["outData"] = {};

                    var date = new Date(); // already UTC ddate in JSON Format...

                    var user = $cookieStore.get("current.user");
                    var newData = [];
//                        for (var i in $scope.model.queueTableData) {
                    for (var i = 0, maxI = $scope.model.queueTableData.length; i< maxI; i++) {
                        newData[i] = $scope.model.queueTableData[i];
                    }
                    dataToPush["outData"]["date"] = date;
                    dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
                    dataToPush["outData"]["user"] = user;
                    dataToPush["outData"]["data"] = newData;

                    //status
                    dataToPush["status"] = "SKIP";

                    $scope.model.queueData.data = dataToPush;

                    // Update the queue by adding list element to the end of it
//                    camomileService.enqueue(updatedQueue._id, updatedQueue.list, function(err, data){
                    camomileService.enqueue($scope.model.outcomingQueue, dataToPush, function (err, data) {
                        if(err)
                        {
                            console.log(err, data);
                        }
                        else
                        {
                            console.log("skip");
                            $scope.model.popQueueElement();
                        }
                    });
                }
                else
                {
                    console.log("Start");
                    $scope.model.popQueueElement();
                }


            };


            //TODO uniquement si on veut pouvoir dessiner un rectangle au click!!!
//            					var transparentPlan = d3.select("#transparent-plan");
//            					transparentPlan.on("click", function()
//            					{
//            						var mouse = d3.mouse(this);
//            						// Remove old element
//            						transparentPlan.selectAll("svg").remove();
//
//            						// Circle style!
//            						transparentPlan.append("svg")
//            							.style("width", "100%")
//            							.style("height", "100%")
//            							.append("circle")
//            							.attr("cx",mouse[0])
//            							.attr("cy", mouse[1])
//            							.attr("r", 30)
//            							.style("fill", "none")
//            							.style("stroke", "red")
//            							.style("stroke-width",5);
//
//            						// Rectangle style
////            						transparentPlan.append("svg")
////            							.style("width", "100%")
////            							.style("height", "100%")
////            							.append("rect")
////            							.attr("x",mouse[0]-30)
////            							.attr("y", mouse[1]-30)
////            							.attr("width",60)
////            							.attr("height",60)
////            							.style("fill", "none")
////            							.style("stroke", "red")
////            							.style("stroke-width",5);
//
//            						console.log(document.getElementById("player").videoWidth, document.getElementById("player").videoHeight);
//
//            					});




            // hack for sending events through controlsoverlay
            function fireEvent(node, eventName, origEvent) {
                // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
                var doc;
                if (node.ownerDocument) {
                    doc = node.ownerDocument;
                } else if (node.nodeType == 9) {
                    // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
                    doc = node;
                } else {
                    throw new Error("Invalid node passed to fireEvent: " + node.id);
                }

                var event;
                if (node.dispatchEvent) {
                    // Gecko-style approach (now the standard) takes more work
                    var eventClass = "";

                    // Different events have different event classes.
                    // If this switch statement can't map an eventName to an eventClass,
                    // the event firing is going to fail.
                    switch (eventName) {
                        case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                        case "mousedown":
                        case "mouseup":
                        case "mouseover":
                        case "mouseout":
                        case "mousemove":
                            eventClass = "MouseEvents";
                            break;

                        case "focus":
                        case "change":
                        case "blur":
                        case "select":
                            eventClass = "HTMLEvents";
                            break;

                        default:
                            throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                            break;
                    }
                    event = doc.createEvent(eventClass);

                    //FIXME: unused var
//                    var bubbles = eventName == "change" ? false : true;
//                    var bubbles = eventName !== "change";

					event.initMouseEvent(eventName, true, true, window, 1, origEvent.screenX, origEvent.screenY,
						origEvent.clientX, origEvent.clientY);

					event.synthetic = true; // allow detection of synthetic events
					// The second parameter says go ahead with the default action
					node.dispatchEvent(event, true);
				} else if (node.fireEvent) {
					// IE-old school style
					event = doc.createEventObject();
					event.synthetic = true; // allow detection of synthetic events
					node.fireEvent("on" + eventName, event);
				}
			}

			// transmit events to SVG
			$("#controlsoverlay").mousemove(function (e) {
				fireEvent($("#controlsvg")[0], "mousemove", e);
			})
				.mouseout(function (e) {
					fireEvent($("#controlsvg")[0], "mouseout", e);
				});

			$scope.$watch('model.updateTransparentPlan', function (newValue) {
				if (newValue == true) {
					// Remove previous rects
					$scope.model.resetTransparentPlan();

					// Rectangle style: draw a rectangle at the described position (in position)
					var transparentPlan = d3.select("#transparent-plan");
					var player = $("#player");
					transparentPlan.append("svg")
						.style("width", "100%")
						.style("height", "100%")
						.append("rect")
						.attr("x", function () {
							return ((player.width()) * $scope.model.queueData.fragment.position.left - (player.width() * $scope.model.queueData.fragment.position.width) / 2) + "px";
						})
						.attr("y", function () {
							return (player.height() * $scope.model.queueData.fragment.position.top) - (player.height() * $scope.model.queueData.fragment.position.height) / 2 + "px";
						})
						.attr("width", player.width() * $scope.model.queueData.fragment.position.width)
						.attr("height", player.height() * $scope.model.queueData.fragment.position.height)
						.style("fill", "none")
						.style("stroke", "red")
						.style("stroke-width", 5);

					$scope.model.updateTransparentPlan = false;
				}
			});

			$scope.$watch('model.context_size', function (newValue) {
				newValue = parseInt(newValue);
				if (isNaN(newValue)) {
					newValue = 0;
				}
				if ($scope.model.queueData !== undefined
					&& $scope.model.queueData.fragment !== undefined
					&& $scope.model.queueData.fragment.start !== undefined) {
					$scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start) - (parseInt(newValue) || 0);
					if ($scope.model.infbndsec < 0) {
						$scope.model.infbndsec = 0;
					}
					$scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end) + (parseInt(newValue) || 0);
					if ($scope.model.supbndsec > $scope.model.fullDuration) {
						$scope.model.supbndsec = $scope.model.fullDuration;
					}
					$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;
					if ($scope.model.current_time < $scope.model.infbndsec) {
						$scope.model.current_time = $scope.model.infbndsec;
					}
					if ($scope.model.current_time > $scope.model.supbndsec) {
						$scope.model.current_time = $scope.model.supbndsec;
					}
				}
			});

			$scope.$watch('model.fullDuration', function(newValue) {
				if(newValue !== undefined) {
					if ($scope.model.supbndsec > $scope.model.fullDuration) {
						$scope.model.supbndsec = $scope.model.fullDuration;
					}
					$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;
					$scope.model.current_time = $scope.model.queueData.fragment.start;

				}
			});

		}]);




