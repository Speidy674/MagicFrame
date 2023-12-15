/* Magic Frame
 * The main file
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */

require("module-alias/register");
const core = require("./app.js");
const Log = require("logger");
const electron = require("electron");

// Config
let config = process.env.config ? JSON.parse(process.env.config) : {};

const app = electron.app;
core.loadConfig();

if (process.env.npm_config_server) {
	core.loadFileList();
	core.start(function (c) {
		config = c;
	});
}

if (process.env.npm_config_client) {
	const client = require("./client.js");
}

if (!process.env.npm_config_server && !process.env.npm_config_client) {
	Log.error("You need to start as client (--client), server (--server) or both (--client --server)");
	app.exit();
}