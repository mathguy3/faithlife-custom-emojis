const fs = require("fs");

async function readFileAsync(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data.toString());
		});
	});
}

module.exports = { readFileAsync };
