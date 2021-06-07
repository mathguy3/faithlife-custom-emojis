function waitForOnce(condition, callback) {
	return waitFor(condition, callback, true);
}

function waitFor(condition, callback, once = false) {
	async function waitForValue(e) {
		const changeRecords = e.detail;
		let startListening = false;
		for (let i = 0; i < changeRecords.length; i++) {
			const record = changeRecords[i];
			const addedNodes = record?.addedNodes ?? [];
			for (let j = 0; j < addedNodes.length; j++) {
				// emoji list box will be the first child of a popover element
				const node = addedNodes[j];

				if (condition(node)) {
					await callback(node);
					if (once) {
						document.removeEventListener("dom-changed", waitForValue);
					}
					return;
				}
			}
			if (startListening) {
				break;
			}
		}
	}
	document.addEventListener("dom-changed", waitForValue);
}

function queryUp(element, search, pre = "", post = "") {
	return element.closest(`${pre}[class^="${search}"]${post}`);
}

function queryForAll(element, search, pre = "", post = "") {
	return element.querySelectorAll(`${pre}[class^="${search}"]${post}`);
}

function queryForSingle(element, search, pre = "", post = "") {
	return element.querySelector(`${pre}[class^="${search}"]${post}`);
}

function findClassName(element, startOfClass) {
	let className;
	try {
		let match = queryForSingle(element, startOfClass);
		let classes = [...match.classList];
		className = classes.find((x) => x.startsWith(startOfClass));
	} catch (e) {
		console.log("Error finding className matching", startOfClass, "in", element);
		throw e;
	}
	return className;
}

async function getStorageOrDefault(key, def = {}) {
	return new Promise((resolve, reject) => {
		if (!chrome?.storage?.sync) {
			reject("Extension storage not found. The extension may have just been updated.");
		}
		chrome.storage.sync.get([key], (items) => resolve(items[key] ?? def));
	});
}

function setStorage(key, value) {
	if (!chrome?.storage?.sync) {
		reject("Extension storage not found. The extension may have just been updated.");
	}
	chrome.storage.sync.set({ [key]: value });
}
