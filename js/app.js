/* Magic Frame
 * The Core App (Server)
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
// Alias modules mentioned in package.js under _moduleAliases.
require("module-alias/register");

const fs = require("fs");
const path = require("path");
const Log = require("logger");
const Server = require(`${__dirname}/server`);
const Utils = require(`${__dirname}/utils`);


global.version = require(`${__dirname}/../package.json`).version;
Log.log("Starting MagicFrame Core: v" + global.version);

global.root_path = path.resolve(`${__dirname}/../`);

if (process.env.MF_CONFIG_FILE) {
	global.configuration_file = process.env.MF_CONFIG_FILE;
}

if (process.env.MF_PORT) {
	global.mmPort = process.env.MF_PORT;
}


process.on("uncaughtException", function (err) {
	Log.error("Whoops! There was an uncaught exception...");
	Log.error(err);
});

/**
 * The Core App (Server)
 *
 * @class
 */
function App() {
	let httpServer;

	/**
	 * Loads the config file.
	 *
	 * @param {Function} callback Function to be called after loading the config
	 */
	function loadConfig(callback) {
		Log.log("Loading config ...");

		const configFilename = path.resolve(global.configuration_file || `${global.root_path}/config/config.js`);

		try {
			fs.accessSync(configFilename, fs.F_OK);
			const c = require(configFilename);
			const config = Object.assign(c);
			callback(config);
		} catch (e) {
			if (e.code === "ENOENT") {
				Log.error(Utils.colors.error("WARNING! Could not find config file. Please create one. Starting with default configuration."));
			} else if (e instanceof ReferenceError || e instanceof SyntaxError) {
				Log.error(Utils.colors.error(`WARNING! Could not validate config file. Starting with default configuration. Please correct syntax errors at or above this line: ${e.stack}`));
			} else {
				Log.error(Utils.colors.error(`WARNING! Could not load config file. Starting with default configuration. Error found: ${e}`));
			}
			callback(defaults);
		}
	}

	this.start = function (callback) {
		loadConfig(function (c) {
			config = c;

			Log.setLogLevel(config.logLevel);


			httpServer = new Server(config, function (app, io) {
				Log.log("Server started ...");


				io.on('connection', (socket) => {
					console.log('a user connected');
					socket.on('disconnect', () => {
						console.log('user disconnected');
					});
				});


				if (typeof callback === "function") {
					callback(config);
				}

			});
		});
	};

	this.stop = function () {
		httpServer.close();
	};

	process.on("SIGINT", () => {
		Log.log("[SIGINT] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000);
		this.stop();
		process.exit(0);
	});

	process.on("SIGTERM", () => {
		Log.log("[SIGTERM] Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000);
		this.stop();
		process.exit(0);
	});
}

module.exports = new App();