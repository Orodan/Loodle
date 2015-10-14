(function () {

	var app = angular.module('loodle', ['alert-directives']);

	app.controller('mainController', function () {

	});

	app.factory('alert', function () {

		return {
			type: undefined,
			message: undefined
		};
	});

	app.controller('authController', ['$http', '$location', 'alert', function ($http, $location, alert) {

		this.email = '';
		this.password = '';
		this.token = '';

		this.login = function () {

			$http.post('/api/authenticate', { 
				email: this.email, 
				password: this.password 
			})
			.success(function (result){

				// Empty the values
				this.email = '';
				this.password = '';

				// Set the service values
				// alert.type = 'success';
				// alert.message = result.data;

				// Change page
				console.log(document.location);
				$location.path('/home');
				// document.location = '/home';
			})
			.error(function (result) {

				this.email = '';
				this.password = '';
				
				alert.type = 'danger';
				alert.message = result.data;
			});
		}		

	}]);

	/**
	app.directive('testDirective', function () {

		return {
			restrict: 'E',
			templateUrl: '/partials/alert.html',
			controller: ['alert', function (alert) {

				this.alert = alert;

			}],
			controllerAs: 'alertCtrl'
		}

	});
	**/

})();