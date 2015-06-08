/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
    .controller('labelCtrl', ['$sce', '$scope', '$http',
        'defaults', '$controller', '$cookieStore', 'Session', '$rootScope', '$routeParams', 'camomileService',
        function ($sce, $scope, $http, defaults, $controller, $cookieStore, Session, $rootScope, $routeParams, camomileService) {

            $controller('CommonCtrl',
                {
                    $scope: $scope,
                    $http: $http,
                    defaults: defaults,
                    Session: Session
                });

            var MAXIMUM_NUMBER_OF_ELEMENT_AT_FIRST = 3;
            var personClicked;
            $scope.queues = [];
            $scope.model.queueTableData = [];
            $scope.model.person_visibility = [];
//            $scope.model.visibleAndSpeeking = [];
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

            $scope.model.updateIsDisplayedVideo = function (activate) {
                $scope.model.isDisplayedVideo = activate;
            };


            // PBR : get queue data from config
            $scope.model.incomingQueue = $rootScope.queues.labelIn;
            $scope.model.outcomingQueue = $rootScope.queues.labelOut;

            // initialize page state
            $scope.model.updateIsDisplayedVideo(false);

            $scope.model.description_flag = false;

            $scope.model.displayDescription = function () {
                $scope.model.description_flag = true;
            };

            // Initializes the data from the queue
            // rename from "initQueueData" to "popQueueElement"
            $scope.model.popQueueElement = function () {



                // Get queue first element and pop it from the queue
                camomileService.dequeue($scope.model.incomingQueue, function (err, data) {
                    if(!err)
                    {
                        // Update the next button's status
                        $scope.model.updateIsDisplayedVideo(true);

                        $scope.model.queueData = data;
                        $scope.model.corrected_data = "";
                        $scope.model.queueTableData = [];
                        $scope.model.person_visibility = [];
//                            $scope.model.visibleAndSpeeking = [];

//                        var date = new Date(); // already UTC date in JSON Format...
                        $scope.model.initialDate  = new Date(); // already UTC date in JSON Format...

                        // Get the video
                        if ($scope.model.queueData.fragment.id_medium != undefined) {

                            // Get queue element medium
                            camomileService.getMedium($scope.model.queueData.fragment.id_medium, function(err, data)
                            {
                                if(!err)
                                {
                                    $scope.$apply(function(){
                                        $scope.model.videoMetaData = data;
                                    });
                                }
                                else
                                {
                                    console.log(data);
                                    alert(data.error);
                                }

                            });

                            if($scope.model.useDefaultVideoPath)
                            {
                                $scope.model.video = $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.queueData.fragment.id_medium, 'webm'));
                            }

                            else
                            {
                                camomileService.getMedium($scope.model.queueData.fragment.id_medium, function(err, data)
                                {
                                    $scope.model.video = $sce.trustAsResourceUrl($scope.model.videoPath+ '/' + data.url +'.mp4');
//                                    $scope.model.video = $sce.trustAsResourceUrl($scope.model.videoPath+ '/' + data.url +'.webm');

                                });
                            }

                            // Fill the table
                            var maxValue = Math.min(MAXIMUM_NUMBER_OF_ELEMENT_AT_FIRST, $scope.model.queueData.data.length);
                            for(var i = 0, maxI = maxValue; i < maxI; i++)
                            {
                                $scope.model.queueTableData.push($scope.model.queueData.data[i]);

                                // Add the person
                                $scope.model.person_visibility.push("none");

                                $scope.clickOnNotVisible(i);
                            }

                            $scope.clickPerson = function(person)
                            {
                                d3.select('#'+personClicked).style("border", "none");
                                personClicked = person.target.id;
                                d3.select('#'+personClicked).style("border", "solid red 2px");
                                console.log(person.target.id);
                            };

                            $scope.model.lines = [];
                            // nb lignes
                            var lineIndex=0;
                            var colIndex;
                            $scope.model.lines[lineIndex] = [];
                            $scope.model.lines[lineIndex] [0]= {name:"new", image:"./img/new.png"};
                            for(var i = 0, maxI = $scope.model.queueData.data.length; i < maxI; i++)
                            {
                                colIndex = (i+1) % 5;
                                if(colIndex == 0 && lineIndex >0)
                                {
                                    lineIndex++;
                                    $scope.model.lines[lineIndex] = [];
                                }
                                $scope.model.lines[lineIndex][colIndex] = $scope.model.queueData.data[i];
                                $scope.model.lines[lineIndex][colIndex].image = $sce.trustAsResourceUrl($scope.model.lines[lineIndex][colIndex].image);
                            }

                            if ($scope.model.queueData !== undefined && $scope.model.queueData.fragment !== undefined && $scope.model.queueData.fragment.start !== undefined && $scope.model.queueData.fragment.end !== undefined) {
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

                                //FIXME: C'est ici que c'est fait au "mauvais moment"
                                $scope.$apply(function()
                                {
                                    $scope.model.current_time = $scope.model.queueData.fragment.start;
                                });

                            }
                        }
                        else {
                            $scope.model.video = undefined;
                        }

                    }
                    else
                    {
                        $scope.$apply(function(){
                            console.log(data);
                            alert(data.error);
                            $scope.model.video = undefined;
                            $scope.model.isDisplayedVideo = false;
                            $scope.model.queueTableData = [];
                            $scope.model.person_visibility = [];
//                                $scope.model.visibleAndSpeeking = [];
                            $scope.model.queueData.data = [];
                            $scope.model.updateIsDisplayedVideo(false);
                        })


                    }
                });

            };


            // Event launched when click on the save button.
            $scope.model.saveQueueElement = function () {

                // Creates the data to push into the queue
                var dataToPush = {};
                // Information relative to the shot
                dataToPush["fragment"] = {};
                dataToPush["fragment"]["medium_id"] = $scope.model.queueData.fragment.id_medium;
                dataToPush["fragment"]["id_shot"] = $scope.model.queueData.fragment.id_shot;

                // Information relative to the person
                dataToPush["data"] = [];
                var name;
                var value;
                var obj;
                for(var i= 0, maxI = $scope.model.queueTableData.length; i < maxI; i++)
                {
                    value = $scope.model.person_visibility[i];
                    if(value !== "none")
                    {
                        name = $scope.model.queueTableData[i].person_name;
                        obj = {};
                        obj[name] = value;
                        dataToPush["data"].push(obj);
                    }

                }

                // Update the queue by adding list element to the end of it
                camomileService.enqueue($scope.model.outcomingQueue, dataToPush, function (err, data) {
                    // Handle error
                    if(err)
                    {
                        alert(data.error);
                        console.log(data);
                    }
                    else
                    {
                        console.log("save");
                        $scope.model.popQueueElement();
                    }

                });

            };

            $scope.initPopup = function(){
                if($scope.isLogged())
                {
                    $("#label_tuto_modal").modal('show');
                }
            };

            $scope.openAddPersonModal = function(){
                if($scope.isLogged())
                {
                    $("#label_add_person_modal").modal('show');
                }
            };

            // Event that add a new person
            $scope.addAPerson = function()
            {
                var index = personClicked.split("_");
                index = parseInt(index[2])*MAXIMUM_NUMBER_OF_ELEMENT_AT_FIRST + parseInt(index[3]);
                if(index == 0)
                {
                    $scope.model.queueTableData.push({person_name:"unknown", image:"../img/new.png"});
                    $scope.model.person_visibility.push("none");
                }
                else
                {
                    $scope.model.queueTableData.push($scope.model.queueData.data[index-1]);
                    $scope.model.person_visibility.push("none");
                }

            };

            $scope.clickOnVisible = function(index)
            {
                // Remove the picture
                d3.select("#not_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_and_speaking_"+index).selectAll("*").remove();

                // Add the image in the right column
                d3.select("#is_visible_"+index).append("img").attr("src", $scope.model.queueTableData[index].image);


                $scope.model.person_visibility[index]= "face";
            };

            $scope.clickOnVisibleAndSpeaking = function(index)
            {
                // Remove the picture
                d3.select("#not_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_and_speaking_"+index).selectAll("*").remove();

                // Add the image in the right column
                d3.select("#is_visible_and_speaking_"+index).append("img").attr("src", $scope.model.queueTableData[index].image);

                $scope.model.person_visibility[index]= "speakingFace";
            };

            $scope.clickOnNotVisible = function(index)
            {
                // Remove the picture
                d3.select("#not_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_"+index).selectAll("*").remove();
                d3.select("#is_visible_and_speaking_"+index).selectAll("*").remove();

                // Add the image in the right column
                d3.select("#not_visible_"+index).append("img").attr("src", $scope.model.queueTableData[index].image);

                $scope.model.person_visibility[index]= "none";
            };



            var tooltip = d3.select("#button-tooltip");
            d3.select("#add_person_button").on("mouseover", function() {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip .html("Add a person")
                    .style("left", (d3.event.pageX + 20) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            }).on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

        }]);