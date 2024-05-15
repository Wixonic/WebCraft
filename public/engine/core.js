import { CHUNK_SIZE, SPEED } from "./static.js";
import { Degree, Int, Load, Radian, Random, asyncScript, Script } from "./utils.js";

class Block {
	constructor (datas={}) {
		this.durability = datas.durability;
		this.full = datas.full;
		this.geometry = datas.geometry;
		this.material = datas.material;
		this.name = datas.name;
		this.position = datas.position;

		const R = () => Int(Random() % 4);
		
		this.rotation = {
			x: datas.rotation ? (typeof datas.rotation.x === "number" ? datas.rotation.x : R()) : R(),
			y: datas.rotation ? (typeof datas.rotation.y === "number" ? datas.rotation.y : R()) : R(),
			z: datas.rotation ? (typeof datas.rotation.z === "number" ? datas.rotation.z : R()) : R()
		};

		this.scripts = datas.scripts;

		for (let name in datas.scripts) {
			this[name] = () => datas.scripts[name].call(this);
		}
	}

	render () {
		this.mesh = new THREE.Mesh(this.geometry,this.material);
		this.mesh.position.set(...this.position);
		this.mesh.rotation.set(Radian(this.rotation.x * 90),Radian(this.rotation.y * 90),Radian(this.rotation.z * 90));
	}
};

class Camera {
	constructor () {
		this.position = [0,0,0];
		this.rotation = [0,0,0];
		this.updated = true;
	}

	moveTo (x=0,y=0,z=0) {
		this.position = [x,y,z];

		this.updated = true;
	}

	move (x=0,y=0,z=0) {
		this.position[0] += x;
		this.position[1] += y;
		this.position[2] += z;

		this.updated = true;
	}

	rotateTo (x=0,y=0,z=0) {
		this.rotation = [x,y,z];
	}

	rotate (x=0,y=0,z=0) {
		this.rotation[0] += x;
		this.rotation[1] += y;
		this.rotation[2] += z;

		if (this.rotation[0] < -90) {
			this.rotation[0] = -90;
		}

		if (this.rotation[0] > 90) {
			this.rotation[0] = 90;
		}

		if (this.rotation[2] < -90) {
			this.rotation[2] = -90;
		}

		if (this.rotation[2] > 90) {
			this.rotation[2] = 90;
		}
	}
	
	get radianRotation () {
		return [Radian(this.rotation[0]),Radian(this.rotation[1]),Radian(this.rotation[2])];
	}
};

class Chunk {
	static async generate (g,s,x,z) {
		return new Chunk(await asyncScript(g,s,x,z),x,z);
	};

	constructor (datas,x,z) {
		this.blocks = datas.blocks;

		this.position = {
			x: x,
			z: z
		};

		this.blocks.forEach((xl,x) => {
			xl.forEach((zl,z) => {
				zl.forEach((block,y) => {
					const type = block;
					block = (resources.blocks[type] || resources.blocks.error);
					block.type = type;
					block.position = [x + (this.position.x * CHUNK_SIZE),y,z + (this.position.z * CHUNK_SIZE)];
					this.blocks[x][z][y] = new Block(block);
					this.blocks[x][z][y].render();
				});
			});
		});

		world.chunks[`${this.position.x}_${this.position.z}`] = this;

		this.render();
	}

