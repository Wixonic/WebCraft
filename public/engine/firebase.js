import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const Firebase = {
    app: initializeApp({
		apiKey: "AIzaSyAOg8IsW8JK8tSTWQOVVSgJpeqWdWpVsoE",
		authDomain: "webcraft-wixonic.firebaseapp.com",
		projectId: "webcraft-wixonic",
		storageBucket: "webcraft-wixonic.appspot.com",
		messagingSenderId: "823655495012",
		appId: "1:823655495012:web:e1d2a45e3666a8865ef671"
	}),

	auth: getAuth()
};

Firebase.analytics = getAnalytics(Firebase.app);

export { Firebase };