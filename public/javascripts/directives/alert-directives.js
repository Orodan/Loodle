(function () {

	var app = angular.module('alert-directives', []);

	app.directive('alert', function () {

		return {
			restrict: 'E',
			templateUrl: '/partials/alert.html',
			controller: ['$scope', 'alert', function ($scope, alert) {

				$scope.alert = alert;

			}]
		}

	});

})();