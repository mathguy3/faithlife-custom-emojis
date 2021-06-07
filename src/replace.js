waitForOnce(
	(node) => node.classList?.contains("conversation"),
	(messageContainer) => {
		const observer = new MutationObserver((list) => {
			const evt = new CustomEvent("dom-changed", { detail: list });
			messageContainer.dispatchEvent(evt);
		});
		observer.observe(messageContainer, { attributes: true, childList: true, subtree: true });
		messageContainer.addEventListener("dom-changed", replaceEmojis);
		replaceEmojis({ target: messageContainer, details: [] });

		const messageEditor = document.querySelector(".conversation-reply-editor");
		messageEditor.addEventListener("input", watchInput);
	}
);

function replaceEmojis(e) {
	const changeList = e?.detail ?? [];
	if (changeList[0]?.target?.classList[0]?.slice(0, 10) == "markdown--") {
		return;
	}

	// Replace within messages
	var messages = e.target.querySelectorAll(".message__contents > :not(.conversation-edit-message-editor) p");
	for (var i = 0; i < messages.length; i++) {
		var message = messages[i];
		var content = message.innerHTML;
		var newContent = content.replace(/(?<!title="):([^\s]+):/gm, (a, b) => {
			const matchingEmoji = allEmojis[b];
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
			const matchingEmoji = allEmojis[b];
			return matchingEmoji ? `<img src="${matchingEmoji}" style="width: 20px;"></img>` : a;
		});
		if (content != newContent) {
			reaction.innerHTML = newContent;
		}
	}
}

function watchInput(e) {
	const searchInput = e.target;
	const inputText = searchInput.innerText;
	const emojiStart = inputText.lastIndexOf(":") + 1;
	const emojiSearchText = inputText.slice(emojiStart);
	const popupContainer = queryForSingle(document, 'popup-container--relative');

	if (!emojiSearchText.length || !popupContainer) {
		return;
	}
	const emojiNameMatches = getEmojiNameMatches(emojiSearchText);
	const resultList = emojiNameMatches.map(x => [x, allEmojis[x]]);

	const allPreviousEntries = queryForAll(popupContainer, "search-custom-emoji");
	const isArrowKey = e.key == "ArrowRight" || e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == "ArrowLeft";
	if (allPreviousEntries.length) {
		if (isArrowKey) {
			return;
		} else {
			for (let i = 0; i < allPreviousEntries.length; i++) {
				allPreviousEntries[i].remove();
			}
		}
	}

	if (resultList.length) {
		addSearchResultsToPopup(popupContainer, resultList, null, "background: #f2f2f2");
	}
}