	render () {
		this.group ? this.group.clear() : this.group = new THREE.Group();

		this.blocks.forEach((xl,x) => {
			xl.forEach((zl,z) => {
				zl.forEach((block,y) => {
					if (block instanceof Block) {
						const size = new THREE.Vector3();
						new THREE.Box3().copy(block.geometry.boundingBox).getSize(size);

						const ranges = {
							x: [x - 1,x + size.x + 1],
							y: [y - 1,y + size.y + 1],
							z: [z - 1,z + size.z + 1]
						};

						let surroundedByFullBlocks = true;

						for (let sx = ranges.x[0]; sx < ranges.x[1]; ++sx) {
							for (let sz = ranges.z[0]; sz < ranges.z[1]; ++sz) {
								for (let sy = ranges.y[0]; sy < ranges.y[1]; ++sy) {
									let n = 0;

									if (sx === ranges.x[0] || sx === ranges.x[1] - 1) {
										n++;
									}

									if (sy === ranges.y[0] || sy === ranges.y[1] - 1) {
										n++;
									}

									if (sz === ranges.z[0] || sz === ranges.z[1] - 1) {
										n++;
									}

									if (n < 2) {
										let bx = sx;
										let bz = sz;

										let cx = this.position.x;
										let cz = this.position.z;

										if (sx >= CHUNK_SIZE) {
											cx++;
											bx = 0;
										}

										if (sx < 0) {
											cx--;
											bx = CHUNK_SIZE - 1;
										}

										if (sz >= CHUNK_SIZE) {
											cz++;
											bz = 0;
										}

										if (sz < 0) {
											cz--;
											bz = CHUNK_SIZE - 1;
										}

										const chunk = world.chunks[`${cx}_${cz}`];

										if (sy != -1 && chunk && chunk.blocks && !(chunk.blocks[bx] && chunk.blocks[bx][bz] && chunk.blocks[bx][bz][sy] && chunk.blocks[bx][bz][sy].full)) {
											surroundedByFullBlocks = false;
										}
									}
								}
							}
						}

						if (!surroundedByFullBlocks) {
							this.group.add(block.mesh);
						}
					}
				});
			});
		});
	}

	getHighestBlock (x=0,z=0) {
		try {
			return this.blocks[x][z].length;
		} catch {
			return 0;
		}
	}
};

