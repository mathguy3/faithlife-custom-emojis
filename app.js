const { readFileAsync } = require("./utils.js");

async function main() {
	var file = await readFileAsync("./db.json");
	console.log(file);
}
main();
