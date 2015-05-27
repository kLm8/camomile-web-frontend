'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp.controllers', ['myApp.services']);
angular.module('myApp.directives', ['myApp.filters', 'myApp.services']);
angular.module('myApp.services', ['ngResource']);

angular.module(
        'myApp',
        [
            'myApp.filters',
            'myApp.services',
            'myApp.directives',
            'myApp.controllers',
            'ngRoute',
            'ngCookies',
            'ngSanitize',
            'mgcrea.ngStrap'
        ])
    .config(['$routeProvider', function ($routeProvider) {
//        $routeProvider.when('/diff', {templateUrl: 'partials/diff.html'});
        $routeProvider.when('/regression', {templateUrl: 'partials/regression.html'});
        $routeProvider.when('/fusion', {templateUrl: 'partials/fusion.html'});
        $routeProvider.when('/queue', {templateUrl: 'partials/queue.html'});
        $routeProvider.when('/diff', {templateUrl:'partials/diff.html'});
        $routeProvider.when('/evidence', {templateUrl:'partials/evidence.html'});
		$routeProvider.when('/label', {templateUrl:'partials/label.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }])

    // Store config for data and tool access in the rootScope after promise resolution
    .run(['$resource', '$location', '$rootScope', function ($resource, $location, $rootScope) {
        // remove /# and everything following to ensure we get host root url (and everything between / and #)
        $rootScope.absUrl = $location.absUrl().replace(/(\/.*#.*)/, '');
        // remove potentially ending /
        $rootScope.absUrl = $rootScope.absUrl.replace(/(\/)$/, '');

        var index = $rootScope.absUrl.indexOf('lig');
        if(index == -1)
        {
            index = $rootScope.absUrl.indexOf('limsi');
        }
        if(index != -1)
        {
            $rootScope.absUrl = $rootScope.absUrl.substr(0, index-1);
        }

//        var config = $resource($rootScope.absUrl + '/config');
//
//        // Use callbacks to store in $rootScope
//        config.get().$promise.then(function (data) {
//            $rootScope.dataroot = data.camomile_api;
//            $rootScope.toolroot = data.pyannote_api;
//            $rootScope.queues = data.queues;
//        });

    }]);