const Controls = {
	datas: {
		direction: 0,
		previous: {},
		speed: 0
	},

	touchDevice: undefined,

	pressed: {
		break: false,
		use: false,
		forward: false,
		backward: false,
		towardsleft: false,
		towardsright: false,
		jump: false,
		sneak: false
	},

	init: () => {
		Controls.touchDevice = "ontouchstart" in window;

		Controls.ui = document.getElementsByTagName("ui")[0];
		document.getElementById("menu").style.display = "none";
		document.getElementsByTagName("settings")[0].style.display = "none";

		if (Controls.touchDevice) {
			Controls.break = document.createElement("button");
			Controls.break.id = "breakBtn";
			Controls.break.innerHTML = `<i class="fa-regular fa-hand-back-fist"></i>`;
			Controls.break.style.display = "none";

			Controls.joystick = document.createElement("joystick");
			Controls.joystick.stick = document.createElement("stick");
			Controls.joystick.stick.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i>`;
			Controls.joystick.append(Controls.joystick.stick);

			Controls.jump = document.createElement("button");
			Controls.jump.id = "jumpBtn";
			Controls.jump.innerHTML = `<i class="fa-solid fa-up"></i>`;

			Controls.menu = document.createElement("button");
			Controls.menu.id = "menuBtn";
			Controls.menu.innerHTML = `<i class="fa-solid fa-bars"></i>`;

			Controls.sneak = document.createElement("button");
			Controls.sneak.id = "sneakBtn";
			Controls.sneak.innerHTML = `<i class="fa-regular fa-person-praying"></i>`;

			Controls.use = document.createElement("button");
			Controls.use.id = "useBtn";
			Controls.use.innerHTML = `<i class="fa-regular fa-hand"></i>`;
			Controls.use.style.display = "none";

			Controls.break.addEventListener("touchstart",(e) => {
				Controls.pressed.break = true;
				e.preventDefault();
			});
			Controls.break.addEventListener("touchend",(e) => {
				Controls.pressed.break = false;
				e.preventDefault();
			});
			Controls.break.addEventListener("touchcancel",(e) => {
				Controls.pressed.break = false;
				e.preventDefault();
			});

			const joystickMovement = (e) => {
				const Style = {
					joystick: (v="") => {
						return Number(getComputedStyle(Controls.joystick)[v].replace("px",""));
					},

					stick: (v="") => {
						return Number(getComputedStyle(Controls.joystick.stick)[v].replace("px",""));
					}
				};

				const r = Style.joystick("width") / 2;

				const center = {
					x: Style.joystick("left") + r,
					y: Style.joystick("bottom") + r
				};

				let x = e.changedTouches[0].pageX;
				let y = innerHeight - e.changedTouches[0].pageY;
				const d = Math.sqrt(Math.pow(center.x - x,2) + Math.pow(center.y - y,2));
				const a = Math.atan2(x - center.x,y - center.y);
				const mx = center.x + r * Math.sin(a);
				const my = center.y + r * Math.cos(a);

				if (d > r) {
					x = mx;
					y = my;
				}

				Controls.joystick.stick.style.left = x - Style.stick("width") / 2 + "px";
				Controls.joystick.stick.style.bottom = y - Style.stick("height") / 2 + "px";

				Controls.datas.direction = a;
				Controls.datas.speed = Math.min(d,r) / r;

				e.preventDefault();
				e.stopPropagation();
			};

			const joystickMovementEnd = (e) => {
				Controls.joystick.stick.style.left = "";
				Controls.joystick.stick.style.bottom = "";

				Controls.datas.direction = 0;
				Controls.datas.speed = 0;

				e.preventDefault();
				e.stopPropagation();
			};

			Controls.joystick.addEventListener("touchstart",joystickMovement);
			Controls.joystick.addEventListener("touchmove",joystickMovement);
			Controls.joystick.addEventListener("touchend",joystickMovementEnd);
			Controls.joystick.addEventListener("touchcancel",joystickMovementEnd);

			Controls.jump.addEventListener("touchstart",(e) => {
				Controls.pressed.jump = true;
				e.preventDefault();
			});
			Controls.jump.addEventListener("touchend",(e) => {
				Controls.pressed.jump = false;
				e.preventDefault();
			});
			Controls.jump.addEventListener("touchcancel",(e) => {
				Controls.pressed.jump = false;
				e.preventDefault();
			});

			Controls.menu.addEventListener("touchend",(e) => {
				Controls.cancel();
				e.preventDefault();
				e.stopPropagation();
			});

			Controls.sneak.addEventListener("touchstart",(e) => {
				Controls.pressed.sneak = true;
				e.preventDefault();
			});
			Controls.sneak.addEventListener("touchend",(e) => {
				Controls.pressed.sneak = false;
				e.preventDefault();
			});
			Controls.sneak.addEventListener("touchcancel",(e) => {
				Controls.pressed.sneak = false;
				e.preventDefault();
			});

			Controls.use.addEventListener("touchstart",(e) => {
				Controls.pressed.use = true;
				e.preventDefault();
			});
			Controls.use.addEventListener("touchend",(e) => {
				Controls.pressed.use = false;
				e.preventDefault();
			});
			Controls.use.addEventListener("touchcancel",(e) => {
				Controls.pressed.use = false;
				e.preventDefault();
			});

			window.addEventListener("touchstart",(e) => Controls.datas.previous.camera = [e.changedTouches[0].screenX,e.changedTouches[0].screenY]);
			window.addEventListener("touchmove",Controls.move);
			window.addEventListener("touchend",Controls.move);
			window.addEventListener("touchcancel",Controls.move);

			document.getElementById("resume").addEventListener("click",Controls.resume);
			window.addEventListener("blur",Controls.cancel);

			Controls.ui.append(Controls.break,Controls.joystick,Controls.jump,Controls.menu,Controls.sneak,Controls.use);

			Controls.locked = true;
		} else {
			const f = () => {
				if (document.pointerLockElement === document.documentElement) {
					Controls.ui.style.display = "";
					document.getElementById("menu").style.display = "none";
					document.getElementsByTagName("settings")[0].style.display = "none";
					world.canvas.style.filter = "none";
					Controls.locked = true;
				} else {
					Controls.cancel();
				}
			};

			window.addEventListener("pointerlockchange",f);
			window.addEventListener("mozpointerlockchange",f);
			window.addEventListener("blur",Controls.cancel);

			window.addEventListener("mousemove",Controls.move);

			window.addEventListener("keydown",(e) => {
				if (Controls.locked) {
					const action = settings.actions[e.key.toLowerCase()];

					if (action) {
						Controls.pressed[action] = true;
					}

					e.preventDefault();
				}
			});
			
			window.addEventListener("keyup",(e) => {
				const action = settings.actions[e.key.toLowerCase()];

				if (action) {
					Controls.pressed[action] = false;
				}

				e.preventDefault();
			});

			window.addEventListener("mousedown",(e) => {
				if (Controls.locked) {
					let action = null;

					if (e.button === 0) {
						action = "break";
					} else if (e.button === 2) {
						action = "use";
					}

					if (action) {
						Controls.pressed[action] = true;
					}
				}
			});

			window.addEventListener("mouseup",(e) => {
				let action = null;

				if (e.button === 0) {
					action = "break";
				} else if (e.button === 2) {
					action = "use";
				}

				if (action) {
					Controls.pressed[action] = false;
				}
			});

			window.addEventListener("contextmenu",(e) => {
				if (Controls.locked) {
					e.preventDefault();
				}
			});

			Controls.resume();
		}

		document.getElementById("resume").addEventListener("click",Controls.resume);
		document.getElementById("settings").addEventListener("click",() => document.getElementsByTagName("settings")[0].style.display = "");
		document.getElementById("exit-settings").addEventListener("click",Controls.resume);

		document.getElementById("low-quality").addEventListener("click",() => {
			if (!document.getElementById("low-quality").toggleAttribute("checked")) {
				world.antialias = false;
				world.quality = "low";
				world.powerPreference = "high-performance";
			} else {
				world.antialias = true;
				world.quality = "high";
				world.powerPreference = "low-power";
			}
		});

		const UpdateRenderDistance = () => {
			document.getElementById("render-distance-display").innerHTML = Math.round(settings.renderDistance);
			world.scene.fog.near = (settings.renderDistance - 0.5) * CHUNK_SIZE - 4;
			world.scene.fog.far = (settings.renderDistance - 0.5) * CHUNK_SIZE;
		};
		
		document.getElementById("render-distance").value = settings.renderDistance;
		UpdateRenderDistance();

		document.getElementById("render-distance").addEventListener("input",(e) => {
			settings.renderDistance = Number(e.target.value);
			UpdateRenderDistance();
		});

		Controls.update();
	},


	cancel: () => {
		if (!Controls.touchDevice) {
			document.exitPointerLock();
		}

		document.getElementById("menu").style.display = "";
		world.canvas.style.filter = `blur(0.25rem)`;
		Controls.ui.style.display = "none";
		Controls.locked = false;
	},

	move: (e) => {
		if (Controls.locked) {
			e.preventDefault();

			if (Controls.touchDevice) {
				camera.rotate(-((e.changedTouches[0].screenY - Controls.datas.previous.camera[1]) / innerHeight * 360) * settings.sensibility.y,-((e.changedTouches[0].screenX - Controls.datas.previous.camera[0]) / innerWidth * 360) * settings.sensibility.x);
				Controls.datas.previous.camera = [e.changedTouches[0].screenX,e.changedTouches[0].screenY];
			} else {
				camera.rotate(-(e.movementY / innerHeight * 360) * settings.sensibility.y,-(e.movementX / innerWidth * 360) * settings.sensibility.x);
			}
		}
	},

	resume: () => {
		if (Controls.touchDevice) {
			Controls.ui.style.display = "";
			document.getElementById("menu").style.display = "none";
			document.getElementsByTagName("settings")[0].style.display = "none";
			world.canvas.style.filter = "none";
			Controls.locked = true;
		} else {
			try {
				document.documentElement.requestPointerLock();
			} catch (e) {
				new ErrorScreen({
					title: "Mouse lock error",
					content: `Mouse lock isn't available on your device.<br />Check the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API#browser_compatibility" target="_blank">browser compatibility</a> on MDN.`,
					error: e
				});
			}
		}
	},

	update: () => {
		if (world.FPS !== 0) {
			window.direction = 0;
			window.speed = 0;

			if (Controls.touchDevice) {
				window.direction = Controls.datas.direction;
			} else {
				Controls.datas.direction = 0;
				Controls.datas.speed = 1;
				
				switch (`${Controls.pressed.forward ? 1 : 0}${Controls.pressed.backward ? 1 : 0}${Controls.pressed.towardsleft ? 1 : 0}${Controls.pressed.towardsright ? 1 : 0}`) {
					case "1000":
						Controls.datas.direction = 0;
						break;
					
					case "0100":
						Controls.datas.direction = 180;
						break;
					
					case "0010":
						Controls.datas.direction = 270;
						break;
					
					case "0001":
						Controls.datas.direction = 90;
						break;
					
					case "1010":
						Controls.datas.direction = 315;
						break;
					
					case "1001":
						Controls.datas.direction = 45;
						break;
					
					case "0110":
						Controls.datas.direction = 225;
						break;
					
					case "0101":
						Controls.datas.direction = 135;
						break;

					default:
						Controls.datas.speed = 0;
						break;
				}

				window.direction = Radian(Controls.datas.direction);
			}

			direction += Radian(-camera.rotation[1]);
			speed = Controls.datas.speed * SPEED / world.FPS;
			camera.move(speed * Math.sin(direction),Controls.pressed.jump && !Controls.pressed.sneak ? SPEED / world.FPS : (Controls.pressed.sneak & !Controls.pressed.jump ? -SPEED / world.FPS : 0),-speed * Math.cos(direction));

			if (Controls.pressed.break) {
				if (window.target && target.object) {
					const x = target.object.position.x;
					const z = target.object.position.z;

					const cx = Math.floor(x / CHUNK_SIZE);
					const cz = Math.floor(z / CHUNK_SIZE);

					let bx = x % CHUNK_SIZE;
					const by = target.object.position.y;
					let bz = z % CHUNK_SIZE;

					if (bx < 0) {
						bx += 4;
					}

					if (bz < 0) {
						bz += 4;
					}

					try {
						world.chunks[`${cx}_${cz}`].blocks[bx][bz][by].worldPosition = {
							x: x,
							z: z,
							cx: cx,
							cz: cz,
							bx: bx,
							by: by,
							bz: bz
						};
						world.chunks[`${cx}_${cz}`].blocks[bx][bz][by].break();
					} catch {
						console.warn("Error when breaking ",bx,by,bz," at chunk ",cx,cz);
					}
				}
			}

			if (Controls.pressed.use) {
				
			}

			if (Controls.touchDevice) {
				Controls.break.style.display = window.target && target.object ? "" : "none";
			}

			requestAnimationFrame(() => Controls.update());
		} else {
			new ErrorScreen({
				title: "Crash",
				content: "WebCraft just crashed",
				error: "FPS <= 0"
			});
		}
	}
};

