allEmojis = allEmojis;
document.addEventListener(
	"DOMContentLoaded",
	function () {
		/*var runButton = document.getElementById("emojis");

		function modifyDOM() {
			var emojis = emojiList;
			var emojiListUrl = "https://www.flowdock.com/organizations/25449/emoji";
			if (location.href == emojiListUrl) {
				var emojiEntries = document.querySelectorAll(".uploaded-emoji tr.clear");
				for (var i = 1; i < emojiEntries.length; i++) {
					var emojiEntry = emojiEntries[i];
					var emojiText = emojiEntry.querySelector("td:nth-of-type(1)").textContent;
					emojiText = emojiText.slice(2, emojiText.length - 2);
					var emojiUrl = emojiEntry.querySelector("td .emoji").outerHTML;
					emojiUrl = emojiUrl.slice(emojiUrl.indexOf("url('") + 5, emojiUrl.length - 11);
					emojis[emojiText] = emojiUrl;
				}
				console.log(emojis);
			}
			var emojiListUrl2 = "https://www.webfx.com/tools/emoji-cheat-sheet/";
			if (location.href == emojiListUrl2) {
				var emojiEntries = document.querySelectorAll("ul.emojis span.emoji");
				for (var i = 1; i < emojiEntries.length; i++) {
					var emojiEntry = emojiEntries[i];
					var emojiText = emojiEntry.parentElement.querySelector("span.name").textContent;
					var emojiUrl = emojiEntry.attributes.getNamedItem("data-src").textContent;
					emojiUrl = emojiListUrl2 + emojiUrl;
					emojis[emojiText] = emojiUrl;
				}
				console.log(emojis);
			}
			return emojis;
		}
		runButton.addEventListener("click", function () {
			var code = `var emojiList = ${JSON.stringify(allEmojis)}; (` + modifyDOM + ")();";
			chrome.tabs.executeScript({ code }, (results) => {
				console.log(results[0]);
			});
		});*/
		const favoriteInput = document.getElementById("favorite");
		const addButton = document.getElementById("add");

		function addFavoriteEmoji() {
			const emojiName = favoriteInput.value;
			const emoji = allEmojis[emojiName];
			if (emoji) {
				chrome.storage.sync.get(["favorites"], (items) => {
					const { favorites } = items;
					if (favorites[emojiName]) {
						return;
					}
					chrome.storage.sync.set({ favorites: { ...(favorites ?? {}), [emojiName]: emoji } });

					const emojiElement = document.createElement("div");
					emojiElement.innerHTML = `<span class="emoji-text">:${emojiName}:</span><img class="emoji" src="${emoji}" style="width: 20px;"></img><span class="emoji-delete-x" data-emoji-name="${emojiName}">X</span>`;
					emojiElement.classList.add("emoji-entry");

					const emojiContainer = document.getElementById("saved-emojis");
					emojiContainer.append(emojiElement);
				});
			} else {
				console.error("No emoji with text ", emojiName);
			}
			favoriteInput.value = "";
		}

		function enterFavoriteEmoji(e) {
			if (e.keyCode === 13) {
				addFavoriteEmoji();
			}
		}

		favoriteInput.addEventListener("keyup", enterFavoriteEmoji);
		addButton.addEventListener("click", addFavoriteEmoji);

		function deleteFavoritedEmoji(e) {
			const xButton = e.target;
			const emojiName = xButton.getAttribute("data-emoji-name");
			const emojiEntry = xButton.closest(".emoji-entry");
			chrome.storage.sync.get(["favorites"], (items) => {
				const { favorites } = items;
				if (favorites && favorites[emojiName]) {
					delete favorites[emojiName];
				}
				chrome.storage.sync.set({ favorites: { ...(favorites ?? {}) } });
				emojiEntry.remove();
			});
		}

		chrome.storage.sync.get(["favorites"], (items) => {
			const savedEmojis = Object.entries(items.favorites ?? {});
			const emojiContainer = document.getElementById("saved-emojis");
			for (let i = 0; i < savedEmojis.length; i++) {
				const emojiName = savedEmojis[i][0];
				const emoji = savedEmojis[i][1];
				const emojiElement = document.createElement("div");
				emojiElement.innerHTML = `<span class="emoji-text">:${emojiName}:</span><img class="emoji" src="${emoji}" style="width: 20px;"></img><span class="emoji-delete-x" data-emoji-name="${emojiName}">X</span>`;
				emojiElement.classList.add("emoji-entry");
				emojiElement.setAttribute("id", emojiName);
				emojiContainer.append(emojiElement);

				const emojiDelete = emojiElement.querySelector(".emoji-delete-x");
				emojiDelete.addEventListener("click", deleteFavoritedEmoji);
			}
		});
	},
	false
);
