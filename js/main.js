require("module-alias/register");
global.Log = require("logger");
global.core = require("./coreApp.js");
const path = require("path");
const fs = require("fs");
const express = require('express');
const cron = require('node-cron');
const EventEmitter2 = require('eventemitter2');
const FileList = require("filelist");

global.eventSub = new EventEmitter2({ wildcard: true });
global.fileList = new FileList();

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
				if (socket.frame.testing === undefined) {
					sendFile(fileList.getRandomFile(), id);
				}
			}
		}
	});

	cron.schedule("*/10 * * * * *", () => {
		for (let [id, socket] of core.io.of("/").sockets) {
			if (socket.frame.id) {
				if (socket.frame.testing !== undefined) {
					let max = fileList.getFileCount();
					socket.frame.testing++;
					if (socket.frame.testing >= max) {
						delete socket.frame.testing;
						sendFile(fileList.getRandomFile(), id);
					} else {
						sendFile(fileList.getFile(socket.frame.testing), id, true);
					}
				}
			}
		}
	})

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

		api.get("/files", (req, res) => {
			let { page = 1, limit = 25 } = req.query;

			if( page <= 0) page = 1;

			const files = fileList.getFiles();
			const totalFiles = fileList.getFileCount();
			const totalPages = Math.ceil(totalFiles / parseInt(limit))
			const startIndex = ((page * limit) - limit);
			const endIndex = (page * limit)

			const pageResult = {
				total: totalFiles,
				pages: totalPages,
				files: files.slice(startIndex,endIndex)
			}

			res.status(200).json(pageResult);
		})

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

			res.status(200).json({ frames: frames })
		})

		api.get("/frame/:id", function (req, res) {
			for (let [id, socket] of core.io.of("/").sockets) {
				if (socket.frame.id && socket.frame.id == req.params.id) {
					let frame = {
						socketId: id,
						frame: socket.frame
					}
					res.status(200).json(frame)
					res.end();
				}
			}
			
			res.status(200).json({})
			res.end();
		})

		api.get("/file/random", function (req, res) {
			let file = fileList.getRandomFile();
			res.status(200).json(file);
		})

		api.get("/file/:id", function (req, res) {
			let file = fileList.getFile(req.params.id);
			if (file === undefined) file = {}
			res.status(200).json(file);
		})

		api.get("/files/update", (req,res) => {
			fileList.loadFileList();
			res.sendStatus(200);
		})

		api.get("*", function (req, res) {
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
			socket.frame.id = frameId.toLowerCase();
			socket.frame.file = "";
			if (socket.frame.init === false) {
				sendFile(fileList.getRandomFile(), socket.id);
				socket.frame.init = true;
			}
		});

		socket.on('files.testing', () => {
			socket.frame.testing = -1;
		})
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

function sendFile(file, socketId, testing = false) {

	var msg = { type: "img", file: file, testing };
	if (fileList.isVid(file)) msg = { type: "vid", file: file, testing };

	core.io.of("/").sockets.get(socketId).frame.file = file;
	core.io.to(socketId).emit("change", JSON.stringify(msg));
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}