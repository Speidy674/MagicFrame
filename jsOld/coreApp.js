const fs = require("fs");
const path = require("path");
const Server = require(`${__dirname}/server`);
const Database = require(`${__dirname}/db/core`);


global.version = require(`${__dirname}/../package.json`).version;
console.log("[Core]", "Starting MagicFrame Core: v" + global.version);

global.root_path = path.resolve(`${__dirname}/../`);


process.on("uncaughtException", function (err) {
	console.error("Whoops! There was an uncaught exception...");
	console.error(err);
});


/**
 * The Core
 *
 * @class
 */
function Core() {
	let httpServer;
	let io;
	let app;
	let server;
	let db;

	/**
	 * Loads the config file.
	 *
	 * @param {Function} callback Function to be called after loading the config
	 */
	function loadConfig(callback) {
		console.log("[Core]", "Loading config ...");
		const configFilename = path.resolve(`${global.root_path}/config/config.js`);

		try {
			fs.accessSync(configFilename, fs.F_OK);
			const c = require(configFilename);
			const config = Object.assign(c);
			callback(config);
		} catch (e) {
			if (e.code === "ENOENT") {
				console.error("[Core]", "WARNING! Could not find config file. Please create one.");
				process.exit(0);
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				console.error("[Core]", `WARNING! Could not validate config file. Please correct syntax errors at or above this line: ${e.stack}`);
				process.exit(0);
			} else {
				console.error("[Core]", `WARNING! Could not load config file. Error found: ${e}`);
				process.exit(0);
			}
			callback(defaults);
		}
	}

	this.loadConfig = function (callback) {
		loadConfig(function (c) {
			config = c;

			console.setLogLevel(config.logLevel);

			if (typeof callback === "function") {
				callback(config);
			}
		});
	};

	this.start = function (callback) {
		db = new Database(config)

		db.sync()

		httpServer = new Server(config, db, function (_app, _io, _server) {
			console.log("[Server]", "Server started ...");
			io = _io;
			app = _app;
			server = _server;

			io.on('connection', (socket) => {
				console.debug("[Socket]", 'User connected');

				socket.on('disconnect', () => {
					console.debug("[Socket]", 'User disconnected');
				});
			});
		});

		this.io = io
		this.app = app
		this.server = server
		this.db = db

		if (typeof callback === "function") {
			callback(app, io, server, db);
		}

	};

	this.stop = function () {
		httpServer.close();
	};
}

module.exports = new Core();