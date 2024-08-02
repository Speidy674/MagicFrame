const fs = require("fs");
const path = require("path");

const imgFormat = [".jpg", ".png", ".gif", ".jpeg", ".webp"];
const vidFormat = [".mp4"];

const formats = imgFormat.concat(vidFormat);

function FileList() {

	var fileListNames = [];
	var fileInfos = [];

	this.loadFileList = async function () {
		Log.log("[FileList]", "Load files ...");
		fs.readdir(path.resolve(`${global.root_path}/files/`), { recursive: true }, (err, tmpfileList) => {
			tmpfileList.forEach(function (file) {
				if (formats.some(v => file.includes(v))) {
					console.debug("[FileList]", `${file} is supported`);
					const parts = file.split(/[\/\\]/);
					const fileName = parts.pop();

					if (!fileListNames.includes(fileName)) {

						let id = fileListNames.push(fileName) - 1;
						let fileInfo = {
							src: file,
							folder: parts,
							name: fileName,
							id: id,
						}
						fileInfos.push(fileInfo);

					}
				} else {
					console.debug("[FileList]", `${file} is not supported`);
				}
			});
		});

		for (const fileInfo of fileInfos) {
			if(!fs.existsSync(fileInfo.src)){
				console.log(fileInfo.src + " is gone");
			}
		}

		console.log(fileInfos.length, fileListNames.length);
	};

	this.getRandomFile = function () {
		var fileInfo = fileInfos[Math.floor(Math.random() * fileListNames.length)];
		fileInfo.src = fileInfo.src.replaceAll(" ", "%20");
		return fileInfo;
	}

	this.isVid = (fileInfo) => {
		if (vidFormat.some(v => { return path.extname(fileInfo.name) == v })) return true;
		return false;
	}

	this.getFiles = () => {
		return fileInfos;
	}

	this.getFile = (id) => {
		return fileInfos[id];
	}

	this.getFileCount = () => {
		return fileInfos.length;
	}
}

module.exports = new FileList();