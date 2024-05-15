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
		redirect();
	}
});

document.getElementById("logo").addEventListener("click",redirect);
document.getElementsByTagName("form")[0].addEventListener("submit",(ev) => {
	signInWithEmailAndPassword(Firebase.auth,ev.target[0].value,ev.target[1].value)
	.catch((er) => {
		ev.target[1].value = "";

		switch (er.code) {
			case "auth/invalid-email":
				alert("Please enter a valid email");
				break;
			
			case "auth/internal-error":
				alert("Invalid email or password");
				break;
			
			case "auth/user-disabled":
				alert("This account is banned");
				break;
			
			case "auth/user-not-found":
				alert("This account doesn't exist");
				break;
			
			case "auth/wrong-password":
				alert("Invalid password for this account");
				break;
			
			default:
				alert("An unknow error occured");
				break;
		}
	});
});