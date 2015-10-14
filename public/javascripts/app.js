(function () {

	var app = angular.module('loodle', []);

	app.controller('loodlesController', ['$http', '$scope', '$location', function ($http, $scope, $location) {

		$http.get('/loodle/')
			.success(function (result) {
				$scope.loodles = result.data;
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

	}]);

	app.controller('loodleController', ['$http', '$scope', '$location', function ($http, $scope, $location) {

		$scope.message = 'Welcome';

		console.log($location.url());

	}]);

})();