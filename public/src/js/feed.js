var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
	"#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
	createPostArea.style.display = "block";
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
	cardTitle.style.height = "180px";
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

if ("caches" in window) {
	caches
		.match(url)
		.then((res) => {
			if (res) {
				return res.json();
			}
		})
		.then((data) => {
			console.log("From cache", data);
			if (!networkDataReceived) {
				let dataArray = [];
				for (let key in data) {
					dataArray.push(data[key]);
				}
				updateUI(dataArray);
			}
		});
}
