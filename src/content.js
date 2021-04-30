if (
	location.href.startsWith("https://beta.faithlife.com/messages/") ||
	location.href.startsWith("https://faithlife.com/messages/") ||
	location.href.startsWith("https://internal.faithlife.com/messages/")
) {
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
			`https://beta.faithlife.com/messages/${messageId}/react?value=${encodeURIComponent(emojiName)}`,
			{
				credentials: "same-origin",
				headers: {},
				method: "POST",
				addRequestedWithHeader: true,
			}
		);
		request.headers.append("X-Requested-With", "XMLHttpRequest");
		window.fetch(request);
	}

	function getPersonalList(all, ...ids) {
		return ids.reduce((a, id) => ({ ...a, [id]: all[id] }), {});
	}

	const personalList = getPersonalList(
		allEmojis,
		"trollface",
		"worksonmymachine",
		"sus",
		"gasp",
		"woahdude",
		"partyparrot",
		"thanks",
		"merged"
	);

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
		}
	}
	document.addEventListener("dom-changed", waitForEmojiPicker);
}
