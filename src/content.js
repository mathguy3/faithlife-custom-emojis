if (
	location.href.startsWith("https://beta.faithlife.com/messages/") ||
	location.href.startsWith("https://faithlife.com/messages/") ||
	location.href.startsWith("https://internal.faithlife.com/messages/")
) {
	var emojisList = allEmojis;
	const emojiNames = Object.keys(emojisList);
	const observer = new MutationObserver((list) => {
		const evt = new CustomEvent("dom-changed", { detail: list });
		document.dispatchEvent(evt);
	});
	observer.observe(document, { attributes: true, childList: true, subtree: true });

	function replaceEmojis(e) {
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
				return matchingEmoji ? `<img src="${matchingEmoji}" style="width: 20px;"></img>` : a;
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

	function submitEmoji(e) {
		const button = e.target.nodeName == "BUTTON" ? e.target : e.target.parentNode;
		const emojiName = button.getAttribute("title");
		const messageId = button.getAttribute("data-message-id");
		const request = new window.Request(
			`${window.location.origin}/messages/${messageId}/react?value=${encodeURIComponent(emojiName)}`,
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

	function addCustomEmojiText(e) {
		const emojiSearch = e.target.value;
		const exactEmoji = emojiNames.find((x) => x == emojiSearch);
		const emojiName = exactEmoji ?? emojiNames.find((x) => x.includes(emojiSearch));

		const emojiText = `:${emojiName}:`;
		const emoji = allEmojis[emojiName];

		const selectedClassName = "emoji-box--selected-emoji--3ebo6";

		const previousEntry = e.target.closest(`div[class^="emoji-box--emoji-box"]`).querySelector(".search-custom-emoji");
		const isArrowKey = e.key == "ArrowRight" || e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == "ArrowLeft";
		if (previousEntry) {
			if (isArrowKey) {
				if (e.key == "ArrowDown") {
					const emojiButton = previousEntry.querySelector(`button[class^="emoji-box--emoji"]`);
					emojiButton.classList.remove(selectedClassName);
				}
				/*if (e.key == "ArrowUp") {
					const secondEntry = e.target
						.closest(`div[class^="emoji-box--emoji-box"]`)
						.querySelector(".navigable-results--results--3N_fE li:nth-of-type(2) .emoji-box--emoji--Sq_xl");
					if (secondEntry?.classList.contains(selectedClassName)) {
						e.target.focus();
					}
				}*/
				return;
			} else {
				previousEntry.remove();
			}
		}

		if (emoji) {
			const searchEntry = document.createElement("li");
			searchEntry.classList.add("search-custom-emoji");
			searchEntry.innerHTML = `
				<button title="${emojiName}" class="emoji-box--emoji--Sq_xl ${selectedClassName}" style="position:relative;">
					<img src="https://files.logoscdn.com/v1/files/50162603/assets/11772906/content.png?signature=MsfmHwthtGGg9-yYK90uAUe1iO0" style="width:10px; height:10px; object-fit:cover; border-radius:50%; position: absolute; right: 8px; top:8px" />
					<div class="emoji-box--emoji-char--24yBa">
						<img src="${emoji}" style="width: 20px;"></img>
					</div>
					<div class="emoji-box--emoji-name--1wTuU">${emojiName}</div>
				</button>`;

			searchEntry.addEventListener("click", sendEmojiFromSearch);
			const searchBox = e.target
				.closest(`div[class^="emoji-box--emoji-box"]`)
				.querySelector('ul[class^="navigable-results--results"]');
			if (searchBox) {
				searchBox.prepend(searchEntry);
			} else {
				const notFoundBox = e.target
					.closest(`div[class^="emoji-box--emoji-box"]`)
					.querySelector('div[class^="emoji-box--no-results"]');
				notFoundBox.innerHTML = searchEntry.outerHTML;
			}
		}

		if (e.keyCode === 13) {
			if (!emoji) {
				return;
			}
			sendEmojiFromMessage(e.target, emojiText);
		}
	}

	document.addEventListener("dom-changed", waitForMessageContents);
	function waitForEmojiPicker(e) {
		const changeRecords = e.detail;
		let startListening = false;
		for (let i = 0; i < changeRecords.length; i++) {
			const record = changeRecords[i];
			const addedNodes = record?.addedNodes ?? [];
			for (let j = 0; j < addedNodes.length; j++) {
				// emoji list box will be the first child of a popover element
				const node = addedNodes[j];
				if (!node?.classList || !node.children?.length) {
					continue;
				}
				const firstChild = node.children[0];

				for (let k = 0; k < firstChild.classList.length; k++) {
					startListening = firstChild.classList[k].startsWith("emoji-box--emoji-box");

					if (startListening) {
						break;
					}
				}
				if (startListening) {
					break;
				}
			}
			if (startListening) {
				break;
			}
		}
		if (startListening) {
			chrome.storage.sync.get(["favorites"], (items) => {
				if (!items.favorites) {
					return;
				}
				const personalList = items.favorites ?? {};
				const emojiArray = Object.entries(personalList);
				const emojiList = document.querySelector('div[class^="emoji-box--categories"]');
				const messageIdContainer = emojiList.closest(".message");
				if (!messageIdContainer) {
					return;
				}

				const emojiClass = emojiList
					.querySelector('button[class^="emoji-box--category-emoji"]:first-of-type')
					.getAttribute("class");
				const messageId = messageIdContainer.getAttribute("data-message-id");
				for (let i = 0; i < emojiArray.length; i++) {
					const emoji = emojiArray[i];
					const emojiElement = document.createElement("button");
					emojiElement.innerHTML = `<img src="${emoji[1]}" style="width: 20px;"></img>`;
					emojiElement.classList.add(emojiClass, "custom-emoji");
					emojiElement.setAttribute("title", `:${emoji[0]}:`);
					emojiElement.setAttribute("id", `custom-emoji-${emoji[0]}`);
					emojiElement.setAttribute("data-message-id", messageId);
					emojiList.prepend(emojiElement);

					const newEmojiButton = emojiList.querySelector(`#custom-emoji-${emoji[0]}`);
					newEmojiButton.addEventListener("click", submitEmoji);
				}

				const titleClass = emojiList
					.querySelector('h4[class^="emoji-box--category-title"]:first-of-type')
					.getAttribute("class");
				const titleElement = document.createElement("h4");
				titleElement.append("Custom Emojis");
				titleElement.classList.add(titleClass);
				emojiList.prepend(titleElement);

				const searchInput = emojiList.closest(`div[class^="emoji-box--emoji-box"]`).childNodes[1].childNodes[0];
				searchInput.addEventListener("keyup", addCustomEmojiText);
			});
		}
	}
	document.addEventListener("dom-changed", waitForEmojiPicker);
}

function sendEmojiFromSearch(e) {
	const element = e.target.nodeName === "BUTTON" ? e.target : e.target.closest("button");
	const emojiText = `:${element.getAttribute("title")}:`;
	sendEmojiFromMessage(element, emojiText);
}

function sendEmojiFromMessage(currentElement, emojiText) {
	const message = currentElement.closest(".message");
	const messageId = message.getAttribute("data-message-id");
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
