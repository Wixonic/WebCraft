import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";
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
		alert(`Hello ${user.displayName || user.email}.`);
	} else {
		open(`/account/connect/?redirect=${encodeURIComponent(location.pathname.replace("/",""))}`,"_self");
	}
});

document.getElementById("logo").addEventListener("click",redirect);