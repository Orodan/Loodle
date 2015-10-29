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
cd app/models/
```

Edit the file 

```
notification-by-email.model.js
```

and edit the transporter.


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

