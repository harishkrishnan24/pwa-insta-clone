module.exports = {
	globDirectory: "public/",
	globPatterns: [
		"**/*.{ico,html,json,css}",
		"src/images/*.{jpg,png}",
		"src/js/*.min.js",
	],
	swDest: "public/service-worker.js",
	swSrc: "public/sw-base.js",
	globIgnores: ["../workbox-cli-config.js", "help/**"],
};
