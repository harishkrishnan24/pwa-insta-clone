let deferredPrompt;

if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then(() => {
			console.log("Service Worker registered!");
		})
		.catch((err) => {
			console.log(err);
		});
}

window.addEventListener("beforeinstallprompt", (event) => {
	console.log("Before install prompt fired");
	event.preventDefault();
	deferredPrompt = event;
	return false;
});