class ErrorScreen {
	constructor (datas={}) {
		this.title = datas.title || "Error";
		this.content = datas.content || "No description or content";
		this.error = datas.error || "Unknow error";

		window.freeze = true;

		const w = document.createElement("ErrorWindow");
		w.innerHTML = `<name>${this.title}</name><content>${this.content}</content><error>${this.error}</error>`;
		document.body.prepend(w);
	}
};

class Resources {
	static async load (url="/resources/default.resources.webcraft") {
		return new Resources(await Load(url,"json"));
	}

	constructor (resources) {
		this.blocks = resources.blocks;
		this.description = resources.description;
		this.generations = resources.generations;
		this.name = resources.name;
		this.version = resources.version;

		this.blocks.error = {
			durability: 1,
			full: true,
			geometry: "return new THREE.BoxGeometry(1,1,1)",
			material: "const face1 = new THREE.MeshLambertMaterial({map:loadTexture(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImQXBAQEAAACAEP9PF1IISg1Dzgf5+WD3KgAAAABJRU5ErkJggg==`)}); const face2 = new THREE.MeshLambertMaterial({map:loadTexture(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImQXBAQEAAACAEP9PF1BKCg1Dzgf5Z4meawAAAABJRU5ErkJggg==`)}); return [face1,face1,face1,face1,face2,face2]",
			name: "Errorblock",
			rotation: {x:0,y:0,z:0},
			scripts: {
				break: new Function("if (this.durability !== `inf` && world.FPS > 0) {this.durability -= BREAKING_SPEED / world.FPS; if (this.durability <= 0) {this.destroy()}}"),
				destroy: new Function("world.chunks[`${this.worldPosition.cx}_${this.worldPosition.cz}`].blocks[this.worldPosition.bx][this.worldPosition.bz][this.worldPosition.by] = null; world.forcedUpdate = true;")
			}
		};

		for (let name in this.blocks) {
			this.blocks[name].durability = typeof this.blocks[name].durability === "number" || (typeof this.blocks[name].durability === "string" && this.blocks[name].durability === "inf") ? this.blocks[name].durability : this.blocks.error.durability;
			this.blocks[name].full = typeof this.blocks[name].full === "boolean" ? this.blocks[name].full : this.blocks.error.full;
			this.blocks[name].geometry = Script(typeof this.blocks[name].geometry === "string" ? this.blocks[name].geometry : this.blocks.error.geometry);
			this.blocks[name].geometry.computeBoundingBox();
			this.blocks[name].material = Script(`window.loadTexture = (uri="") => {
				const textureLoader = new THREE.TextureLoader();
				const texture = textureLoader.load(uri,() => {
					world.updated = true;
					world.forcedUpdate = true;
				});
				texture.magFilter = THREE.NearestFilter;
				return texture;
			};
			
			${typeof this.blocks[name].material === "string" ? this.blocks[name].material : this.blocks.error.material}`);
			this.blocks[name].name = typeof this.blocks[name].name === "string" ? this.blocks[name].name : this.blocks.error.name;
			this.blocks[name].scripts = typeof this.blocks[name].scripts === "object" ? this.blocks[name].scripts : {};

			for (let scriptName in this.blocks.error.scripts) {
				this.blocks[name].scripts[scriptName] = typeof this.blocks[name].scripts[scriptName] !== "function" ? this.blocks.error.scripts[scriptName] : this.blocks[name].scripts[scriptName];
			}
		}
	}
};

