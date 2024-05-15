import * as Core from "./core.js";
import * as Static from "./static.js";
import * as Utils from "./utils.js";

const Start = async (mode) => {
	if (!mode && user) {
		mode = "local";
	} else {
		mode = "demo";
	}

	switch (mode) {
		case "local":
			
			break;
	}

	try {
		window.camera = new Core.camera();
		window.settings = new Core.settings();
		window.world = new Core.world();
		window.resources = await Core.resources.load();

		document.getElementsByTagName("title")[0].innerHTML = `${mode} | WebCraft`;
		document.body.append(world.canvas);

		world.scene.background = new THREE.Color("#222");

		if (world.limit) {
			const x = world.limit[0] / 2;
			const z = world.limit[1] / 2;
			const chunk = await world.generateChunk(x,z);
			camera.moveTo(x * CHUNK_SIZE + CHUNK_SIZE / 2 + 1,chunk.getHighestBlock(CHUNK_SIZE / 2,CHUNK_SIZE / 2),z * CHUNK_SIZE + CHUNK_SIZE / 2 + 1);
		} else {
			const chunk = await world.generateChunk();
			camera.moveTo(0,chunk.getHighestBlock(CHUNK_SIZE / 2,CHUNK_SIZE / 2),0);
		}

		window.addEventListener("resize",() => world.size = [innerWidth,innerHeight]);

		window.actx = new (window.webkitAudioContext || window.AudioContext)({
			sampleRate: 44100
		});

		document.getElementById("startWindow").innerHTML = "Click to start";		

		document.body.addEventListener("click",() => {
			if (actx.state !== "running") {
				actx.resume();
			}

			world.init();
			Core.controls.init();

			document.getElementById("startWindow").remove();
		},{
			once: true
		});
	} catch (e) {
		new Core.errorScreen({
			title: "Oops",
			content: "An error occured when launching the game",
			error: e
		});
	}
};

export { Start };