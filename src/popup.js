allEmojis = allEmojis;
document.addEventListener(
	"DOMContentLoaded",
	function () {
		var runButton = document.getElementById("emojis");

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
		});
	},
	false
);
