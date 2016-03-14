# Loodle application

Online survey to schedule meetings using node.js, angularjs and cassandra

### Installing dependencies

The following dependencies are required to be able to launch the app on your computer

#### Node.js

Download and install the latest version of [Node.js](http://nodejs.org/). The loodle app has been developed with nodejs in version 4.2.1.

#### Apache Cassandra

Download the latest version of [Apache Cassandra](http://cassandra.apache.org/download/) and extract it to a directory of your choice. Cassandra must be avalaible on '127.0.0.1' (option by default).

#### Install NPM dependencies

Move to the applicaton directory and do the following :

```
npm install
```

#### Configuration

You have to configure the smtp server you want to use to be able to send notification by email. Go to your application directory.

```
cd app/models
```

Edit the file 

```
notification-by-email.model.js
```

and edit the transporter.

#### Config Cassandra cluster
```
cd config/
```
Edit the file
```
database.js
```
add config cluster
```
var system_client = new cassandra.Client({
	keyspace: 'system',
	contactPoints: ['db1','db2','db3']
});

// Client connecting to the keyspace used by the application
var client = new cassandra.Client ({
	keyspace: keyspace,
	contactPoints: ['db1','db2','db3']
	});
```
Warning : without port 


### Starting the app

Make sure every dependencies (nodejs, cassandra and npm dependencies are installed).

Launch cassandra :

```
cd my-cassandra-dir
bin/cassandra -f
```

Start the app :

```
npm start
```

Once launched, the app is available by default on localhost:3000.

### Run tests

To run the tests of the application, you must have mocha installed on your system. If not, use

```
npm install -g mocha
```

to install it.
Then make sure you are in the root directory of the application and write :

```
mocha
```

### Generate html documentation

The documentation of every functions have been made so that it could be generated in html files easily. To do so, start by installing jsdoc :

```
npm install -g jsdoc
```

Then make sure you are on the root directory of the application and write :

```
jsdoc -c ./config/conf.json
```

The generated html documentation will be generated in a folder called "out" in the root directory of the application.