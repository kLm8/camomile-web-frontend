/**
 * Created by stefas on 09/03/15.
 */
angular.module('myApp.controllers')
    .controller('CommonCtrl', ['$scope', '$http', 'defaults', 'Session', '$rootScope', 'camomileService', '$resource', '$cookieStore',
        function ($scope, $http, defaults, Session, $rootScope, camomileService, $resource, $cookieStore) {

            'use strict';

            delete $http.defaults.headers.common['X-Requested-With'];

            $scope.model = {};
            $scope.model.absUrl = $rootScope.absUrl;

            var useDefaultVideoPath = $cookieStore.get("use.default.video.path");
            if (useDefaultVideoPath === undefined) useDefaultVideoPath = true;
            var videoPath = $cookieStore.get("video.path") || "";

            $scope.model.useDefaultVideoPath = useDefaultVideoPath;
            $scope.model.videoPath = videoPath;

            var config = $resource($rootScope.absUrl + '/config');

            // Use callbacks to store in $rootScope
            config.get().$promise.then(function (data) {
                $rootScope.dataroot = data.camomile_api;
                $rootScope.toolroot = data.pyannote_api;
                $rootScope.queues = data.queues;

                camomileService.setURL($rootScope.dataroot);

                camomileService.me(function (err, data) {
                    $scope.$apply(function () {
                        if (data.error) {
                            Session.isLogged = false;
                            Session.username = undefined;
                            $scope.model.message = undefined;
                        } else {
                            Session.isLogged = true;
                            Session.username = data.username;
                            $scope.model.message = "Connected as " + Session.username;
                        }
                    });
                });
            });

            // test if user is logged or not
            $scope.isLogged = function () {
                return Session.isLogged;
            };

            // URL for video
            $scope.model.video = "";

            function f_filterResults(n_win, n_docel, n_body) {
                var n_result = n_win ? n_win : 0;
                if (n_docel && (!n_result || (n_result > n_docel)))
                    n_result = n_docel;
                return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
            }

            // get the client height
            $scope.f_clientHeight = function () {
                return f_filterResults(
                    window.innerHeight ? window.innerHeight : 0,
                    document.documentElement ? document.documentElement.clientHeight : 0,
                    document.body ? document.body.clientHeight : 0
                );
            };

            // get the client width
            $scope.f_clientWidth = function () {
                return f_filterResults(
                    window.innerWidth ? window.innerWidth : 0,
                    document.documentElement ? document.documentElement.clientWidth : 0,
                    document.body ? document.body.clientWidth : 0
                );
            };

            $scope.model.edit_click = function () {
                $scope.model.edit_flag = true;
            };

            $scope.model.debugProbe = function () {
                console.log("probe called");
            };

            // hide contextmenu if clicked anywhere but on relevant targets
            $("body").on("click", function () {
                $("#contextMenu").hide().find("li").removeClass("disabled").children().css({
                    "pointer-events": "auto"
                });
            });

        }
    ]);