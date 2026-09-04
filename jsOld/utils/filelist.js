const fs = require("fs");
const path = require("path");

const imgFormat = [".jpg", ".png", ".gif", ".jpeg", ".webp"];
const vidFormat = [".mp4"];

const formats = imgFormat.concat(vidFormat);

function FileList() {

	var fileListNames = [];
	var fileInfos = [];

	this.loadFileList = async () => {
		console.log("[FileList]", "Load files ...");
		try {
			const dirContent = fs.readdirSync(path.resolve(global.root_path, config.fileFolder), { recursive: true });

			for (const file of dirContent) {
				if (formats.some(v => file.includes(v))) {
					console.debug("[FileList]", `${file} is supported`);
					const parts = file.split(/[\/\\]/);
					const fileName = parts.pop();

					if (!fileListNames.includes(fileName)) {

						let id = fileListNames.push(fileName) - 1;
						let fileInfo = {
							id: id,
							src: file,
							folder: parts,
							name: fileName,
							systemSrc: path.resolve(global.root_path, config.fileFolder, file)
						}
						fileInfo.type = this.isVid(fileInfo) ? "vid" : "img"
						fileInfos[id] = (fileInfo);
					}

				} else {
					console.debug("[FileList]", `${file} is not supported`);
				}
			}
		} catch (e) {
			console.error(e)
		}

		const removedFilesId = []

		for (const id of fileListNames.keys()) {
			const name = fileListNames[id]
			const fileInfo = fileInfos[id]
			let exists = fs.existsSync(global.root_path, config.fileFolder, fileInfo.src);
			if (!exists) {
				console.debug("[FileList]", `${name} is gone.`)
				removedFilesId.push(id)
			}
		}

		for (const id of removedFilesId) {
			fileListNames.splice(id, 1)
			fileInfos.splice(id, 1)
		}

		for (const id of fileListNames.keys()) {
			const name = fileListNames[id]
			fileInfos[id].id = id
		}
	};

	this.getRandomFile = () => {
		var fileInfo = fileInfos[Math.floor(Math.random() * fileListNames.length)];
		return fileInfo;
	}

	this.isVid = (fileInfo) => {
		if (vidFormat.some(v => { return path.extname(fileInfo.name) == v })) return true;
		return false;
	}

	this.getFiles = () => {
		return fileInfos;
	}

	this.getFileInfo = (id) => {
		return fileInfos[id];
	}

	this.getFileCount = () => {
		return fileInfos.length;
	}
}

module.exports = FileList;