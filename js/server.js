/* Twitch Overlay
 * Server
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
const express = require("express");
const app = require("express")();
const ipfilter = require("express-ipfilter").IpFilter;
const path = require("path");
var cors = require('cors');
const helmet = require("helmet");
const utils = require("utils");


function Server(config, callback) {
	const port = config.port;
	const serverSockets = new Set();

	let server = null;
	if (config.useHttps) {
		const options = {
			key: fs.readFileSync(config.httpsPrivateKey),
			cert: fs.readFileSync(config.httpsCertificate)
		};
		server = require("https").Server(options, app);
	} else {
		server = require("http").Server(app);
	}

	const io = require("socket.io")(server, {
		cors: {
			origin: /.*$/,
			credentials: true
		},
		allowEIO3: true
	});

	server.on("connection", (socket) => {
		serverSockets.add(socket);
		socket.on("close", () => {
			serverSockets.delete(socket);
		});
	});

	Log.log("[Server]",`Starting server on port ${port} ... `);

	server.listen(port, config.address || "localhost");

	if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
		Log.warn(utils.colors.warn("You're using a full whitelist configuration to allow for all IPs"));
	}

	app.use(function (req, res, next) {
		ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
			if (err === undefined) {
				return next();
			}
			Log.log(err.message);
			res.status(403).send("This device is not allowed to access your MagicFrame. <br> Please check your config.js change this.");
		});
	});

	app.use(helmet(config.httpHeaders));

	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		return next();
	});

	app.use("/js", express.static(__dirname));

	const dirs = ["/css", "/fonts", "/files", "/imgs", "/vids", "/sounds"];
	for (const dir of dirs) {
		app.use(dir, express.static(path.resolve(global.root_path + "/html" + dir)));
	}

	var debugs = express.Router();

	debugs.get("/routes", function (req, res) {
		const stacks = app._router.stack
		const availableRoutes = stacks.reduce(
			(acc, val) => acc.concat(
				val.route ? [val.route.path] : val.name === "router" ? val.handle.stack.filter(
					x => x.route
				).map(
					x => val.regexp.toString().match(/\/[a-z]+/)[0] + (x.route.path === '/' ? '' : x.route.path)
				) : []
			), []
		).sort();

		res.send(availableRoutes);
	});

	app.get("/version", function (req, res) {
		res.send(global.version);
	});

	app.use("/debugs", debugs);;

	if (typeof callback === "function") {
		callback(app, io, server);
	}

	this.close = function () {
		for (const socket of serverSockets.values()) {
			socket.destroy();
		}
		server.close();
	};
}

module.exports = Server;