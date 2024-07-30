require("module-alias/register");
global.Log = require("logger");
global.core = require("./coreApp.js");
global.fileList = require("filelist");
const path = require("path");
const fs = require("fs");
const express = require('express');
const cron = require('node-cron');
const EventEmitter2 = require('eventemitter2');

global.eventSub = new EventEmitter2({ wildcard: true });

async function main() {

	let config = process.env.config ? JSON.parse(process.env.config) : {};

	core.loadConfig(function (c) {
		config = c;
	});

	cron.schedule(config.intervalFileList, () => {
		fileList.loadFileList();
	});

	cron.schedule(config.intervalFrameChange, () => {
		Log.log("Change Frame Files")
		for (let [id, socket] of core.io.of("/").sockets) {
			if (socket.frame.id) {
				sendFile(fileList.getRandomFile(), id);
			}
		}
	});

	fileList.loadFileList();

	core.start(async function (_app, _io, _server) {

		const dashboard = express.Router();
		const frame = express.Router();
		const data = express.Router();
		const api = express.Router();

		_app.get("/", function (req, res) {
			res.redirect("/frame/")
		});

		dashboard.use("/js", express.static(path.resolve(`${global.root_path}/html/dashboard/js`)));
		dashboard.use("/css", express.static(path.resolve(`${global.root_path}/html/dashboard/css`)));
		dashboard.use("/assets", express.static(path.resolve(`${global.root_path}/html/dashboard/assets`)));

		dashboard.get("/", function (req, res) {
			let html = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/index.html`), { encoding: "utf8" });
			html = html.replace(/#VERSION#/gi, global.version);

			res.send(html);
		});

		dashboard.get("*", function (req, res) {
			let html = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/assets/404.html`), { encoding: "utf8" });
			html = html.replace(/#VERSION#/gi, global.version);

			res.status(404).send(html);
		});

		frame.get("/", function (req, res) {
			let html = fs.readFileSync(path.resolve(`${global.root_path}/html/frame.html`), { encoding: "utf8" });
			html = html.replace(/#VERSION#/gi, global.version);

			res.send(html);
		});

		data.get("/:file_id(*)", function (req, res) {
			console.debug(`${req.params.file_id} has been requested`);
			res.sendFile(path.resolve(`${global.root_path}/files/${req.params.file_id}`));
		});

		api.get("/frames", function (req, res) {
			const frames = []
			for (let [id, socket] of core.io.of("/").sockets) {
				if (socket.frame.id) {
					let frame = {
						socketId: id,
						frame: socket.frame
					}
					frames.push(frame)
				}
			}

			res.status(200).json({frames: frames})
		})

		api.get("*", function (req, res) {
			res.type
			res.sendStatus(404);
		});


		_app.use("/dashboard", dashboard);
		_app.use("/frame", frame);
		_app.use("/data", data);
		_app.use("/api", api);
	});

	core.io.on('connection', (socket) => {
		socket.frame = {
			init: false,
			id: "",
			width: socket.handshake.headers.width,
			height: socket.handshake.headers.height
		};

		Log.debug("[Socket]", `Frame connected`)

		socket.onAny((eventName, ...args) => {
			console.debug("[Socket]", "[" + eventName + "]", args)
		});

		socket.on('initFrame', (frameId) => {
			socket.frame.id = frameId;
			if (socket.frame.init === false) {
				sendFile(fileList.getRandomFile(), socket.id);
				socket.frame.init = true;
			}
		});
	});


	process.on("SIGINT", () => {
		Log.log("[SIGINT]", "Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000);
		core.stop();
	});

	process.on("SIGTERM", () => {
		Log.log("[SIGTERM]", "Received. Shutting down server...");
		setTimeout(() => {
			process.exit(0);
		}, 3000);
		core.stop();
	});

}

main();

function sendFile(file, socketId) {

	var msg = { type: "img", file: file };
	//if (vidFormat.some(v => file.includes(v)))
	if (fileList.isVid(file)) msg = { type: "vid", file: file };

	core.io.to(socketId).emit("change", JSON.stringify(msg));
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}