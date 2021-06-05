const observer = new MutationObserver((list) => {
	const evt = new CustomEvent("dom-changed", { detail: list });
	document.dispatchEvent(evt);
});
observer.observe(document, { attributes: true, childList: true, subtree: true });
