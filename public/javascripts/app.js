(function () {

	var app = angular.module('loodle', []);

	app.controller('loodlesController', ['$http', '$scope', function ($http, $scope) {

		$http.get('/data/loodle/')
			.success(function (result) {
				$scope.loodles = result.data;
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

	}]);

	app.controller('participationRequestsController', ['$http', '$scope', function ($http, $scope) {

		$http.get('/data/participation-request/')
			.success(function (result) {
				console.log("Data : ", result.data);
				$scope.participationRequests = result.data;
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

	}]);

	app.controller('loodleController', ['$http', '$scope', '$location', function ($http, $scope, $location) {

		$scope.loodle_id = window.location.pathname.split("/")[2];

		// Load the current user data
		$http.get('/data/user')
			.success(function (result) {
				$scope.currentUser = result.data;
			})
			.error(function (result) {
				console.log("Error : ", result);
			})

		// Format schedules date =============================
		var formatSchedule = function () {
			
			// Get the months
			// Get the days
			// Get the hours

			var months = []
				, days = []
				, hours = [];

			$scope.loodle.schedules.forEach(function (schedule) {

				var moment_begin_time = moment(schedule.begin_time);
				var moment_end_time = moment(schedule.end_time);

				// Get the months ====================

				if (months.length === 0) {
					months.push({
						// time: moment_begin_time.format('MMMM YYYY'),
						time: moment_begin_time,
						nbSchedules: 2
					});
				}
				else {

					var monthAlreadyPresent = false;

					months.forEach(function (month) {
						if (month.time.format('MMMM YYYY') === moment_begin_time.format('MMMM YYYY')) {
							monthAlreadyPresent = true;
							month.nbSchedules+=2;
						}
					})

					if (!monthAlreadyPresent) {
						months.push({
							// time: moment_begin_time.format('MMMM YYYY'),
							time: moment_begin_time,
							nbSchedules: 2
						});
					}
				}

				// Get the days =======================

				if (days.length === 0) {
					days.push({
						// time: moment_begin_time.format('dddd D'),
						time: moment_begin_time,
						nbSchedules: 2
					});
				}
				else {

					var dayAlreadyPresent = false;

					days.forEach(function (day) {
						if (day.time.format('dddd D') === moment_begin_time.format('dddd D')) {
							dayAlreadyPresent = true;
							day.nbSchedules+=2;
						}
					});

					if (!dayAlreadyPresent) {
						days.push({
							//time: moment_begin_time.format('dddd D'),
							time: moment_begin_time,
							nbSchedules: 2
						});
					}
				}

				// Get the hours
				hours.push(moment_begin_time);
				hours.push(moment_end_time);
				//hours.push(moment_begin_time.format('hh A'));
				//hours.push(moment_end_time.format('hh A'));
			});
			
			// Make it available in our scope
			$scope.months = months;
			$scope.days = days;
			$scope.hours = hours;
		};

		// Load the loodle data
		var loadLoodleData = function () {

			$http.get('/data/loodle/' + $scope.loodle_id)
				.success(function (result) {

					$scope.loodle = result.data;

					formatSchedule();

					// Format to easily display
					$scope.loodle.users.forEach(function (user) {

						user.votes = [];

						$scope.loodle.votes.forEach(function (vote) {

							if (user.id === vote.user_id)
								user.votes.push(vote);

						});

					});
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