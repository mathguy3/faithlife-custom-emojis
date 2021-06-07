// Reaction Emoji Box
waitFor(
	(node) => {
		if (!node?.classList || !node.children?.length) {
			return false;
		}
		const firstChild = node.children[0];
		if (!firstChild.classList) {
			return false;
		}
		return [...firstChild.classList].some((c) => c.startsWith("emoji-box--emoji-box"));
	},
	async () => {
		const favorites = (await getStorageOrDefault("favorites"));

		const emojiList = queryForSingle(document, "emoji-box--categories");
		const message = emojiList.closest(".message");
		const messageId = message.getAttribute("data-message-id");
		if (!message) {
			return;
		}

		// Add favorites to emoji box
		const favoriteEmojiArray = Object.entries(favorites);
		if (!favoriteEmojiArray.length) {
			return;
		}

		const emojiClass = findClassName(emojiList, "emoji-box--category-emoji");

		for (let i = 0; i < favoriteEmojiArray.length; i++) {
			const emojiName = favoriteEmojiArray[i][0];
			const emojiUrl = favoriteEmojiArray[i][1];
			const emojiElement = document.createElement("button");
			emojiElement.innerHTML = `<img src="${emojiUrl}" style="width: 20px;"></img>`;
			emojiElement.classList.add(emojiClass, "custom-emoji");
			emojiElement.setAttribute("title", `:${emojiName}:`);
			emojiElement.setAttribute("id", `reaction-emoji-${emojiName}`);
			emojiList.prepend(emojiElement);

			const newEmojiButton = emojiList.querySelector(`#reaction-emoji-${emojiName}`);
			newEmojiButton.addEventListener("click", () => reactToMessage(messageId, emojiName));
		}

		// Add Favorites title
		const titleClass = findClassName(emojiList, "emoji-box--category-title");
		const titleElement = document.createElement("h4");
		titleElement.append("Custom Emojis");
		titleElement.classList.add(titleClass);
		emojiList.prepend(titleElement);

		// Hook into search input
		const searchInput = queryUp(emojiList, "emoji-box--emoji-box").childNodes[1].childNodes[0];
		searchInput.addEventListener("keyup", addCustomEmojiText);
	}
);

function addCustomEmojiText(e) {
	const searchInput = e.target;
	const emojiSearchText = searchInput.value;
	const emojiNameMatches = getEmojiNameMatches(emojiSearchText);
	const resultList = emojiNameMatches.map(x => [x, allEmojis[x]])

	const emojiBox = queryUp(searchInput, "emoji-box--emoji-box");

	const firstPreviousEntry = emojiBox.querySelector(".search-custom-emoji:first-of-type");
	const allPreviousEntries = emojiBox.querySelectorAll(".search-custom-emoji");
	const isArrowKey = e.key == "ArrowRight" || e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == "ArrowLeft";
	if (allPreviousEntries.length) {
		if (isArrowKey) {
			if (e.key == "ArrowDown") {
				const anyResults = queryForAll(emojiBox, "navigable-results--results");
				if (anyResults?.length) {
					const selectedClassName = findClassName(emojiBox, "navigable-results--results");

					const emojiButton = queryForSingle(firstPreviousEntry, "emoji-box--emoji", "button");
					emojiButton.classList.remove(selectedClassName);
				}
			}
			if (e.key == "ArrowUp") {
			}
			return;
		} else {
			for (let i = 0; i < allPreviousEntries.length; i++) {
				allPreviousEntries[i].remove();
			}
		}
	}

	if (resultList.length) {
		addSearchResultsToPopup(emojiBox, resultList, reactFromSearch);
	}

	if (e.keyCode === 13 && resultList.length) {
		const message = searchInput.closest(".message");
		const messageId = message.getAttribute("data-message-id");
		reactToMessage(messageId, resultList[0][0]);
	}
}

function reactFromSearch(e) {
	const element = e.target.nodeName === "BUTTON" ? e.target : e.target.closest("button");
	const message = element.closest(".message");
	const messageId = message.getAttribute("data-message-id");
	const emojiName = element.getAttribute("title");
	reactToMessage(messageId, emojiName);
}

function reactToMessage(messageId, emojiName) {
	const emojiText = `:${emojiName}:`;
	const request = new window.Request(
		`${window.location.origin}/messages/${messageId}/react?value=${encodeURIComponent(emojiText)}`,
		{
			credentials: "same-origin",
			headers: {},
			method: "POST",
			addRequestedWithHeader: true,
		}
	);
	request.headers.append("X-Requested-With", "XMLHttpRequest");
	window.fetch(request);
	document.activeElement.blur();
}