class Settings {
	constructor () {
		this.actions = {
			"w": "forward",
			"arrowup": "forward",
			"s": "backward",
			"arrowdown": "backward",
			"a": "towardsleft",
			"arrowleft": "towardsleft",
			"d": "towardsright",
			"arrowright": "towardsright",
			" ": "jump",
			"shift": "sneak"
		};

		this.fov = 60;
		this.info = true;
		this.quality = "high";
		
		this.sensibility = {
			x: 1,
			y: 0.5
		};
		
		this.renderDistance = 2;
		document.getElementById("render-distance-display").innerHTML = Math.pow(Math.round(this.renderDistance) * 2,2);
	}
};

class World {
	constructor (mode="default",seed) {
		this._internal = {
			previousTimestamp: 0,
			renderer: {
				datas: {
					antialias: true,
					powerPreference: "high-performance",
					precision: "mediump"
				}
			}
		};

		this.mode = mode;
		this.seed = seed || Date.now();

		this.chunks = {};

		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.Fog("#222",0,0);
		this.lights = {
			ambient: new THREE.AmbientLight("#FFF",0.2),
			hemisphere: new THREE.HemisphereLight("#FFF",0.5)
		};
		this.group = new THREE.Group();
		this.scene.add(this.lights.ambient,this.lights.hemisphere,this.group);

		this.raycaster = new THREE.Raycaster();
		this.raycaster.near = 0.01;
		this.raycaster.far = 5;

		this.canvas = document.createElement("canvas");
		this._internal.renderer.datas.canvas = this.canvas;

		this.setRenderer(this._internal.renderer.datas);

		this.size = [innerWidth,innerHeight];
		this.quality = settings.quality;
	}

