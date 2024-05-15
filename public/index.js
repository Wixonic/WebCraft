import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";
import { Firebase } from "./engine/firebase.js";

const getNotifications = () => {
	document.getElementById("notifications").innerHTML = `<special>No notification</special>`;
};

onAuthStateChanged(Firebase.auth,(user) => {
	window.user = user;

	const defaultMenuItems = ``;

	if (user) {
		getNotifications();
		document.getElementById("menu").innerHTML = `${defaultMenuItems}<a href="/account/">Account <icon><i class="fa-duotone fa-user"></i></icon></a><a href="/account/disconnect/">Sign out <icon><i class="fa-duotone fa-user-slash"></icon></a>`;
		document.getElementById("play").innerHTML = `Play <icon><i class="fa-solid fa-play"></i></icon>`;
	} else {
		document.getElementById("notifications").innerHTML = `<special>Log in to access notifications</special>`;
		document.getElementById("menu").innerHTML = `${defaultMenuItems}<a href="/account/connect/">Log in <icon><i class="fa-duotone fa-right-to-bracket"></i></icon></a>`;
		document.getElementById("play").innerHTML = `Demo <icon><i class="fa-solid fa-play"></i></icon>`;
	}
});

document.getElementById("notificationsBtn").addEventListener("click",() => {
	document.getElementById("notificationsBtn").classList.toggle("open");
	document.getElementById("notifications").classList.toggle("open");

	document.getElementById("menuBtn").classList.toggle("open",false);
	document.getElementById("menu").classList.toggle("open",false);
});

document.getElementById("menuBtn").addEventListener("click",() => {
	document.getElementById("menuBtn").classList.toggle("open");
	document.getElementById("menu").classList.toggle("open");

	document.getElementById("notificationsBtn").classList.toggle("open",false);
	document.getElementById("notifications").classList.toggle("open",false);
});

document.getElementById("play").addEventListener("click",() => {
	if (window.user) {
		open("/play/","_blank");
	} else {

		open("/play/?mode=demo","_blank");
	}
});