var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");

function openCreatePostModal() {
	createPostArea.style.display = "block";
	setTimeout(() => {
		createPostArea.style.transform = "translateY(0)";
	}, 1);
	if (deferredPrompt) {
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			console.log(choiceResult.outcome);

			if (choiceResult.outcome === "dismissed") {
				console.log("User cancelled installation");
			} else {
				console.log("User added to home screen");
			}
		});
		deferredPrompt = null;
	}

	// if ("serviceWorker" in navigator) {
	// 	navigator.serviceWorker.getRegistrations().then((registrations) => {
	// 		for (let i = 0; i < registrations.length; i++) {
	// 			registrations[i].unregister();
	// 		}
	// 	});
	// }
}

function closeCreatePostModal() {
	createPostArea.style.transform = "translateY(100vh)";
	createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function onSaveButtonClicked(event) {
	if ("caches" in window) {
		caches.open("user-requested").then((cache) => {
			cache.add("https://httpbin.org/get");
			cache.add("/src/images/sf-boat.jpg");
		});
	}
}

function clearCards() {
	while (sharedMomentsArea.hasChildNodes()) {
		sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
	}
}

function createCard(data) {
	var cardWrapper = document.createElement("div");
	cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp center";
	var cardTitle = document.createElement("div");
	cardTitle.className = "mdl-card__title";
	cardTitle.style.backgroundImage = `url(${data.image})`;
	cardTitle.style.backgroundSize = "cover";
	cardWrapper.appendChild(cardTitle);
	var cardTitleTextElement = document.createElement("h2");
	cardTitleTextElement.className = "mdl-card__title-text";
	cardTitleTextElement.textContent = data.title;
	cardTitle.appendChild(cardTitleTextElement);
	var cardSupportingText = document.createElement("div");
	cardSupportingText.className = "mdl-card__supporting-text";
	cardSupportingText.textContent = data.location;
	cardSupportingText.style.textAlign = "center";
	// var cardSaveButton = document.createElement("button");
	// cardSaveButton.textContent = "save";
	// cardSaveButton.addEventListener("click", onSaveButtonClicked);
	// cardSupportingText.appendChild(cardSaveButton);
	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
	clearCards();
	for (let i = 0; i < data.length; i++) {
		createCard(data[i]);
	}
}

const url = "https://pwagram-51f1d.firebaseio.com/posts.json";
let networkDataReceived = false;

fetch(url)
	.then(function (res) {
		return res.json();
	})
	.then(function (data) {
		console.log("From web", data);
		networkDataReceived = true;
		let dataArray = [];
		for (let key in data) {
			dataArray.push(data[key]);
		}
		updateUI(dataArray);
	});

if ("indexedDB" in window) {
	readAllData("posts").then((data) => {
		if (!networkDataReceived) {
			updateUI(data);
		}
	});
}

function sendData() {
	fetch("https://us-central1-pwagram-51f1d.cloudfunctions.net/storePostData", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			id: new Date().toISOString(),
			title: titleInput.value,
			location: locationInput.value,
			image:
				"https://firebasestorage.googleapis.com/v0/b/pwagram-51f1d.appspot.com/o/sf-boat.jpg?alt=media&token=5e53a030-aa4f-4855-b514-38aad51ff1e3",
		}),
	}).then((res) => {
		console.log("sent data", res);
		updateUI();
	});
}

form.addEventListener("submit", function (event) {
	event.preventDefault();

	if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
		alert("Please enter valid data!");
		return;
	}

	closeCreatePostModal();

	if ("serviceWorker" in navigator && "SyncManager" in window) {
		navigator.serviceWorker.ready.then((sw) => {
			const post = {
				title: titleInput.value,
				location: locationInput.value,
				id: new Date().toISOString(),
			};
			writeData("sync-posts", post)
				.then(() => {
					return sw.sync.register("sync-new-posts");
				})
				.then(() => {
					const snackbarContainer = document.querySelector(
						"#confirmation-toast"
					);
					const data = { message: "Your Post was saved for syncing" };
					snackbarContainer.MaterialSnackbar.showSnackbar(data);
				})
				.catch((err) => {
					console.log(err);
				});
		});
	} else {
		sendData();
	}
});
