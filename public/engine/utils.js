const Degree = (d=0) => (d / Math.PI * 180) % 360;
const Int = Math.round;
window.Int = Int;

const Load = (url="",type="text",timeout=10000) => {
	return new Promise((resolve,reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open("GET",url,true);
		xhr.responseType = type;

		xhr.onload = () => {
			if (xhr.status === 200) {
				resolve(xhr.response);
			} else {
				reject(`${xhr.statusText} (${xhr.status})`);
			}
		};

		xhr.onerror = () => {
			reject(`Network error (${xhr.status})`);
		};
		
		xhr.ontimeout = () => {
			reject("Network error (timeout");
		};

		xhr.timeout = timeout;

		xhr.send();
	});
};

const Radian = (d=0) => (d % 360) * Math.PI / 180;
const Random = (m=0,M=1) => {
	if (!Random.seedrandom) {
		Random.seedrandom = new Math.seedrandom();
	}

	return Random.seedrandom() * (M - m) + m;
};
window.Random = Random;
const asyncScript = (txt="",...args) => new ((async()=>0).constructor)("args",txt)(args);
const Script = (txt="",...args) => new Function("args",txt)(args);

const wait = (time=0) => {
	return new Promise((resolve) => {
		if (time < 1000 / 60) {
			requestAnimationFrame(resolve);
		} else {
			setTimeout(() => requestAnimationFrame(resolve),time);
		}
	});
};


export { Degree, Int, Load, Radian, Random, asyncScript, Script, wait };