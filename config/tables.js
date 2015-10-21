module.exports = [
	// Doodles
	'CREATE TABLE IF NOT EXISTS doodles (' +
		'id uuid, ' +
		'name text, ' +
		'description text, ' +
		'category text, ' +
		'created timestamp, ' +
		'primary key (id)' +
	')',
	// Doodles by user
	'CREATE TABLE IF NOT EXISTS doodles_by_user(' +
		'user_id uuid, ' +
		'doodle_id uuid, ' +
		'primary key (user_id, doodle_id)' +
	')',
	// User by doodle
	'CREATE TABLE IF NOT EXISTS user_by_doodle (' +
		'doodle_id uuid, ' +
		'user_id uuid, ' +
		'primary key(doodle_id, user_id)' + 
	')',
	// Users
	'CREATE TABLE IF NOT EXISTS users (' +
		'id uuid, ' +
		'email text, ' +
		'first_name text, ' +
		'last_name text, ' +
		'password text, ' + 
		'status text, ' +
		'created timestamp, ' +
		'primary key (id)' +
	')',
	// User by email
	'CREATE TABLE IF NOT EXISTS user_by_email (' +
		'email text, ' +
		'user_id uuid, ' +
		'primary key (email, user_id)' +
	')',
	// Participation requests
	'CREATE TABLE IF NOT EXISTS participation_requests (' +
		'id uuid, ' +
		'doodle_id uuid, ' +
		'from_id uuid, ' +
		'to_id uuid, ' +
		'primary key (id)' +
	')',
	// Participation requests by user
	'CREATE TABLE IF NOT EXISTS participation_request_by_user (' +
		'user_id uuid, ' +
		'participation_request_id uuid, ' +
		'primary key (user_id, participation_request_id)' +
	')',
	// Participation requests by doodle
	'CREATE TABLE IF NOT EXISTS participation_request_by_doodle (' +
		'doodle_id uuid, ' +
		'participation_request_id uuid, ' +
		'primary key (doodle_id, participation_request_id)' +
	')',
	// Schedules
	'CREATE TABLE IF NOT EXISTS schedules (' +
		'id uuid, ' +
		'begin_time timestamp, ' +
		'end_time timestamp, ' +
		'primary key(id)' +
	')',
	// Schedules by doodle
	'CREATE TABLE IF NOT EXISTS schedule_by_doodle (' +
		'doodle_id uuid, ' +
		'schedule_id uuid, ' +
		'primary key (doodle_id, schedule_id)' +
	')',
	// Votes
	'CREATE TABLE IF NOT EXISTS votes (' +
		'id uuid, ' +
		'vote int, ' +
		'primary key (id)' +
	')',
	// Votes by doodle and schedule
	'CREATE TABLE IF NOT EXISTS vote_by_doodle_and_schedule (' +
		'doodle_id uuid, ' +
		'schedule_id uuid, ' +
		'user_id uuid, ' +
		'vote_id uuid, ' +
		'primary key (doodle_id, schedule_id, user_id)' +
	')',
	// Votes by doodle and user
	'CREATE TABLE IF NOT EXISTS vote_by_doodle_and_user (' +
		'doodle_id uuid, ' +
		'user_id uuid, ' +
		'schedule_id uuid, ' +
		'vote_id uuid, ' +
		'primary key (doodle_id, user_id, schedule_id)' +
	')',
	// Notifications
	'CREATE TABLE IF NOT EXISTS notifications (' +
		'id uuid, ' +
		'from_id uuid, ' +
		'doodle_id uuid, ' +
		'primary key (id)' +
	')',
	// Notification by user
	'CREATE TABLE IF NOT EXISTS notification_by_user (' +
		'user_id uuid, ' +
		'notification_id uuid, ' +
		'primary key (user_id, notification_id)' +
	')',
	// Notification by doodle
	'CREATE TABLE IF NOT EXISTS notification_by_doodle (' +
		'doodle_id uuid, ' +
		'notification_id uuid, ' +
		'primary key (doodle_id, notification_id)' +
	')',
	// Configuration by user and doodle
	'CREATE TABLE IF NOT EXISTS configuration_by_user_and_doodle (' +
		'user_id uuid, ' +
		'doodle_id uuid, ' +
		'notification boolean, ' +
		'notification_by_email boolean, ' +
		'primary key (user_id, doodle_id) ' +
	')'
];