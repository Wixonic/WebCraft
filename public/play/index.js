import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";
import { Firebase } from "../engine/firebase.js";
import { Start } from "../engine/main.js";

onAuthStateChanged(Firebase.auth,(user) => {
	if (user) {
		try {
			Start(location.search.replace("?","").split("mode=")[1].split("&")[0]);
		} catch {
			Start("local");
		}
	} else {
		Start("demo");
	}
});