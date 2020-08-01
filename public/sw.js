importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const CACHE_STATIC_NAME = "static-v7";
const CACHE_DYNAMIC_NAME = "dynamic-v2";

const STATIC_FILES = [
	"/",
	"/index.html",
	"/offline.html",
	"/src/js/app.js",
	"/src/js/utility.js",
	"/src/js/feed.js",
	"/src/js/idb.js",
	"/src/js/promise.js",
	"/src/js/fetch.js",
	"/src/js/material.min.js",
	"/src/css/app.css",
	"/src/css/feed.css",
	"/src/images/main-image.jpg",
	"https://fonts.googleapis.com/css?family=Roboto:400,700",
	"https://fonts.googleapis.com/icon?family=Material+Icons",
	"https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

// function trimCache(cacheName, maxItems) {
// 	caches.open(cacheName).then((cache) => {
// 		return cache.keys().then((keys) => {
// 			if (keys.length > maxItems) {
// 				cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
// 			}
// 		});
// 	});
// }

self.addEventListener("install", (event) => {
	console.log("[Service Worker] Installing service worker...", event);
	event.waitUntil(
		caches.open(CACHE_STATIC_NAME).then((cache) => {
			console.log("[Service Worker] Precaching App Shell");
			cache.addAll(STATIC_FILES);
		})
	);
});

self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activating service worker...", event);
	event.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log("[Service Worker] Removing old cache", key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

function isInArray(string, array) {
	var cachePath;
	if (string.indexOf(self.origin) === 0) {
		// request targets domain where we serve the page from (i.e. NOT a CDN)
		console.log("matched ", string);
		cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
	} else {
		cachePath = string; // store the full request (for CDNs)
	}
	return array.indexOf(cachePath) > -1;
}

self.addEventListener("fetch", (event) => {
	const url = "https://pwagram-51f1d.firebaseio.com/posts.json";

	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			fetch(event.request).then((res) => {
				let clonedRes = res.clone();
				clearAllData("posts")
					.then(() => clonedRes.json())
					.then((data) => {
						for (let key in data) {
							writeData("posts", data[key]);
						}
					});
				return res;
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(caches.match(event.request));
	} else {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then((res) => {
							return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
								// trimCache(CACHE_DYNAMIC_NAME, 3);
								cache.put(event.request.url, res.clone());
								return res;
							});
						})
						.catch((err) => {
							return caches.open(CACHE_STATIC_NAME).then((cache) => {
								if (event.request.headers.get("accept").includes("text/html")) {
									return cache.match("/offline.html");
								}
							});
						});
				}
			})
		);
	}
});

// self.addEventListener("fetch", (event) => {
// 	event.respondWith(
// 		caches.match(event.request).then((response) => {
// 			if (response) {
// 				return response;
// 			} else {
// 				return fetch(event.request)
// 					.then((res) => {
// 						return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
// 							cache.put(event.request.url, res.clone());
// 							return res;
// 						});
// 					})
// 					.catch((err) => {
// 						return caches.open(CACHE_STATIC_NAME).then((cache) => {
// 							return cache.match("/offline.html");
// 						});
// 					});
// 			}
// 		})
// 	);
// });

// Cache only
// self.addEventListener("fetch", (event) => {
// 	event.respondWith(caches.match(event.request));
// });

// Network only
// self.addEventListener("fetch", (event) => {
// 	event.respondWith(fetch(event.request));
// });

// Network first cache as fallback
// self.addEventListener("fetch", (event) => {
// 	event.respondWith(
// 		fetch(event.request)
// 			.then((res) => {
// 				return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
// 					cache.put(event.request.url, res.clone());
// 					return res;
// 				});
// 			})
// 			.catch((err) => {
// 				return caches.match(event.request);
// 			})
// 	);
// });

self.addEventListener("sync", (event) => {
	console.log("[Service Worker] Background syncing", event);

	if (event.tag === "sync-new-posts") {
		console.log("[Service Worker] Syncing new Posts");
		event.waitUntil(
			readAllData("sync-posts").then((data) => {
				for (let dt of data) {
					var postData = new FormData();
					postData.append("id", dt.id);
					postData.append("title", dt.title);
					postData.append("location", dt.location);
					postData.append("file", dt.picture, dt.id + ".png");
					postData.append("rawLocationLat", dt.rawLocation.lat);
					postData.append("rawLocationLng", dt..rawLocation.lng);

					fetch(
						"https://us-central1-pwagram-51f1d.cloudfunctions.net/storePostData",
						{
							method: "POST",
							body: postData,
						}
					)
						.then((res) => {
							console.log("sent data", res);
							if (res.ok) {
								res.json().then((resData) => {
									deleteItemFromData("sync-posts", resData.id);
								});
							}
						})
						.catch((err) => {
							console.log("Error while sending data", err);
						});
				}
			})
		);
	}
});

self.addEventListener("notificationclick", (event) => {
	let notification = event.notification;
	let action = event.action;

	if (action === "confirm") {
		notification.close();
	} else {
		event.waitUntil(
			clients.matchAll().then((clients) => {
				const client = clients.find((c) => c.visibilityState === "visible");

				if (client !== undefined) {
					client.navigate(notification.data.url);
					client.focus();
				} else {
					clients.openWindow(notification.data.url);
				}
				notification.close();
			})
		);
	}
});

self.addEventListener("notificationclose", (event) => {});

self.addEventListener("push", (event) => {
	console.log("Push Notification received");
	let data = {
		title: "New!",
		content: "Something new happened!",
		openUrl: "/",
	};
	if (event.data) {
		data = JSON.parse(event.data.text());
	}

	const options = {
		body: data.content,
		icon: "/src/images/icons/app-icon-96x96.png",
		badge: "/src/images/icons/app-icon-96x96.png",
		data: {
			url: data.openUrl,
		},
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});
