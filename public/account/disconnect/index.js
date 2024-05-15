import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";
import { Firebase } from "/engine/firebase.js";

const redirect = () => {
	try {
		const link = decodeURIComponent(location.search.replace("?","").split("redirect=")[1].split("&")[0]);
		open(`/${link}`,"_self");
	} catch {
		open("/","_self");
	}
};

onAuthStateChanged(Firebase.auth,(user) => {
	if (user) {
		signOut(Firebase.auth)
		.catch(() => open(location.href,"_self"));
	} else {
		redirect();
	}
});