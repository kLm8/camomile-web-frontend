/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
    .controller('RegressionCtrl', ['$sce', '$scope', '$http', 'CMError',
        'defaults', 'palette', '$controller', 'Session', 'camomile2pyannoteFilter', 'pyannote2camomileFilter', '$rootScope', 'camomileService',
        function ($sce, $scope, $http, CMError, defaults, palette, $controller, Session, camomile2pyannoteFilter, pyannote2camomileFilter, $rootScope, camomileService) {

            delete $http.defaults.headers.common['X-Requested-With'];

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

            var defaultHypothesis1Layer = {
                'label': 'Hypothesis 1',
                '_id': 'Hypothesis_1_init',
                'layer': []
            };

            var defaultHypothesis2Layer = {
                'label': 'Hypothesis 2',
                '_id': 'Hypothesis_2_init',
                'layer': []
            };

            var defaultRegressionLayer = {
                'label': 'Regression',
                '_id': 'Regression_init',
                'layer': []
            };

            // model.layers is mapped in cm-timeline using the defaults
            $scope.model.layers = [
                defaultReferenceLayer,
                defaultHypothesis1Layer,
                defaultHypothesis2Layer,
                defaultRegressionLayer
            ];

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
                                    $scope.compute_regression();
                                }
                                else if($scope.model.layers[0].layer != undefined
                                    && $scope.model.layers[1].layer != undefined
                                    && $scope.model.layers[2].layer != undefined)
                                {
                                    $scope.model.layersUpdated = true;
                                    $scope.compute_regression();
                                }
                            });
                        }
                        else
                        {
                            console.log(err, data);
                            alert(data.error);
                        }

                    },
                    {
											filter: {
												id_layer: layer_id,
												id_medium: medium_id
											}
                    });
            };

            $scope.get_before_annotations = function (corpus_id, medium_id, layer_id, do_update) {

                if(do_update == undefined)
                {
                    do_update = true;
                }
                $scope.model.layers[1] = {
                    'label': 'Hypothesis 1',
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
                                    $scope.compute_regression();
                                }
                                else if($scope.model.layers[0].layer != undefined
                                    && $scope.model.layers[1].layer != undefined
                                    && $scope.model.layers[2].layer != undefined)
                                {
                                    $scope.model.layersUpdated = true;
                                    $scope.compute_regression();
                                }
                            });
                        }
                        else
                        {
                            console.log(err, data);
                            alert(data.error);
                        }

                    },
                    {
											filter: {
												id_layer: layer_id,
												id_medium: medium_id
											}
                    });
            };

            $scope.get_after_annotations = function (corpus_id, medium_id, layer_id, do_update) {

                if(do_update == undefined)
                {
                    do_update = true;
                }

                $scope.model.layers[2] = {
                    'label': 'Hypothesis 2',
                    '_id': layer_id + "_2"
                };

                camomileService.getAnnotations(function(err, data)
                    {
                        if(!err)
                        {
                            $scope.$apply(function(){
                                $scope.model.layers[2].layer = data;

                                if(do_update)
                                {
                                    $scope.model.layersUpdated = true;
                                    $scope.compute_regression();
                                }
                                else if($scope.model.layers[0].layer != undefined
                                    && $scope.model.layers[1].layer != undefined
                                    && $scope.model.layers[2].layer != undefined)
                                {
                                    $scope.model.layersUpdated = true;
                                    $scope.compute_regression();
                                }
                            });
                        }
                        else
                        {
                            console.log(err, data);
                            alert(data.error);
                        }

                    },
                    {
											filter: {
												id_layer: layer_id,
												id_medium: medium_id
											}
                    });
            };

            $scope.compute_regression = function () {

                var reference_and_hypotheses = {
                    'reference': camomile2pyannoteFilter($scope.model.layers[0].layer),
                    'before': camomile2pyannoteFilter($scope.model.layers[1].layer),
                    'after': camomile2pyannoteFilter($scope.model.layers[2].layer)
                };

                if (reference_and_hypotheses.reference.content.length > 0 && reference_and_hypotheses.before.content.length > 0 && reference_and_hypotheses.after.content.length > 0) {
                    CMError.regression(reference_and_hypotheses).success(function (data) {
                        $scope.model.regression = data;
                        $scope.model.layers[3] = {
                            'label': 'Regression',
                            '_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id +
                                '_and_' + $scope.model.layers[2]._id,
                            'mapping': defaults.regressionMapping,
                            'tooltipFunc': defaults.tooltip
                        };

                        $scope.model.layers[3].layer = pyannote2camomileFilter(data);
                        $scope.model.layerWatch[3] = $scope.model.layers[3]._id;
                        $scope.model.layersUpdated = true;
                    });
                }

                // Force brushUpdate to be false in order to allow it to launch brushUpdate event later
                $scope.model.brushUpdate = false;
            };


            $scope.computeLastLayer = function () {
                $scope.compute_regression();
            };

            $scope.$watch('model.selected_corpus', function (newValue, oldValue, scope) {
                if (newValue) {
                    scope.model.selected_reference = undefined;
                    scope.model.selected_before = undefined;
                    scope.model.selected_after = undefined;
                    scope.get_media(scope.model.selected_corpus);
                    // blank the medium selection
                    scope.model.selected_medium = undefined;
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
                // when the medium changes, the viz is reinit, and the select box gets the new layers

                if (newValue) {

//                    scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/medium/" + scope.model.selected_medium + "/video");

                    if(scope.model.useDefaultVideoPath)
                    {
                        scope.model.video = $sce.trustAsResourceUrl(camomileService.getMediumURL(scope.model.selected_medium, 'webm'));
                    }
                    else
                    {
                        camomileService.getMedium(scope.model.selected_medium, function(err, data)
                        {
                            $scope.model.video = $sce.trustAsResourceUrl($scope.model.videoPath+ '/' + data.url +'.webm');

                        });
                    }

                    scope.get_layers(scope.model.selected_corpus);

                    if (scope.model.selected_reference != undefined) {
                        $scope.get_reference_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_reference, false);
                    }
                    if (scope.model.selected_before != undefined) {
                        $scope.get_before_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_before, false);
                    }

                    if (scope.model.selected_after != undefined) {
                        $scope.get_after_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_after, false);
                    }

//					scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[0] = defaultReferenceLayer;
                    scope.compute_regression();
                } else {
                    scope.get_reference_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_reference);
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_before', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[1] = defaultHypothesis1Layer;
                    scope.compute_regression();
                } else {
                    scope.get_before_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_before);
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_after', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[2] = defaultHypothesis2Layer;
                    scope.compute_regression();
                } else {
                    scope.get_after_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_after);
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
        }]);