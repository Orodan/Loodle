(function () {

	var app = angular.module('loodle', []);

	app.factory('alert', function () {

		return {
			type: undefined,
			message: undefined
		};
	});

	app.controller('alertController', ['alert', function (alert) {

		this.alert = alert;

	}]);

	app.controller('authController', ['$http', 'alert', function ($http, alert) {

		this.email = '';
		this.password = '';
		this.token = '';

		this.login = function () {

			$http.post('/api/authenticate', { 
				email: this.email, 
				password: this.password 
			})
			.success(function (result){

				this.email = '';
				this.password = '';

				console.log("Data : ", result);
			})
			.error(function (result) {

				this.email = '';
				this.password = '';
				
				alert.type = 'danger';
				alert.message = result.data;

				console.log("Data : ", result);
			});
		}		

	}]);

})();