angular.module('myApp.directives')

    .factory('VisDataSet', function () {
        'use strict';
        return function (data, options) {
            // Create the new dataSets
            return new vis.DataSet(data, options);
        };
    })

/**
 * TimeLine directive
 */
    .directive('cmVisTimeline', function () {
        'use strict';
        return {
            restrict: 'EA',
            transclude: false,
            scope: {
                data: '=',
                options: '=',
                events: '='
            },
            link: function (scope, element, attr) {
                var timelineEvents = [
                    'rangechange',
                    'rangechanged',
                    'timechange',
                    'timechanged',
                    'select',
                    'doubleClick',
                    'click',
                    'contextmenu'
                ];

                // Declare the timeline
                var timeline = null;

                // scope.$watch('timeline', (function(){
                // 	console.log('change in timeline');
                // }));

                scope.$watch('data', function () {
                    // Sanity check
                    if (scope.data == null) {
                        return;
                    }

                    // If we've actually changed the data set, then recreate the graph
                    // We can always update the data by adding more data to the existing data set
                    if (timeline != null) {
                        timeline.destroy();
                    }

                    // Create the timeline object
                    timeline = new vis.Timeline(element[0]);
                    // scope.timeline = timeline;

                    // Attach an event handler if defined
                    angular.forEach(scope.events, function (callback, event) {
                        if (timelineEvents.indexOf(String(event)) >= 0) {
                            timeline.on(event, callback);
                        }
                    });

                    // Set the options first
                    timeline.setOptions(scope.options);
                    timeline.addCustomTime(0);
                    timeline.moveTo(0);

                    // Add groups and items
                    if (scope.data.groups != null) {
                        timeline.setGroups(scope.data.groups);
                    }
                    if (scope.data.items != null) {
                        timeline.setItems(scope.data.items);
                    }

                    // onLoad callback
                    if (scope.events != null && scope.events.onload != null && angular.isFunction(scope.events.onload)) {
                        scope.events.onload(timeline);
                    }
                });

                scope.$watchCollection('options', function (options) {
                    if(timeline == null) {
                        return;
                    }
                    timeline.setOptions(options);
                });
            }
        };
    })
