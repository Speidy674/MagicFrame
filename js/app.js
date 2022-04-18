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

const imgFormat = [".jpg",".png",".gif",".jpeg",".webp"];
const vidFormat = [".mp4"];

const formats = imgFormat.concat(vidFormat);


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

	var frameCons = [];

	var fileList = []

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

	this.loadFileList = function (){
		Log.log("Load file List ...");
		var tmpfileList = fs.readdirSync(path.resolve(`${global.root_path}/files/`));
		tmpfileList.forEach(function (file) {
			if(file != "empty.png"){
				if (formats.some(v => file.includes(v))) {
					console.debug(`${file} is supported`);
					fileList.push(file);
				}else{				
					console.debug(`${file} is not supported`);
				}
			}
		});
	};

	function getRandomFile(){
		var file = fileList[Math.floor(Math.random() * fileList.length)];
		file = file.replaceAll(" ","%20");
		return file;
	}

	this.start = function (callback) {
		httpServer = new Server(config, function (app, io) {
			Log.log("Server started ...");

			var minutes = 1;
			var the_interval = minutes * 60 * 1000;

			updatePicInterval = setInterval(function() {
				
				for(var con in frameCons) {
					var id = frameCons[con];
					var file = getRandomFile();
					console.log(id+"|"+file);
					if (vidFormat.some(v => file.includes(v))) {
						var test = {type : "vid",file:file};
						io.to(id).emit("change",JSON.stringify(test));
					}
					
					if (imgFormat.some(v => file.includes(v))) {
						var test = {type : "img",file:file};
						io.to(id).emit("change",JSON.stringify(test));
					}
				}
				
			}, the_interval);			

			io.on('connection', (socket) => {
				const frameID = socket.handshake.headers.frameid;
				const width = socket.handshake.headers.width;
				const height = socket.handshake.headers.height;

				frameCons[frameID] = socket.id;
				socket.frameID = frameID;

				console.log('Frame connected (ID: '+socket.frameID+'('+socket.id+'))');

				var file = getRandomFile();

				if (vidFormat.some(v => file.includes(v))) {
					var test = {type : "vid",file:file};
				}

				if (imgFormat.some(v => file.includes(v))) {
					var test = {type : "img",file:file};
				}

				setTimeout(function () {io.sockets.emit("change",JSON.stringify(test))},5000);
				
				socket.on('disconnect', () => {
					console.log('user disconnected');
					delete frameCons[frameID];
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