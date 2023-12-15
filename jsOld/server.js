/* Magic Frame
 * Server
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
const express = require("express");
const app = require("express")();
const path = require("path");
const ipfilter = require("express-ipfilter").IpFilter;
const fs = require("fs");
const helmet = require("helmet");

const Log = require("logger");
const Utils = require("./utils.js");



function Server(config, callback) {
	const port = process.env.MF_PORT || config.port;
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

	Log.log(`Starting server on port ${port} ... `);

	server.listen(port, config.address || "localhost");

	if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
		Log.warn(Utils.colors.warn("You're using a full whitelist configuration to allow for all IPs"));
	}

	app.use(function (req, res, next) {
		ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
			if (err === undefined) {
				return next();
			}
			Log.log(err.message);
			res.status(403).send("This device is not allowed to access your Magic frame. <br> Please check your config.js change this.");
		});
	});
	app.use(helmet({ contentSecurityPolicy: false }));
	app.use(express.json());

	app.use("/js", express.static(__dirname));

	const directories = ["/config", "/css", "/fonts", "/files"];
	for (const directory of directories) {
		app.use(directory, express.static(path.resolve(global.root_path + directory)));
	}

	app.get("/version", function (req, res) {
		res.send(global.version);
	});

	app.get("/config", function (req, res) {
		res.send(config);
	});

	app.get("/", function (req, res) {
		let html = fs.readFileSync(path.resolve(`${global.root_path}/html/index.html`), { encoding: "utf8" });
		html = html.replace("#VERSION#", global.version);

		let configFile = "config/config.js";
		if (typeof global.configuration_file !== "undefined") {
			configFile = global.configuration_file;
		}
		html = html.replace("#CONFIG_FILE#", configFile);

		res.send(html);
	});

	app.get("/data/:file_id", function (req, res) {
		console.debug(`${req.params.file_id} has been requested`);
		res.sendFile(path.resolve(`${global.root_path}/files/${req.params.file_id}`));
	});

	app.use(express.static(path.join(global.root_path, "/public")));

	app.use(
		"/jquery",
		express.static(path.join(global.root_path, "/node_modules/jquery/dist"))
	);

	app.use(
		"/bootstrap",
		express.static(path.join(global.root_path, "/node_modules/bootstrap/dist"))
	);

	app.use(
		"/feather-icons",
		express.static(path.join(global.root_path, "/node_modules/feather-icons/dist"))
	);

	if (typeof callback === "function") {
		callback(app, io);
	}

	this.close = function () {
		for (const socket of serverSockets.values()) {
			socket.destroy();
		}
		server.close();
	};
}

module.exports = Server;