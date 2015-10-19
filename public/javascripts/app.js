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

		$http.get('/data/user')
			.success(function (result) {

				$scope.currentUser = result.data;

				console.log("Current user : ", result.data);
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

		var loadLoodleData = function () {
			$http.get('/data/loodle/' + $scope.loodle_id)
				.success(function (result) {

					$scope.loodle = result.data;

					// Format to easily display
					$scope.loodle.users.forEach(function (user) {

						user.votes = [];

						$scope.loodle.votes.forEach(function (vote) {

							if (user.id === vote.user_id)
								user.votes.push(vote);

						});

					});

					console.log("Loodle Data : ", $scope.loodle);

					console.log(result);
				})
				.error(function (result) {
					console.log("Error : ", result);
				})
		}

		loadLoodleData();

		$scope.saveVotes = function () {

			$scope.edit = false;

			var inputs = document.getElementsByClassName("input-vote");
			
			var data = [];

			Array.prototype.forEach.call(inputs, function (input) {
				data.push({
					id: input.getAttribute('data-id'),
					vote: (input.checked) ? 1 : 0
				});
			});

			$http.put('/vote', {votes: data})
				.success(function (result) {
					console.log("success");

					// Reload of the data
					loadLoodleData();
				})
				.error(function (result) {
					console.log("error");
				})

		}
	}]);

})();