	get antialias () {
		return this._internal.renderer.datas.antialias;
	}

	set antialias (v) {
		const d = this._internal.renderer.datas;
		d.antialias = v;
		this.setRenderer(d);
	}

	get powerPreference () {
		return this._internal.renderer.datas.powerPreference;
	}

	set powerPreference (v) {
		const d = this._internal.renderer.datas;
		d.powerPreference = v;
		this.setRenderer(d);
	}

	get quality () {
		return this.renderer.getPixelRatio();
	}

	set quality (v) {
		const qualities = {
			"high": devicePixelRatio,
			"low": 1
		};

		this.renderer.setPixelRatio(qualities[v]);
		this.updated = true;
	}

	get size () {
		return this.renderer.getSize(new THREE.Vector2());
	}

	set size (v) {
		this.renderer.setSize(v[0],v[1]);
		camera.updated = true;
	}

	get limit () {
		return resources.generations[this.mode].limit;
	}

	async init () {
		await this.update();
		this.updated = true;
	}

	async generateChunk (x=0,z=0) {
		if (!this.chunks[`${x}_${z}`] && this.chunks[`${x}_${z}`] !== "generating" && !this.limit || (x >= 0 && x <= this.limit[0] && z >= 0 && z <= this.limit[1])) {
			this.chunks[`${x}_${z}`] = "generating";
			return await Chunk.generate(resources.generations[this.mode].generate,this.seed,x,z);
		}
	}
	
	setRenderer (d) {
		if (this.renderer) {
			this.renderer.dispose();
		}

		this._internal.renderer.datas = d;

		this.renderer = new THREE.WebGLRenderer(d);
		this.updated = true;
	}

