require("module-alias/register");
global.Log = require("logger");
global.core = require("./coreApp.js");
const path = require("path");
const fs = require("fs");
const express = require('express');
const cron = require('node-cron');
const EventEmitter2 = require('eventemitter2');
const FileList = require("filelist");
const Mustache = require('mustache');

global.eventSub = new EventEmitter2({ wildcard: true });
global.fileList = new FileList();
global.framesCount = 0;

eventSub.onAny((e, ...args) => {
	console.log("[EventSub]", e)
})

async function main() {

	let config = process.env.config ? JSON.parse(process.env.config) : {};

	core.loadConfig(function (c) {
		config = c;
	});

	cron.schedule(config.intervalFileListUpdate, () => {
		fileList.loadFileList();
	});

	cron.schedule(config.intervalFrameChange, () => {
		Log.log("Change Frame Files")
		for (let [id, socket] of core.io.of("/").sockets) {
			if (socket.frame.id && socket.frame.init) {
				if (socket.frame.testing === undefined) {
					sendFile(fileList.getRandomFile(), id);
				}
			}
		}
	});

	cron.schedule("*/10 * * * * *", () => {
		for (let [id, socket] of core.io.of("/").sockets) {
			if (socket.frame.id && socket.frame.init) {
				if (socket.frame.testing !== undefined) {
					let max = fileList.getFileCount();
					socket.frame.testing++;
					if (socket.frame.testing >= max) {
						delete socket.frame.testing;
						sendFile(fileList.getRandomFile(), id);
					} else {
						sendFile(fileList.getFileInfo(socket.frame.testing), id, true);
					}
				}
			}
		}
	})

	fileList.loadFileList();

	core.start(async function (_app, _io, _server, _db) {
		global.db = _db

		const dashboard = express.Router();
		const frame = express.Router();
		const data = express.Router();
		const api = express.Router();

		_app.get("/", (req, res) => {
			res.redirect("/frame/")
		});

		dashboard.use("/js", express.static(path.resolve(`${global.root_path}/html/dashboard/js`)));
		dashboard.use("/css", express.static(path.resolve(`${global.root_path}/html/dashboard/css`)));
		dashboard.use("/assets", express.static(path.resolve(`${global.root_path}/html/dashboard/assets`)));

		dashboard.get("/", (req, res) => {
			let contentTemplate = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/dashboard.html`), { encoding: "utf8" });
			let contentHtml = Mustache.render(contentTemplate, {
				framesCount,
				filesCount: fileList.getFileCount()
			});

			res.send(renderDashboard(contentHtml));
		});

		dashboard.get("/files", (req, res) => {
			let contentTemplate = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/files.html`), { encoding: "utf8" });
			let contentHtml = Mustache.render(contentTemplate, {});

			res.send(renderDashboard(contentHtml));
		});

		dashboard.get("/frames", (req, res) => {
			let contentTemplate = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/frames.html`), { encoding: "utf8" });
			let contentHtml = Mustache.render(contentTemplate, {});

			res.send(renderDashboard(contentHtml));
		});

		dashboard.get("*any", (req, res) => {
			let html = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/assets/404.html`), { encoding: "utf8" });
			html = html.replace(/#VERSION#/gi, global.version);

			res.status(404).send(html);
		});

		frame.get("/", (req, res) => {
			let html = fs.readFileSync(path.resolve(`${global.root_path}/html/frame.html`), { encoding: "utf8" });
			html = html.replace(/#VERSION#/gi, global.version);

			res.send(html);
		});

		data.get("/:file_id", (req, res) => {
			const fileInfo = fileList.getFileInfo(req.params.file_id);

			console.debug(`${fileInfo.name} (${req.params.file_id}) has been requested`);
			res.sendFile(fileInfo.systemSrc);
		});

		api.get("/frame/:id", (req, res) => {
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

		api.get("/frames", (req, res) => {
			const frames = []
			for (let [id, socket] of core.io.of("/").sockets) {

				let frame = {
					socketId: id,
					frame: socket.frame
				}
				frames.push(frame)
			}

			res.status(200).json({ frames: frames })
		})

		api.get("/frames/testing", (req, res) => {

			for (let [id, socket] of core.io.of("/").sockets) {
				if (socket.frame.id && socket.frame.init) {
					socket.frame.testing = -1
				}
			}

			res.sendStatus(200);
		})

		api.get("/frames/twitch/play", (req, res) => {
			let type = req.query.type ?? "channel";
			let typeValue = req.query.typeValue ?? null;
			let frameId = req.query.frameId ?? null;
			let muted = req.query.muted ?? true;

			console.info("/frames/twitch/play", type, typeValue, frameId, muted)

			if (typeValue === null) {
				res.sendStatus(404);
				return;
			}

			if (frameId !== null) {
				for (let [id, socket] of core.io.of("/").sockets) {
					if (socket.frame.id == frameId && socket.frame.init) {
						socket.emit("twitch.play", type, typeValue, muted)
					}
				}
			}
			else {
				core.io.emit("twitch.play", type, typeValue, muted)
			}

			res.sendStatus(200);
		})

		api.get("/frames/twitch/stop", (req, res) => {
			let frameId = req.query.frameId ?? null;

			console.info("/frames/twitch/stop", frameId)

			if (frameId !== null) {
				for (let [id, socket] of core.io.of("/").sockets) {
					if (socket.frame.id == frameId && socket.frame.init) {
						socket.emit("twitch.stop")
					}
				}
			}
			else {
				core.io.emit("twitch.stop")
			}

			res.sendStatus(200);
		})

		api.get("/files", (req, res) => {
			let { page = 1, limit = 25 } = req.query
			page = parseInt(page)
			if (page <= 0) page = 1

			const files = fileList.getFiles()
			const totalFiles = fileList.getFileCount()
			const totalPages = Math.ceil(totalFiles / parseInt(limit))
			const startIndex = ((page * limit) - limit)
			const endIndex = (page * limit)
			const pagefiles = files.slice(startIndex, endIndex)

			const pageResult = {
				total: totalFiles,
				count: pagefiles.length,
				pages: totalPages,
				page: page,
				files: pagefiles
			}

			res.status(200).json(pageResult)
		})

		api.get("/file/:id", (req, res) => {
			let file = fileList.getFile(req.params.id) ?? null;
			if (file)
				res.status(200).json(file);
			else
				res.sendStatus(404)
		})

		api.get("/file/random", (req, res) => {
			let file = fileList.getRandomFile();
			res.status(200).json(file);
		})

		api.get("/files/update", (req, res) => {
			fileList.loadFileList();
			res.sendStatus(200);
		})

		api.get("*any", (req, res) => {
			res.sendStatus(404);
		});

		_app.use(express.static(path.resolve(__dirname, '../node_modules/mustache')))

		_app.use("/dashboard", dashboard);
		_app.use("/frame", frame);
		_app.use("/data", data);
		_app.use("/api", api);
	});

	core.io.on('connection', (socket) => {

		socket.customInfos = {
			type: socket.handshake.headers.type
		};

		socket.on('disconnect', () => {
			global.eventSub.emit("socket:disconnect", socket);

			switch (socket.customInfos.type) {
				case "frame":
					framesCount--
					break
				default:
					console.log("[Socket]", "Connect from unknow Type: " + socket.handshake.headers.type)
					break
			}
		});

		socket.onAny((eventName, ...args) => {
			console.debug("[Socket]", "[" + eventName + "]", args);
			global.eventSub.emit("socket:" + eventName, socket, ...args);
		});

		switch (socket.customInfos.type) {
			case "frame":
				handleFrame(socket)
				break
			default:
				console.log("[Socket]", "Connect from unknow Type: " + socket.handshake.headers.type)
				break
		}

	});

	eventSub.on('socket:initFrame', (socket, frameId) => {
		socket.frame.id = frameId.toLowerCase();
		socket.frame.file = "";
		if (socket.frame.init === false) {
			sendFile(fileList.getRandomFile(), socket.id);
			socket.frame.init = true;
		}
	});

	eventSub.on('socket:files.testing', (socket) => {
		socket.frame.testing = -1;
	})

	eventSub.on('socket:frameUpdateSize', (socket, size) => {
		if (socket.frame) {
			socket.frame.width = size.width
			socket.frame.height = size.height
		}
	})

	eventSub.on('socket:frameStoppedTwitch', (socket) => {
		if (socket.frame.init === true) {
			sendFile(fileList.getRandomFile(), socket.id);
		}
	})

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

function handleFrame(socket) {
	Log.debug("[Socket]", `Frame connected`)

	framesCount++;

	socket.frame = {
		init: false,
		id: "",
		width: socket.handshake.headers.width,
		height: socket.handshake.headers.height
	};
}

function renderDashboard(contentHtml) {
	let mainTemplate = fs.readFileSync(path.resolve(`${global.root_path}/html/dashboard/main.html`), { encoding: "utf8" });
	return Mustache.render(mainTemplate, {
		version: global.version,
		mainContent: contentHtml,
		copyrightYear: "2023-" + new Date().getFullYear()
	});
}

main();

function sendFile(fileInfo, socketId, testing = false) {

	var msg = { type: "img", file: fileInfo, testing };
	if (fileList.isVid(fileInfo)) msg = { type: "vid", file: fileInfo, testing };

	core.io.of("/").sockets.get(socketId).frame.file = fileInfo;
	core.io.to(socketId).emit("change", JSON.stringify(msg));
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}