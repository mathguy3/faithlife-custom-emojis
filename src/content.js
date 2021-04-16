var emojisList = allEmojis;
const observer = new MutationObserver((list) => {
	const evt = new CustomEvent("dom-changed", { detail: list });
	document.dispatchEvent(evt);
});
observer.observe(document, { attributes: true, childList: true, subtree: true });

function replaceEmojis(e, firstRun) {
	const changeList = e?.detail ?? [];
	if (changeList[0]?.target?.classList[0]?.slice(0, 10) == "markdown--") {
		return;
	}

	// Replace within messages
	var messages = e.target.querySelectorAll(".message__contents p");
	for (var i = 0; i < messages.length; i++) {
		var message = messages[i];
		var content = message.innerHTML;
		var newContent = content.replace(/(?<!title="):([^\s]+):/gm, (a, b) => {
			const matchingEmoji = emojisList[b];
			if (b === "pizzaparrot") {
				console.log(b, e);
			}
			return matchingEmoji
				? `<img title=":${b}:" src="${matchingEmoji}" style="width: 20px; margin-bottom: -3px;"></img>`
				: a;
		});
		if (content != newContent) {
			message.innerHTML = newContent;
		}
	}

	// Replace within reactions
	var reactions = e.target.querySelectorAll('.message__contents button[class^="message--reaction-button"]');
	for (var i = 0; i < reactions.length; i++) {
		var reaction = reactions[i];
		var content = reaction.innerHTML;
		const newContent = content.replace(/(?<!title="):([^\s]+):/gm, (a, b) => {
			const matchingEmoji = emojisList[b];
			return matchingEmoji
				? `<img title=":${b}:" src="${matchingEmoji}" style="width: 20px; margin-bottom: -3px;"></img>`
				: a;
		});
		if (content != newContent) {
			reaction.innerHTML = newContent;
		}
	}
}

function waitForMessageContents(e) {
	const changeRecords = e.detail;
	let startListening = false;
	for (let i = 0; i < changeRecords.length; i++) {
		const record = changeRecords[i];
		const addedNodes = record?.addedNodes ?? [];
		for (let j = 0; j < addedNodes.length; j++) {
			const node = addedNodes[j];
			startListening = node?.classList?.contains("conversation");
			if (startListening) {
				break;
			}
		}
		if (startListening) {
			break;
		}
	}
	if (startListening) {
		const messageContainer = document.querySelector(".conversation");
		if (messageContainer) {
			const observer = new MutationObserver((list) => {
				const evt = new CustomEvent("dom-changed", { detail: list });
				messageContainer.dispatchEvent(evt);
			});
			observer.observe(messageContainer, { attributes: true, childList: true, subtree: true });
			messageContainer.addEventListener("dom-changed", replaceEmojis);
			replaceEmojis({ target: messageContainer, details: [] }, true);
			document.removeEventListener("dom-changed", waitForMessageContents);
		}
	}
}

document.addEventListener("dom-changed", waitForMessageContents);