	async update() {
		const start = performance.now();

		if (this.updated || camera.updated) {
			const coreStart = performance.now();

			if (!this.camera || camera.updated) {
				camera.updated = false;

				this.camera = new THREE.PerspectiveCamera(settings.fov,innerWidth / innerHeight,0.01,this.scene.fog.far);
				this.camera.position.set(...camera.position);
				this.camera.rotation.set(...camera.radianRotation);
				this.camera.rotation.order = "YXZ";
				this.camera.updateMatrixWorld();

				const pointer = new THREE.Vector2();
				pointer.x = (innerWidth / 2 / innerWidth ) * 2 - 1;
				pointer.y = -(innerHeight / 2 / innerHeight) * 2 + 1;
				this.raycaster.setFromCamera(pointer,this.camera);
			}

			const px = Math.round(camera.position[0] / CHUNK_SIZE);
			const pz = Math.round(camera.position[2] / CHUNK_SIZE);
			const r = Math.round(settings.renderDistance);

			this.group.clear();

			for (let x = px - r; x < px + r; ++x) {
				for (let z = pz - r; z < pz + r; ++z) {
					const chunk = this.chunks[`${x}_${z}`];
					
					if (!chunk) {
						this.generateChunk(x,z);
					} else if (chunk instanceof Chunk) {
						if (this.forcedUpdate) {
							chunk.render();
						}

						this.group.add(chunk.group);
					}
				}
			}

			const intersects = this.raycaster.intersectObject(this.group,true) || null;
			
			if (intersects.length > 0) {
				const intersect = intersects[0];

				window.target = intersect;

				if (this.raycaster.visibleEffect) {
					this.raycaster.visibleEffect.removeFromParent();
				}

				const t = 2000;

				let color = performance.now() % t;

				if (color > t / 2) {
					color = t / 2 - (color - t / 2);
				}

				color = Math.round(color / (t / 2) * 255).toString(16);

				if (color.length < 2) {
					color = "0" + color;
				}

				this.raycaster.visibleEffect = new THREE.LineSegments(new THREE.EdgesGeometry(target.object.geometry),new THREE.LineBasicMaterial({
					color: new THREE.Color(`#${color}${color}${color}`)
				}));

				target.object.updateMatrix();
				this.raycaster.visibleEffect.geometry.applyMatrix4(target.object.matrix);

				this.scene.add(this.raycaster.visibleEffect);
			} else {
				window.target = null;

				if (this.raycaster.visibleEffect) {
					this.raycaster.visibleEffect.removeFromParent();
				}
			}

			this.coreTime = performance.now() - coreStart;

			const renderingStart = performance.now();
			this.renderer.render(this.scene,this.camera);
			this.renderingTime = performance.now() - renderingStart;
		}

		if (start - this._internal.previousTimestamp !== 0) {
			this.FPS = (1 / (start - this._internal.previousTimestamp)) * 1000;
			this._internal.previousTimestamp = start;
		} else {
			this.FPS = 0;
		}

		const infos = document.getElementsByClassName("infos")[0];

		if (settings.info) {
			infos.style.display = "";
			infos.innerHTML = `Core: ${Int(this.coreTime)} ms<br />Rendering: ${Int(this.renderingTime)} ms<br />${Int(this.FPS)} FPS<br />Quality: ${document.getElementById("low-quality").hasAttribute("checked") ? "low" : "high"}<br /><br />Position: ${camera.position[0].toFixed(2)} ${camera.position[1].toFixed(2)} ${camera.position[2].toFixed(2)}<br />Rotation: ${(-camera.rotation[1] % 360).toFixed(2)} ${(camera.rotation[0] % 360).toFixed(2)} ${(camera.rotation[2] % 360).toFixed(2)}<br />Direction: ${(Degree(window.direction || 0) % 360).toFixed(2)}<br /><br />Calls: ${this.renderer.info.render.calls}<br />Triangles: ${this.renderer.info.render.triangles}<br />Render distance: ${Math.round(settings.renderDistance)} chunks<br /><br />Generated chunks: ${Object.keys(this.chunks).length}`;
		} else {
			infos.style.display = "none";
		}

		this.forcedUpdate = false;
		this.updated = false;
		
		if (!window.freeze) {
			requestAnimationFrame(() => this.update());
		}
	}
};


export {
	Block as block,
	Camera as camera,
	Chunk as chunk,
	Controls as controls,
	ErrorScreen as errorScreen,
	Resources as resources,
	Settings as settings,
	World as world
};