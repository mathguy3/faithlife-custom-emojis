const emojiNames = Object.keys(allEmojis);

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
	try {
		return element.closest(`${pre}[class^="${search}"]${post}`);
	} catch (e) {
		throw new Error(`For element: ${element} - search: ${startOfClass} - ${e.message}`);
	}
}

function queryForAll(element, search, pre = "", post = "") {
	try {
		return element.querySelectorAll(`${pre}[class^="${search}"]${post}`);
	} catch (e) {
		throw new Error(`For element: ${element} - search: ${startOfClass} - ${e.message}`);
	}
}

function queryForSingle(element, search, pre = "", post = "") {
	try {
		return element.querySelector(`${pre}[class^="${search}"]${post}`);
	} catch (e) {
		throw new Error(`For element: ${element} - search: ${startOfClass} - ${e.message}`);
	}
}

const classNameCache = {};

function findClassName(element, startOfClass) {
	if (classNameCache[startOfClass]) {
		return classNameCache[startOfClass];
	}
	let className;
	try {
		let match = queryForSingle(element, startOfClass);
		let classes = [...match.classList];
		className = classes.find((x) => x.startsWith(startOfClass));
	} catch (e) {
		throw new Error(`For element: ${element} - search: ${startOfClass} - ${e.message}`);
	}
	classNameCache[startOfClass] = className;
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

function addSearchResultsToPopup(popupBox, results, onClick) {
	const searchBox = queryForSingle(popupBox, "navigable-results--results", "ul");

	const emojiClassName = findClassName(searchBox, "emoji-box--emoji");
	const emojiCharClassName = findClassName(searchBox, "emoji-box--emoji-char");
	const emojiNameClassName = findClassName(searchBox, "emoji-box--emoji-name");

	for (let i = 0; i < results.length; i++) {
		const emojiName = results[i][0];
		const emojiUrl = results[i][1];
		const searchEntry = document.createElement("li");
		searchEntry.setAttribute("data-emoji-name", emojiName);
		searchEntry.classList.add("search-custom-emoji");
		searchEntry.innerHTML = `
				<button title="${emojiName}" class="${emojiClassName}" style="position:relative;">
					<img src="https://files.logoscdn.com/v1/files/50162603/assets/11772906/content.png?signature=MsfmHwthtGGg9-yYK90uAUe1iO0" style="width:10px; height:10px; object-fit:cover; border-radius:50%; position: absolute; right: 8px; top:8px" />
					<div class="${emojiCharClassName}">
						<img src="${emojiUrl}" style="width: 20px;"></img>
					</div>
					<div class="${emojiNameClassName}">${emojiName}</div>
				</button>`;
		if (onClick) {
			searchEntry.addEventListener("click", onClick);
		}

		if (searchBox) {
			searchBox.prepend(searchEntry);
		} else {
			const notFoundBox = queryForSingle(popupBox, "emoji-box--no-results");
			if (notFoundBox) {
				notFoundBox.innerHTML = searchEntry.outerHTML;
			}
		}
	}
}

function getEmojiNameMatches(searchText) {
	const exactEmojiName = emojiNames.find((x) => x == searchText);
	const emojiNameFuzzyMatches = emojiNames.filter((x) => x.includes(searchText)).splice(0, 3);
	let emojiNameMatches = [...(exactEmojiName ? [exactEmojiName] : []), ...emojiNameFuzzyMatches];
	emojiNameMatches = Array.from(new Set(emojiNameMatches));
	return emojiNameMatches.reverse();
}