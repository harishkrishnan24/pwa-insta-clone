let deferredPrompt;
let enableNotificationsButtons = document.querySelectorAll(
	".enable-notifications"
);

if (!window.Promise) {
	window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/service-worker.js")
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

function displayConfirmNotification() {
	if ("ServiceWorker" in navigator) {
		var options = {
			body: "You Successfully subscribed to our Notification service",
			icon: "/src/images/icons/app-icon-96x96.png",
			image: "/src/images/sf-boat.jpg",
			dir: "ltr",
			lang: "en-US",
			vibrate: [100, 50, 200],
			badge: "/src/images/icons/app-icon-96x96.png",
			tag: "confirm-notification",
			renotify: true,
			actions: [
				{
					action: "confirm",
					title: "Okay",
					icon: "/src/images/icons/app-icon-96x96.png",
				},
				{
					action: "cancel",
					title: "Cancel",
					icon: "/src/images/icons/app-icon-96x96.png",
				},
			],
		};

		navigator.serviceWorker.ready.then((swreg) => {
			swreg.showNotification("Successfully subscribed!", options);
		});
	}
}

function configurePushSub() {
	if (!("serviceWorker" in navigator)) {
		return;
	}

	let req;

	navigator.serviceWorker.ready
		.then((swreg) => {
			req = swreg;
			return swreg.pushManager.getSubscription();
		})
		.then((sub) => {
			if (sub === null) {
				const vapidPublicKey =
					"BJiz6XNrNQfymzNITTyrR1GHp1bjPpf8YPuwf6vJ6Drz2qqFD1M24wSHkUGXV-iW6KqX_qfXgTqJNDUWOAbjKiw";
				const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
				return req.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: convertedVapidPublicKey,
				});
			} else {
			}
		})
		.then((newSub) => {
			return fetch("https://pwagram-51f1d.firebaseio.com/subscriptions.json", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(newSub),
			});
		})
		.then((res) => {
			if (res.ok) {
				displayConfirmNotification();
			}
		})
		.catch((err) => {
			console.lof(err);
		});
}

function askForNotificationPermission() {
	Notification.requestPermission(function (result) {
		console.log("User Choice", result);

		if (result !== "granted") {
			console.log("No notification permission granted");
		} else {
			configurePushSub();
		}
	});
}

if ("Notification" in window && "serviceWorker" in navigator) {
	for (let i = 0; i < enableNotificationsButtons.length; i++) {
		enableNotificationsButtons[i].style.display = "inline-block";
		enableNotificationsButtons[i].addEventListener(
			"click",
			askForNotificationPermission
		);
	}
}
