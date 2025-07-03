/* Twitch Overlay
 * Server
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
const express = require("express");
const app = require("express")();
const path = require("path");
const cors = require('cors')
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const session = require('express-session')
const crypto = require("crypto");
//const connectSessionSequelize = require('connect-session-sequelize')(session.Store);


function Server(config, db, callback) {
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

	Log.log("[Server]", `Starting server on port ${port} ... `);

	server.listen(port, config.address || "localhost");

	app.set('trust proxy', 1);

	app.use(cookieParser(config.cookieParserKey));

	//const sessionStore = new connectSessionSequelize({
	//	db: db.getInstance(),
	//	table: 'web_session',
	//	extendDefaultFields: function (defaults,session) {
	//		return {
	//			data: defaults.data,
	//			expires: defaults.expires,
	//			user_id: session.userId ?? "",
	//		}
	//	}
	//});

	const sessionMiddleware = session({
		genid: () => crypto.randomUUID(),
		name: 'sid',
		secret: config.cookieParserKey,
	//	store: sessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: true,
			maxAge: 1000 * 60 * 60 * 24
		}
	})

	app.use(sessionMiddleware)

	io.engine.use(sessionMiddleware)

	//sessionStore.sync();

	app.use(helmet(config.httpHeaders));

	app.use(function defaultHeaders(req, res, next) {
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
		const stacks = app.stack || (app.router && app.router.stack)

		let endpoints = []

		const getRoute = (stacks, path = "") => {
			stacks.forEach((layer) => {
				if (layer.name === 'handle') {
					let object = {
						method: Object.entries(layer.route.methods),
						path: Array.isArray(layer.route.path) ? layer.route.path.map((routePath) => path + routePath) : path + layer.route.path
					}
					endpoints.push(object)
				} else if (layer.name === 'router') {
					getRoute(layer.handle.stack, path + (layer.path ?? ""))
				} else if (layer.name === 'serveStatic') {

				}
			})
		}

		if (stacks) {
			getRoute(stacks)
		}

		res.send(endpoints);
	});

	debugs.get("/session", function (req, res) {
		res.json(req.session);
	})

	debugs.get("/cookies", function (req, res) {
		res.json(req.signedCookies);
	})

	debugs.get("/db/:table", async function (req,res) {
		res.json(await db.getModel(req.params.table).findAll())
	})

	app.get("/version", function (req, res) {
		res.send(global.version);
	});

	app.use("/debugs", debugs);

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