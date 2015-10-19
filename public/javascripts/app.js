(function () {

	var app = angular.module('loodle', []);

	app.controller('loodlesController', ['$http', '$scope', '$location', function ($http, $scope, $location) {

		$http.get('/data/loodle/')
			.success(function (result) {
				$scope.loodles = result.data;
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

	}]);

	app.controller('loodleController', ['$http', '$scope', '$location', function ($http, $scope, $location) {

		$scope.loodle_id = window.location.pathname.split("/")[2];

		$http.get('/data/loodle/' + $scope.loodle_id)
			.success(function (result) {

				console.log("Result : ", result);

				$scope.loodle = result.data;

				// Format to easily display
				$scope.loodle.users.forEach(function (user) {

					user.votes = [];

					$scope.loodle.votes.forEach(function (vote) {

						if (user.id === vote.user_id)
							user.votes.push(vote);

					});

				});


				console.log(result);
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

	}]);

})();