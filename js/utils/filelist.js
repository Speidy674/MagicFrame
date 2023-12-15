const fs = require("fs");
const path = require("path");

const imgFormat = [".jpg", ".png", ".gif", ".jpeg", ".webp"];
const vidFormat = [".mp4"];

const formats = imgFormat.concat(vidFormat);


function FileList() {

	var fileList = [];

	this.loadFileList = async function () {
		Log.log("[FileList]", "Load files ...");
		filelist = [];
		fs.readdir(path.resolve(`${global.root_path}/files/`), { recursive: true }, (err, tmpfileList) => {
			tmpfileList.forEach(function (file) {
				if (formats.some(v => file.includes(v))) {
					console.debug(`${file} is supported`);
					fileList.push(file);
				} else {
					console.debug(`${file} is not supported`);
				}
			});
		});
	};

	this.getRandomFile = function () {
		var file = fileList[Math.floor(Math.random() * fileList.length)];
		file = file.replaceAll(" ", "%20");
		return file;
	}

	this.isVid = function (file) {
		if (vidFormat.some(v => { return path.extname(file) == v })) return true;
		return false;
	}
}

module.exports = new FileList();