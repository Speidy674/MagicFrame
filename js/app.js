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
const { clearInterval } = require("timers");
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
	let updatePicInterval;

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

	this.loadConfig = function (callback) {
		loadConfig(function (c) {
			config = c;

			Log.setLogLevel(config.logLevel);
			
			if (typeof callback === "function") {
				callback(config);
			}
		});
	};

	this.start = function (callback) {
		httpServer = new Server(config, function (app, io) {
			Log.log("Server started ...");

			var i = 0;
			var minutes = 1
			var the_interval = minutes * 60 * 1000;
			updatePicInterval = setInterval(function() {
				if(i==0){
					io.sockets.emit("changePic","https://speidy674.de/img/logo.png");
					i++;
				}else if(i==1){
					io.sockets.emit("changePic","https://wallpapercave.com/wp/wp4771870.jpg");
					i++;
				}else if(i==2){
					io.sockets.emit("changePic","https://cutewallpaper.org/25/beautiful-girl-gif-wallpaper/47-6b76e-gif-20866-desktop-cd12f-wallpaper-4ef16-windows-0bfb8-7-0ce3d-on-5d935-wallpapersafari.gif");
					i++;
				}else if(i==3){
					io.sockets.emit("changePic","https://wallpaperaccess.com/full/24528.png");
					i = 0 ;
				}
				
			}, the_interval);
			


			io.on('connection', (socket) => {
				console.log('a user connected');
				setTimeout(function () {socket.emit("changePic","https://wallpaperaccess.com/full/24528.png");},5000);
				
				socket.on('disconnect', () => {
					console.log('user disconnected');
				});
			});
	});
};

this.stop = function () {
	httpServer.close();
	clearInterval(updatePicInterval);
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