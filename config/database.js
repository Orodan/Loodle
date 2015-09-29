var async = require("async");
var cassandra = require('cassandra-driver');
var tables = require('./tables');

var keyspace = "doodlev2";

// Client use to connect the first time to the default ('system') keyspace
// Allow us to create in a second time the db structure used by the application
var system_client = new cassandra.Client({
	keyspace: 'system',
	contactPoints: ['127.0.0.1']
});

// Client connecting to the keyspace used by the application
var client = new cassandra.Client ({
	keyspace: keyspace,
	contactPoints: ['127.0.0.1']
});

function createKeyspace (name, callback) {

	system_client.execute("CREATE KEYSPACE IF NOT EXISTS " + keyspace + " WITH replication =" + 
               "{'class' : 'SimpleStrategy', 'replication_factor' : 1};", callback);
}

// Init the creation of keyspace and tables when the application is launched.
// Create keyspace and tables only if there is a need to.
client.init = function (callback) {
	async.series([
		// Connect to the system keyspace to be able to make request to Cassandra
		function _connectSystemKeyspace (done) {
			system_client.connect(function (err) {
				return done(err);
			});
		},
		// Create the doodle keyspace used by the application
		function _createDoodleKeyspace (done) {
			createKeyspace(keyspace, function (err) {
				// No need to be connected on the system keyspace anymore
				system_client.shutdown();
				return done(err);
			});
		},
		// Create the doodle tables used by the application
		function _createDoodleTables (done) {
			client.connect(function (err) { 
				if (err) { return done(err); }

				// Creation of each table
				async.each(tables, function (table_creation_request, end) {

					client.execute(table_creation_request, function (err) {
						return end(table_creation_request + "\n" + err);
					});
				}, function (err) {		
					if (err) { return done(err); }
				});
			});
		}
	], function (err) {
		return callback(err);
	});
};

module.exports = client;