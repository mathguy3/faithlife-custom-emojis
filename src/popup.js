document.addEventListener(
	"DOMContentLoaded",
	async function () {
		const favoriteInput = document.getElementById("favorite");
		const addButton = document.getElementById("add");

		function createEmojiEntry(emojiName, emojiUrl) {
			const emojiElement = document.createElement("div");
			emojiElement.innerHTML = `<span class="emoji-text">:${emojiName}:</span>
				<img class="emoji" src="${emojiUrl}" style="width: 20px;"></img>
				<span class="emoji-delete-x" data-emoji-name="${emojiName}">X</span>`;
			emojiElement.classList.add("emoji-entry");
			emojiElement.setAttribute("id", emojiName);

			return emojiElement;
		}

		async function addFavoriteEmoji() {
			const emojiName = favoriteInput.value;
			const emojiUrl = allEmojis[emojiName];
			if (emojiUrl) {
				const favorites = (await getStorageOrDefault("favorites"));
				if (favorites[emojiName]) {
					return;
				}
				const emojiEntry = createEmojiEntry(emojiName, emojiUrl);
				const emojiContainer = document.getElementById("saved-emojis");
				emojiContainer.append(emojiEntry);
				setStorage("favorites", { ...favorites, [emojiName]: emojiUrl });
			} else {
				console.error("No emoji with text ", emojiName);
			}
			favoriteInput.value = "";
		}

		async function enterFavoriteEmoji(e) {
			if (e.keyCode == 13) {
				await addFavoriteEmoji();
			}
		}

		favoriteInput.addEventListener("keyup", enterFavoriteEmoji);
		addButton.addEventListener("click", addFavoriteEmoji);

		async function deleteFavoritedEmoji(e) {
			const xButton = e.target;
			const emojiName = xButton.getAttribute("data-emoji-name");
			const emojiEntry = xButton.closest(".emoji-entry");
			const favorites = await getStorageOrDefault("favorites");
			if (favorites[emojiName]) {
				delete favorites[emojiName];
			}
			setStorage("favorites", { ...(favorites ?? {}) });
			emojiEntry.remove();
		}

		const favorites = await getStorageOrDefault("favorites");

		const savedEmojis = Object.entries(favorites);
		const emojiContainer = document.getElementById("saved-emojis");
		for (let i = 0; i < savedEmojis.length; i++) {
			const emojiName = savedEmojis[i][0];
			const emojiUrl = savedEmojis[i][1];

			const emojiElement = createEmojiEntry(emojiName, emojiUrl);
			emojiContainer.append(emojiElement);

			const emojiDelete = emojiElement.querySelector(".emoji-delete-x");
			emojiDelete.addEventListener("click", deleteFavoritedEmoji);
		}
	},
	false
);
