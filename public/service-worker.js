importScripts("workbox-sw.prod.v2.1.3.js");
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
	/.*(?:googleapis|gstatic)\.com.*$/,
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: "google-fonts",
		cacheExpiration: {
			maxEntries: 3,
			maxAgeSeconds: 60 * 60 * 24 * 30,
		},
	})
);

workboxSW.router.registerRoute(
	"https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: "material-css",
	})
);

workboxSW.router.registerRoute(
	/.*(?:firebasestorage\.googleapis)\.com.*$/,
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: "post-images",
	})
);

workboxSW.router.registerRoute(
	"https://pwagram-51f1d.firebaseio.com/posts.json",
	function (args) {
		return fetch(args.event.request).then((res) => {
			let clonedRes = res.clone();
			clearAllData("posts")
				.then(() => clonedRes.json())
				.then((data) => {
					for (let key in data) {
						writeData("posts", data[key]);
					}
				});
			return res;
		});
	}
);

workboxSW.router.registerRoute(
	function (routeData) {
		return routeData.event.request.headers.get("accept").includes("text/html");
	},
	function (args) {
		return caches.match(args.event.request).then((response) => {
			if (response) {
				return response;
			} else {
				return fetch(args.event.request)
					.then((res) => {
						return caches.open("dynamic").then((cache) => {
							// trimCache(CACHE_DYNAMIC_NAME, 3);
							cache.put(args.event.request.url, res.clone());
							return res;
						});
					})
					.catch((err) => {
						return caches.match("/offline.html").then((res) => {
							return res;
						});
					});
			}
		});
	}
);

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "2cd4f91b9a5031512e4ffdbc80f504bb"
  },
  {
    "url": "manifest.json",
    "revision": "6f1604a71c12bbf95d3ece3957a132e1"
  },
  {
    "url": "offline.html",
    "revision": "213bbfc27677b5a0712c51bee5bd0441"
  },
  {
    "url": "service-worker.js",
    "revision": "8e718a9b7ad8f91651470ee8b56a2d2d"
  },
  {
    "url": "src/css/app.css",
    "revision": "81d78c4f1ce04f0784e802c1aea7f7dd"
  },
  {
    "url": "src/css/feed.css",
    "revision": "ddec9b1c0a01da998881755c3d810f38"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "7b20fbc8e0612b01695a29dd8501f205"
  },
  {
    "url": "src/js/feed.js",
    "revision": "be973e0b663b3ab2ea54b74a13f30a2a"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "d04f2fefab61663be4816144be32f35c"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "17e5d0e4795fc228502e1f398b39b9dd"
  },
  {
    "url": "src/js/utility.js",
    "revision": "d87ecb883658ad04ed7c9a896b1a307a"
  },
  {
    "url": "sw-base.js",
    "revision": "82d31ec6ca6192cd7b72b107b6a900cf"
  },
  {
    "url": "sw.js",
    "revision": "f4db4b5941babbf6806c5366e1867829"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

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
