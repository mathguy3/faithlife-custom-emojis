const emojiNames = Object.keys(allEmojis);

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

		const emojiList = queryFor(document, "emoji-box--categories");
		const message = emojiList.closest(".message");
		const messageId = message.getAttribute("data-message-id");
		if (!message) {
			return;
		}

		// Add favorites to emoji box
		const favoriteEmojiArray = Object.entries(favorites);
		if(!favoriteEmojiArray.length){
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
	const exactEmojiName = emojiNames.find((x) => x == emojiSearchText);
	const emojiName = exactEmojiName ?? emojiNames.find((x) => x.includes(emojiSearchText));

	const emojiText = `:${emojiName}:`;
	const emojiUrl = allEmojis[emojiName];

	const emojiBox = queryUp(searchInput, "emoji-box--emoji-box");
	const selectedClassName = findClassName(emojiBox, "emoji-box--selected-emoji");

	const previousEntry = emojiBox.querySelector(".search-custom-emoji");
	const isArrowKey = e.key == "ArrowRight" || e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == "ArrowLeft";
	if (previousEntry) {
		if (isArrowKey) {
			if (e.key == "ArrowDown") {
				const emojiButton = queryFor(previousEntry, "emoji-box--emoji", "button");
				emojiButton.classList.remove(selectedClassName);
			}
			if (e.key == "ArrowUp") {
			}
			return;
		} else {
			previousEntry.remove();
		}
	}

	if (emojiUrl) {
		const searchBox = emojiBox.queryFor("navigable-results--results", "ul");

		const emojiClassName = findClassName(searchBox, "emoji-box--emoji");
		const emojiCharClassName = findClassName(searchBox, "emoji-box--emoji-char");
		const emojiNameClassName = findClassName(searchBox, "emoji-box--emoji-name");

		const searchEntry = document.createElement("li");
		searchEntry.classList.add("search-custom-emoji");
		searchEntry.innerHTML = `
				<button title="${emojiName}" class="${emojiClassName} ${selectedClassName}" style="position:relative;">
					<img src="https://files.logoscdn.com/v1/files/50162603/assets/11772906/content.png?signature=MsfmHwthtGGg9-yYK90uAUe1iO0" style="width:10px; height:10px; object-fit:cover; border-radius:50%; position: absolute; right: 8px; top:8px" />
					<div class="${emojiCharClassName}">
						<img src="${emojiUrl}" style="width: 20px;"></img>
					</div>
					<div class="${emojiNameClassName}">${emojiName}</div>
				</button>`;

		searchEntry.addEventListener("click", reactFromSearch);

		if (searchBox) {
			searchBox.prepend(searchEntry);
		} else {
			const notFoundBox = emojiBox.queryFor("emoji-box--no-results");
			if (notFoundBox) {
				notFoundBox.innerHTML = searchEntry.outerHTML;
			}
		}
	}

	if (e.keyCode === 13 && emojiName) {
		const message = searchInput.closest(".message");
		const messageId = message.getAttribute("data-message-id");
		reactToMessage(messageId, emojiText);
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
