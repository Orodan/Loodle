(function () {

	var app = angular.module('loodle', ['ngCookies']);

	app.controller('loodlesController', ['$http', '$scope', 'loodleService', function ($http, $scope, loodleService) {

		loodleService.getLoodles()
			.success(function (res) {
				$scope.loodles = res.data;
			});

		// Access the specified loodle
		$scope.access = function (loodle_id) {
			window.location = '/loodle/' + loodle_id;
		};

		// Delete the specified loodle
		$scope.delete = function (loodle_id) {
			loodleService.delete(loodle_id);
		}

	}]);

	app.controller('participationRequestsController', ['$http', '$scope', 'participationRequestService', function ($http, $scope, participationRequestService) {

		participationRequestService.loadPROfUser()
			.success(function (res) {
				$scope.participationRequests = participationRequestService.getPR();
			});

	}]);

	app.controller('loodleController', ['loodleService', '$timeout', '$http', '$scope', 'userService', 'participationRequestService', function (loodleService, $timeout, $http, $scope, userService, participationRequestService) {

		$scope.loodle_id = window.location.pathname.split("/")[2];

		// Format schedules date 
		var formatSchedule = function () {
			
			// Get the months
			// Get the days
			// Get the hours

			if (!$scope.loodle.schedules)
				return;

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

				schedule.begin_time = moment(schedule.begin_time);
				schedule.end_time = moment(schedule.end_time);
			});
			
			// Make it available in our scope
			$scope.months = months;
			$scope.days = days;
			$scope.hours = hours;

		};

		var formatUsers = function () {
			// Format to easily display
			if ($scope.loodle.users) {
				$scope.loodle.users.forEach(function (user) {

					user.votes = [];

					$scope.loodle.votes.forEach(function (vote) {

						if (user.id === vote.user_id)
							user.votes.push(vote);

					});

				});
			}

		};

		// Open the loodle to public (access without authentication)
		$scope.openLoodleToPublic = function () {
			loodleService.openLoodleToPublic($scope.loodle_id);
		};

		$scope.saveVotes = function () {

			// Hide the save votes button
			$scope.edit = false;

			// Get the votes data
			var inputs = document.getElementsByClassName("input-vote");
			
			var data = [];
			Array.prototype.forEach.call(inputs, function (input) {
				data.push({
					id: input.getAttribute('data-id'),
					vote: (input.checked) ? 1 : 0
				});
			});

			// Server call
			loodleService.updateVotes($scope.loodle_id, $scope.currentUser.id, data);

		}

		// User ==============================================

		userService.loadUser()
			.success(function (res) {
				$scope.currentUser = userService.getUser();
			})
			.error(function () {
				$scope.currentUser = false;
			});

		// Watch user change
		$scope.$watch(userService.getUser, function (user) {
			$scope.currentUser = user;
		});

		// Participation Requests ============================

		// Load participation requests
		participationRequestService.loadPROfLoodle($scope.loodle_id)
			.success(function (res) {
				$scope.participationRequests = participationRequestService.getPR();
			});

		// Watch participation requests change
		$scope.$watch(participationRequestService.getPR, function (PR) {
			$scope.participationRequests = PR;
		});

		// Loodle ============================================

		// Load loodle data
		loodleService.loadLoodle($scope.loodle_id)
			.success(function () {
				$scope.loodle = loodleService.getLoodle();
			});
		
		// Watch loodle change
		$scope.$watch(loodleService.getLoodle, function (loodle) {
			$scope.loodle = loodle;
			formatSchedule();
			formatUsers();
		});

	}]);

	app.controller('langController', ['$scope', '$cookies', function ($scope, $cookies) {

		$scope.setCookie = function (name, value) {

			// Set the cookie
			$cookies.put(name, value);

			// Reload the current page
			document.location.reload();

		};

	}]);

	app.controller('configurationController', ['$http', '$scope', 'configurationService', function ($http, $scope, configurationService) {

		var loodle_id = window.location.pathname.split("/")[2];

		configurationService.loadConfig(loodle_id)
			.success(function () {
				$scope.configuration = configurationService.getConfig();
			});

		$scope.editConfiguration = function () {

			var config = { 
				'notification' : $scope.configuration.notification,
				'notification_by_email' : $scope.configuration.notification_by_email
			};

			configurationService.updateConfig(loodle_id, config)
				.success(function () {
					window.location = '/loodle/' + loodle_id;
				});

			$http.put('/data/loodle/' + $scope.loodle_id + '/configuration'
				, { 
					'notification' : $scope.configuration.notification,
					'notification_by_email' : $scope.configuration.notification_by_email
				})
				.success(function (result) {
					window.location = '/loodle/' + $scope.loodle_id;
				})
				.error(function (result) {
					console.log("error : ", result);
				})

		};

	}]);

	app.controller('notificationsController', ['$http', '$scope', 'notificationService',function ($http, $scope, notificationService) {

		var loodle_id = window.location.pathname.split("/")[2];
		$scope.unreadNotif = 0;
		$scope.show = false;

		// Load the notifications of the user
		notificationService.loadNotifications(loodle_id)
			.success(function () {
				$scope.notifications = notificationService.getNotifications();

				$scope.notifications.forEach(function (element) {
					if (!element.is_read)
						$scope.unreadNotif++;
				});
			});

		// Watch notifications change
		$scope.$watch(notificationService.getNotifications, function (notifications) {
			$scope.notifications = notifications;
		});

		$scope.markAsRead = function (notification_id) {

			notificationService.markAsRead(notification_id)
				.success(function (result) {
					$scope.unreadNotif--;
					$scope.notifications.forEach(function (element) {
						if (element.id === notification_id)
							element.is_read = true;
					});
				});

		};

		$scope.toggleShow = function () {
			($scope.show) ? $scope.show = false : $scope.show = true
		};

	}]);

	app.controller('modalController', ['$http', '$scope', 'loodleService', 'userService', function ($http, $scope, loodleService, userService) {

		var loodle_id = window.location.pathname.split("/")[2];

		// Add a new public user to the current loodle
		$scope.addPublicUser = function () {

			// Get first name and last name value
			var first_name = $scope.first_name;
			var last_name = $scope.last_name;

			// Empty the fields
			$scope.first_name = null;
			$scope.last_name = null;

			// Server call
			userService.addPublicUser(loodle_id, first_name, last_name)
				.success(function (res) {
					// Reload the loodle data after the update 
					loodleService.loadLoodle(loodle_id);
					// Modify the current user
					userService.setUser(res.data);
				})
				.error(function (res) {
					console.log('userService.addPublicUser error : ', res);
				});

		};

	}]);


	// Services =============================================================================

	app.factory('loodleService', ['$http', function ($http) {

		var loodleService = {};

		// Data =============================================

		loodleService.loodle = {};

		// Functions ========================================

		// Return loodle data
		loodleService.getLoodle = function () {
			return loodleService.loodle;
		};

		// Load doodle data
		loodleService.loadLoodle = function (loodle_id) {

			return $http.get('/data/loodle/' + loodle_id)
				.success(function (res) {
					loodleService.loodle = res.data;
				})
				.error(function (res) {
					console.log("loodleService.loadLoodle error : ", res);
				})

		};

		// Set the loodle as public
		loodleService.openLoodleToPublic = function (loodle_id) {

			return $http.put('/data/loodle/' + loodle_id + '/public')
				.success(function (res) {
					loodleService.loadLoodle(loodle_id);
				})
				.error(function (res) {
					console.log("loodleService.openLoodleToPublic error : ", res);
				})

		};

		loodleService.updateVotes = function (loodle_id, user_id, votes) {

			return $http.put('/loodle/' + loodle_id + '/votes', {votes: votes, user_id: user_id})
				.success(function (result) {
					loodleService.loadLoodle(loodle_id);
				})
				.error(function (result) {
					console.log("loodleService.updateVotes error : ", result);
				})

		};

		loodleService.delete = function (loodle_id) {

			console.log('Call to loodleService.delete');

			return $http.delete('/loodle/' + loodle_id)
				.success(function () {
					window.location.reload();
				})
				.error(function (res) {
					console.log("loodleService.delete error : ", res);
				})

		};

		loodleService.getLoodles = function () {

			return $http.get('/data/loodle/')
				.error(function (res) {
					console.log("loodleService.getLoodles error : ", res);
				});

		};

		return loodleService;

	}]);

	app.factory('userService', ['$http', function ($http) {

		var userService = {};

		// Data =============================================

		userService.user = {};

		// Functions ========================================

		userService.getUser = function () {
			return userService.user;
		}

		userService.setUser = function (user) {
			userService.user = user;
		};

		userService.loadUser = function () {

			return $http.get('/data/user')
				.success(function (res) {
					userService.user = res.data;
				})
				.error(function (res) {
					userService.user = false;
					console.log("userService.loadUser error : ", res);
				});

		};

		userService.addPublicUser = function (loodle_id, first_name, last_name) {

			return $http.post('/data/loodle/' + loodle_id + '/user/public'
				, { 
					first_name: first_name,
					last_name: last_name
				})
				.error(function (res) {
					console.log('userService.addPublicUser error : ', res);
				})
		};

		return userService;

	}]);

	app.factory('participationRequestService', ['$http', function ($http) {

		var participationRequestService = {};

		// Data =============================================

		participationRequestService.participationRequests = [];

		// Functions ========================================

		participationRequestService.getPR = function () {
			return participationRequestService.participationRequests;
		}

		participationRequestService.loadPROfLoodle = function (loodle_id) {

			return $http.get('/data/loodle/' + loodle_id + '/participation-request')
				.success(function (res) {
					participationRequestService.participationRequests = res.data;
				})
				.error(function (res) {
					console.log("participationRequestService.loadPROfLoodle error : ", res);
				})

		};

		participationRequestService.loadPROfUser = function () {

			return $http.get('/data/participation-request/')
				.success(function (res) {
					participationRequestService.participationRequests = res.data;
				})
				.error(function (res) {
					console.log("participationRequestService.loadPROfUser error : ", res);
				})

		};

		return participationRequestService;

	}]);

	app.factory('notificationService', ['$http', function ($http) {

		var notificationService = {};

		// Data =============================================

		var notifications = [];

		// Functions ========================================

		notificationService.getNotifications = function () {
			return notificationService.notifications;
		};

		notificationService.loadNotifications = function (loodle_id) {

			return $http.get('/data/loodle/' + loodle_id + '/notifications')
				.success(function (res) {
					notifications = res.data;
				})
				.error(function (res) {
					console.log("notificationService.loadNotifications error : ", res);
				})

		};

		notificationService.markAsRead = function (notification_id) {

			return $http.put('/data/notification/' + notification_id)
				.error(function (res) {
					console.log("notificationService.markAsRead error : ", res);
				});

		};

		return notificationService;

	}]);

	app.factory('configurationService', ['$http', function ($http) {

		var configurationService = {};

		// Data =============================================

		var configuration = {};

		// Functions ========================================

		configurationService.getConfig = function () {
			return configuration;
		}

		configurationService.loadConfig = function (loodle_id) {

			return $http.get('/data/loodle/' + loodle_id + '/configuration')
				.success(function (res) {
					configuration = res.data;
				})
				.error(function (res) {
					console.log("configurationService.loadConfig error : ", res);
				})

		};

		configurationService.updateConfig = function (loodle_id, config) {

			return $http.put('/data/loodle/' + loodle_id + '/configuration', config)
				.error(function (res) {
					console.log("configurationService.editConfig error : ", res);
				})

		};

		return configurationService;

	}]);

})();