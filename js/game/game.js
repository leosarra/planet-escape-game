window.addEventListener('load', init, false);
var SHADOW_POS = 400;
var FAR_PLANE = 10000;
var NEAR_PLANE = 1;
var SHADOW_MAP_SIZE = 2048;
var FIXED_DELTA_VALUE = 16;
var gui;
var enemyMeshStorage;
var audio, audioListener, scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;
var vehicleType = 0;
var hemisphereLight, shadowLight;
var terrain, sky;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var bonusHolder, enemiesHolder, projectilesHolder;
var particlesHolder;
var stats;
var game, htmlUI;
var paused = false;
var audioStarted = false;
var levelChanged = undefined;
var terrainIsChanging = false;
var meshReady = false;
var Colors = {
	red: 0xf15547,
	green: 0x408622,
	white: 0xd8d0d1,
	brown: 0x643b35,
	pink: 0xf1986f,
	brownDark: 0x271b10,
	gray: 0xD3D3D3,
	aliceBlue: 0xF0F8FF,
	blue: 0x68ccc9,
	ligherBlack: 0x404040,
	black: 0x000000,
};
var options = {
	vehicle: 0,
	audio: false,
	paused: false,
	noFireCost: false,
	reset: function () {
		removeShield();
		resetGame();
	},
	speedIncrOverTime: -1,
	speedIncrPerLevel: -1,
	energyDecayPerFrame: -1,
	energyDecayIncrPerLevel: -1,
	noShieldCost: false,
	fixedDeltaFramesTime: true,
};

function initScene() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(Colors.gray, 100, 950);
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		NEAR_PLANE,
		FAR_PLANE
	);
	camera.position.x = 0;
	camera.position.z = 200;
	camera.position.y = 150;
	renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled = true;
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	window.addEventListener('resize', handleWindowResize, false);
}

function onPauseButton() {
	options.paused != options.paused;
}

function addShield() {
	if (game.shieldCooldown != 0) return;
	if (!options.noShieldCost) game.energy *= (1 - game.shieldActivationCost);
	if (game.bubble != undefined) {
		game.hasShield = true;
		return;
	}
	var geom = new THREE.IcosahedronGeometry(13, 0);
	var mat = new THREE.MeshPhongMaterial({
		color: Colors.pink,
		shininess: 0,
		specular: 0xffffff,
		transparent: true,
		opacity: 0,
		flatShading: THREE.FlatShading
	});
	game.bubble = new THREE.Mesh(geom, mat);
	game.bubble.position.x = game.vehicle.position.x;
	game.bubble.position.y = game.vehicle.position.y;
	if (vehicleType == 3) game.bubble.position.y = game.bubble.position.y + 8;
	scene.add(game.bubble);
	game.hasShield = true;
}

function removeShield() {
	if (typeof (game.bubble) != 'undefined') {
		scene.remove(game.bubble);
		game.hasShield = false;
	}
}

function disableShieldImmunity(instant_effect) {
	if (!game.hasShield) return;
	game.hasShield = false;
	game.shieldCooldown = 10000;
	if (instant_effect && game.bubble != undefined) {
		game.bubble.material.opacity = 0;
		game.bubble.material.visible = false;
	}
}

function handleShield(deltaTime) {
	if (game.bubble == undefined) return;
	if (game.shieldCooldown != 0 && !game.gameOver) {
		game.shieldCooldown = game.shieldCooldown - deltaTime;
		if (game.shieldCooldown < 0) game.shieldCooldown = 0;
	}

	game.bubble.rotation.z += .002 * deltaTime;
	game.bubble.rotation.y += .002 * deltaTime;
	if (game.hasShield == true && game.bubble.material.opacity < 0.3) {
		game.bubble.material.opacity += 0.01;
		game.bubble.material.visible = true;
	} else if (game.hasShield == false && game.bubble.material.opacity > 0) {
		game.bubble.material.opacity -= 0.01;
	}
	if (game.bubble.material.opacity < 0) {
		game.bubble.material.opacity = 0;
		game.bubble.material.visible = false;
	}
}

function init() {
	initHTMLUi();
	initMeshStorage();
	resetGame();
	initDatGUI();
	initScene();
	initLights();
	initTerrain();
	initSky();
	initParticlesHolder();
	initBonusesHolder();
	initProjectilesHolder();
	initEnemiesHolder();
	setupPlayerInputListener();
	htmlUI.loadingMessage.style.display = 'none';
	loop();
}

function initMeshStorage() {
	enemyMeshStorage = new EnemyMeshStorage();
	enemyMeshStorage.load();
}

function setupPlayerInputListener() {
	document.addEventListener('mousemove', handleMouseMove, false);
	document.addEventListener('keyup', (e) => {
		if (e.which == 83 && game.showReplay) {
			addPlayerScore();
		} else if (e.which == 83 && !game.showReplay) {
			if (!game.hasShield) addShield();
			else disableShieldImmunity(false);
		} else if (e.which == 65 && !game.gameOver && game.vehicle != undefined && vehicleType != 3) {
			fireProjectile();
		} else if (e.which == 82 && game.showReplay) resetGame();
	});
}

function fireProjectile() {
	if (vehicleType == 0 || vehicleType == 2) {
		var cannon1 = game.vehicle.getObjectByName("cannonRight");
		var cannon2 = game.vehicle.getObjectByName("cannonLeft");
		var pos1 = cannon1.getWorldPosition(game.vehicle.position.clone());
		pos1.x += 2.3;
		var pos2 = cannon2.getWorldPosition(game.vehicle.position.clone());
		pos2.x += 2.3;
		projectilesHolder.spawnParticles(pos1);
		projectilesHolder.spawnParticles(pos2);
	}
	else if (vehicleType == 1) {
		var cannon1 = game.vehicle.getObjectByName("lowerCannonRight");
		var cannon2 = game.vehicle.getObjectByName("upperCannonRight");
		var cannon3 = game.vehicle.getObjectByName("lowerCannonLeft");
		var cannon4 = game.vehicle.getObjectByName("upperCannonLeft");
		var pos1 = cannon1.getWorldPosition(game.vehicle.position.clone());
		pos1.x += 1.5;
		var pos2 = cannon2.getWorldPosition(game.vehicle.position.clone());
		pos2.x += 1.5;
		var pos3 = cannon3.getWorldPosition(game.vehicle.position.clone());
		pos3.x += 1.5;
		var pos4 = cannon4.getWorldPosition(game.vehicle.position.clone());
		pos4.x += 1.5;
		projectilesHolder.spawnParticles(pos1);
		projectilesHolder.spawnParticles(pos2);
		projectilesHolder.spawnParticles(pos3);
		projectilesHolder.spawnParticles(pos4);
	}
	if (!options.noFireCost) game.energy -= 5;
}


function addPlayerScore() {
	var name = window.prompt("Enter your name");
	if (name == undefined) {
		return;
	}
	if (name === "") {
		alert("Name can't be left empty");
		return;
	}
	addScore(name, Math.floor(game.distance * 40));
	game.scoreAdded = true;
	printScoreboard(htmlUI.scoreboard);
}

function initHTMLUi() {
	htmlUI = {
		level: document.getElementById('levelValue'),
		distance: document.getElementById('distValue'),
		energy: document.getElementById('energyBar'),
		shield: document.getElementById('shieldValue'),
		replay: document.getElementById('replayMessage'),
		scoreMessage: document.getElementById('scoreboardMessage'),
		scoreboard: document.getElementById('scoreboard'),
		scoreboard_header: document.getElementById('scoreboard_header'),
		loadingMessage: document.getElementById('loadingMessage'),
	}
}
function initDatGUI() {
	options.speedIncrPerLevel = game.levelSpeedIncrement;
	options.speedIncrOverTime = game.speedIncrement * 100;
	options.energyDecayPerFrame = game.energyDecayPerFrame;
	options.energyDecayIncrPerLevel = game.energyDecayIncrPerLevel;
	stats = new Stats();
	gui = new dat.GUI({ width: 280 });
	[].forEach.call(stats.domElement.children, (child) => (child.style.display = ''));
	gui.add(options, 'vehicle', { 'Spaceship1': 0, 'Spaceship2': 1, 'Spaceship3': 2, 'TARDIS': 3 });
	gui.add(options, "audio").onChange(function () {
		if (options.audio) {
			audioListener = new THREE.AudioListener();
			camera.add(audioListener);
			sound = new THREE.Audio(audioListener);
			startAudio();
		}
		else {
			if (typeof (sound) != 'undefined') sound.stop();
			audioStarted = false;
		}
	});
	gui.add(options, 'paused');
	gui.add(options, 'reset');
	var debug = gui.addFolder("Debug");
	debug.add(options, 'speedIncrOverTime');
	debug.add(options, 'speedIncrPerLevel');
	debug.add(options, 'energyDecayPerFrame')
	debug.add(options, 'energyDecayIncrPerLevel');
	debug.add(options, 'noFireCost').onChange(function () {
		removeShield();
		resetGame();
	});
	debug.add(options, 'noShieldCost').onChange(function () {
		removeShield();
		resetGame();
	});
	debug.add(options, 'fixedDeltaFramesTime');
	var perfFolder = gui.addFolder("Performance");
	var perfLi = document.createElement("li");
	stats.domElement.height = '48px';
	stats.domElement.style.position = "static";
	perfLi.appendChild(stats.dom);
	perfLi.classList.add("gui-stats");
	perfFolder.__ul.appendChild(perfLi);
	perfFolder.domElement.getElementsByClassName("title")[0].addEventListener("click", function () {
		if (perfLi.style.height != "auto") perfLi.style.height = "auto";
		else perfLi.style.height = "";
	});
}

function applySettings() {
	if (options.speedIncrOverTime >= 0 && (options.speedIncrOverTime / 100) != game.speedIncrement) game.speedIncrement = options.speedIncrOverTime / 100;
	if (options.speedIncrPerLevel >= 0 && options.speedIncrPerLevel != game.levelSpeedIncrement) game.levelSpeedIncrement = options.speedIncrPerLevel;
	if (options.energyDecayPerFrame >= 0 && options.energyDecayPerFrame != game.energyDecayPerFrame) game.energyDecayPerFrame = options.energyDecayPerFrame;
	if (options.energyDecayIncrPerLevel >= 0 && options.energyDecayIncrPerLevel != game.energyDecayIncrPerLevel) game.energyDecayIncrPerLevel = options.energyDecayIncrPerLevel;
}

function resetGame() {
	if (game == undefined) {
		game = {};
	}
	if (typeof (game.vehicle) != 'undefined') scene.remove(game.vehicle);
	game.hasShield = false;
	game.energyDecayPerFrame = 0.0022;
	game.energyDecayIncrPerLevel = 0.00040;
	game.level = 1;
	game.energy = 100;
	game.firstMeshesSpawned = false;
	game.vehicle = undefined;
	game.targetBaseSpeed = .00035;
	game.vehicleInitialSpeed = .00035;
	game.baseHeigth = 100;
	game.speedIncrement = .0000023;
	game.levelSpeedIncrement = .000040;
	game.bonusLastSpawn = 0;
	game.enemiesLastSpawn = 0;
	game.speedLastUpdate = 0;
	game.distanceForBonusesSpawn = 3;
	game.distanceForEnemiesSpawn = 2;
	game.distanceForSpeedUpdate = 2;
	game.distance = 0;
	game.speed = 0;
	game.baseSpeed = .00035
	game.deltaTime = 0;
	game.levelDistance = 20;
	game.distanceSinceStartLevel = 0;
	game.bubble = undefined;
	game.lastSmokeSpawn = 0;
	game.shieldActivationCost = 0.20;
	game.shieldActiveCost = 0.0015;
	game.shieldCooldown = 0;
	game.gameOver = false;
	game.gameOverVehicleSpeed = .002;
	game.showReplay = false;
	game.scoreAdded = false;
	game.vehicleAdjustmentPositionSpeed = 0.005;
	game.vehicleAdjustmentRotationSpeedZ = 0.0008;
	game.vehicleAdjustmentRotationSpeedX = 0.00001;
	game.discountEnergyCost = 1;
	htmlUI.level.innerHTML = 1;
	htmlUI.distance.innerHTML == 0;
	htmlUI.energy.style.right = (100 - game.energy) + "%";
	htmlUI.energy.style.backgroundColor = (game.energy < 50) ? "#f25346" : "#68c3c0";
	htmlUI.shield.innerHTML = "Ready";
	createVehicle(vehicleType);
	if (typeof (sound) != 'undefined' && audioStarted) {
		sound.stop();
		if (options.audio) sound.play();
	}
	if (typeof (ambientLight) != 'undefined') ambientLight.intensity = 0.4;

}

var mousePos = { x: 0, y: 0 };
function handleMouseMove(event) {
	var tx = -1 + (event.clientX / WIDTH) * 2;
	var ty = 1 - (event.clientY / HEIGHT) * 2;
	mousePos = { x: tx, y: ty };

}


function updateVehicle() {
	if (game.gameOver || game.vehicle == undefined) return;
	var maxY = 250;
	if (vehicleType == 3) maxY = 242;
	var targetY = normalize(mousePos.y, -.75, .75, 75, maxY);
	var targetX = normalize(mousePos.x, -1, 1, -150, 150);
	game.vehicle.position.y += (targetY - game.vehicle.position.y) * game.vehicleAdjustmentPositionSpeed * deltaTime;
	game.vehicle.position.x += (targetX - game.vehicle.position.x) * game.vehicleAdjustmentPositionSpeed * deltaTime;
	game.vehicle.rotation.z = (targetY - game.vehicle.position.y) * game.vehicleAdjustmentRotationSpeedZ * deltaTime;
	if (vehicleType != 3) game.vehicle.rotation.x = (game.vehicle.position.y - targetY) * game.vehicleAdjustmentRotationSpeedX * deltaTime;
	else game.vehicle.rotation.y = game.vehicle.rotation.y + 0.003 * deltaTime;
	if (typeof (game.bubble) != 'undefined') {
		game.bubble.position.y = game.vehicle.position.y;
		if (vehicleType == 3) game.bubble.position.y = game.bubble.position.y + 8;
		game.bubble.position.x = game.vehicle.position.x;
		game.bubble.rotation.z = game.vehicle.rotation.z;
		game.bubble.rotation.x = game.vehicle.rotation.x;
	}
}

function normalize(v, vmin, vmax, tmin, tmax) {
	var nv = Math.max(Math.min(v, vmax), vmin);
	var dv = vmax - vmin;
	var pc = (nv - vmin) / dv;
	var dt = tmax - tmin;
	var tv = tmin + (pc * dt);
	return tv;
}

function startAudio() {
	var audioLoader = new THREE.AudioLoader();
	console.log("starting audio...");
	audioLoader.load('music/background.ogg', function (buffer) {
		sound.setBuffer(buffer);
		sound.setLoop(true);
		sound.setVolume(1);
		sound.play();
		audioStarted = true;
		console.log("audio started");
	});
}

function initLights() {
	shadowLight = new THREE.DirectionalLight(Colors.white, 1);
	shadowLight.position.set(160, 340, 350);
	shadowLight.castShadow = true;
	shadowLight.shadow.camera.left = -SHADOW_POS;
	shadowLight.shadow.camera.right = SHADOW_POS;
	shadowLight.shadow.camera.top = SHADOW_POS;
	shadowLight.shadow.camera.bottom = -SHADOW_POS;
	shadowLight.shadow.camera.near = NEAR_PLANE;
	shadowLight.shadow.camera.far = FAR_PLANE / 10;
	shadowLight.shadow.mapSize.width = SHADOW_MAP_SIZE;
	shadowLight.shadow.mapSize.height = SHADOW_MAP_SIZE;
	scene.add(shadowLight);
	hemisphereLight = new THREE.HemisphereLight(Colors.aliceBlue, 0x000000, 1)
	ambientLight = new THREE.AmbientLight(Colors.pink, .4);
	scene.add(hemisphereLight);
	scene.add(ambientLight);
}


function initProjectilesHolder() {
	projectilesHolder = new ProjectilesHolder(10);
	scene.add(projectilesHolder.mesh);
}

function initBonusesHolder() {
	bonusHolder = new BonusHolder(game, particlesHolder, 20);
	scene.add(bonusHolder.mesh)
}

function initEnemiesHolder() {
	enemiesHolder = new EnemiesHolder(game, particlesHolder, enemyMeshStorage, projectilesHolder);
	scene.add(enemiesHolder.mesh)
}

function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

function initTerrain() {
	terrain = new Terrain();
	terrain.mesh.position.y = -550;
	scene.add(terrain.mesh);
}

function initSky() {
	sky = new Sky(game, 15);
	sky.mesh.position.y = -600;
	scene.add(sky.mesh);
}

function createVehicle(vehicleType) {
	var file = null;
	if (vehicleType == 0) {
		file = "spaceship1";
		game.vehicleAdjustmentPositionSpeed = 0.004;
		game.vehicleAdjustmentRotationSpeedZ = 0.0008;
		game.vehicleAdjustmentRotationSpeedX = 0.00001;
		game.discountEnergyCost = 1;
	}
	else if (vehicleType == 1) {
		file = "spaceship2";
		game.vehicleAdjustmentPositionSpeed = 0.003;
		game.vehicleAdjustmentRotationSpeedZ = 0.0004;
		game.vehicleAdjustmentRotationSpeedX = 0.00001;
		game.discountEnergyCost = 0.65;
	}
	else if (vehicleType == 2) {
		file = "spaceship3";
		game.vehicleAdjustmentPositionSpeed = 0.005;
		game.vehicleAdjustmentRotationSpeedZ = 0.0008;
		game.vehicleAdjustmentRotationSpeedX = 0.00005;
		game.discountEnergyCost = 1.10;
	}
	else if (vehicleType == 3) {
		file = "TARDIS";
		game.vehicleAdjustmentPositionSpeed = 0.004;
		game.vehicleAdjustmentRotationSpeedZ = 0.001;
		game.vehicleAdjustmentRotationSpeedX = 0.005;
		game.discountEnergyCost = 0.77;
		game.shieldActivationCost = 0.15;
	}
	if (vehicleType == 3) {
		var mtlLoader = new THREE.MTLLoader();
		mtlLoader.load('models/' + file + '.mtl', function (materials) {
			materials.preload();
			var loader = new THREE.OBJLoader();
			loader.setMaterials(materials);
			loader.load(
				'models/' + file + '.obj',
				function (object) {
					game.vehicle = object;
					scene.add(object);
					lock = false;
					game.vehicle.scale.set(.05, .05, .05);
					game.vehicle.position.y = 150;
					game.vehicle.rotation.y = 1.5;
					game.vehicle.traverse(function (child) {
						if (child instanceof THREE.Mesh) {
							child.castShadow = true;
						}
					});
					game.vehicle.castShadow = true;
					scene.add(game.vehicle);
					console.log("added");
				},
				function (xhr) {
					console.log((xhr.loaded / xhr.total * 100) + '% loaded');
				},
				function (error) {
					console.log('An error happened');
				}
			);
		});
	} else {
		var gltfLoader = new THREE.GLTFLoader(THREE.DefaultLoadingManager);
		gltfLoader.load('models/' + file + '.glb',
			function (gltf) {
				game.vehicle = gltf.scene;
				scene.add(gltf.scene);
				lock = false;
				if (vehicleType == 1) game.vehicle.scale.set(.04, .05, .04);
				else game.vehicle.scale.set(.04, .05, .03);
				game.vehicle.position.y = 150;
				game.vehicle.rotation.y = 1.5;
				game.vehicle.traverse(function (child) {
					if (child instanceof THREE.Mesh) {
						child.castShadow = true;
						child.material.transparent = false;
					}
				});
				game.vehicle.castShadow = true;
			},
			function (xhr) {
				console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			function (error) {
				console.log('An error happened');
			});
	}
}

function initParticlesHolder() {
	particlesHolder = new ParticlesHolder(30);
	scene.add(particlesHolder.mesh)
}

function handleSmoke() {
	if (vehicleType == 3) return;
	var speedFactor = 15000 * game.baseSpeed;
	var intervalSmoke = 140 - speedFactor;
	if (intervalSmoke < 100) intervalSmoke = 100;
	if (typeof (game.vehicle) != 'undefined' && newTime - game.lastSmokeSpawn > intervalSmoke && !game.gameOver) {
		var vehPos = game.vehicle.position.clone();
		vehPos.x -= 10;
		particlesHolder.spawnParticles(true, speedFactor, vehPos, 1, Colors.ligherBlack, .8);
		game.vehicle.position.clone();
		game.lastSmokeSpawn = newTime;
	}
	else if (game.gameOver && typeof (game.vehicle) != 'undefined' && newTime - game.lastSmokeSpawn > intervalSmoke / 2 && !game.showReplay) {
		var vehPos = game.vehicle.position.clone();
		vehPos.x -= 10;
		particlesHolder.spawnParticles(true, speedFactor, vehPos, 1, Colors.black, 1.1);
		game.vehicle.position.clone();
		game.lastSmokeSpawn = newTime;
	}
}
function updateUI() {
	htmlUI.distance.innerHTML = Math.floor(game.distance * 40);
	htmlUI.level.innerHTML = game.level;
	htmlUI.energy.style.right = (100 - game.energy) + "%";
	htmlUI.energy.style.backgroundColor = (game.energy < 50) ? "#f25346" : "#68c3c0";
	if (game.hasShield) htmlUI.shield.innerHTML = "Active"
	else if (game.shieldCooldown == 0) htmlUI.shield.innerHTML = "Ready"
	else htmlUI.shield.innerHTML = (Math.round(game.shieldCooldown / 100) / 10).valueOf() + "s";
	if (game.showReplay) {
		htmlUI.replay.style.display = "block";
		htmlUI.scoreboard_header.style.display = "block";
		htmlUI.scoreboard.style.display = "block";
		if (!game.scoreAdded) htmlUI.scoreMessage.style.display = "block";
	}
	else {
		htmlUI.replay.style.display = "none";
		htmlUI.scoreMessage.style.display = "none";
		htmlUI.scoreboard_header.style.display = "none";
		htmlUI.scoreboard.style.display = "none";
	}
	if (game.showReplay && game.scoreAdded) htmlUI.scoreMessage.style.display = "none";

}


function handleTerrainRotation(deltaTime) {
	terrain.mesh.rotation.z += game.baseSpeed * deltaTime;
	if (terrain.mesh.rotation.z > 2 * Math.PI) terrain.mesh.rotation.z -= 2 * Math.PI;
}

function handleLightBrightness(deltaTime) {
	if (ambientLight.intensity < 1.0) ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;
	else ambientLight.intensity = 1.0;
}

function handleSpeed(deltaTime) {
	if (game.gameOver) return;
	game.distance += game.baseSpeed * game.deltaTime;
	game.distanceSinceStartLevel += game.baseSpeed * game.deltaTime;
	game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
}

function handleEnergy(deltaTime) {
	if (game.gameOver) return;
	var energyMinus = game.energyDecayPerFrame * deltaTime * game.discountEnergyCost;
	if (game.level > 1) energyMinus += game.level * game.energyDecayIncrPerLevel;
	if (game.hasShield) energyMinus += game.shieldActiveCost;
	game.energy = game.energy - energyMinus;
	if (game.energy <= 0) {
		game.energy = 0;
		game.gameOver = true;
		if (game.hasShield) disableShieldImmunity(false);
	}
}

function handleGameStatus(deltaTime) {
	if (game.gameOver) {
		game.vehicle.rotation.z += (-Math.PI / 2 - game.vehicle.rotation.z) * .0012 * deltaTime;
		game.vehicle.rotation.x += 0.0003 * deltaTime;
		game.gameOverVehicleSpeed *= 1.05;
		game.vehicle.position.y -= game.gameOverVehicleSpeed * deltaTime;
		game.vehicle.position.x += game.gameOverVehicleSpeed * deltaTime;
		game.gameOverVehicleSpeed *= 1.01;
		game.baseSpeed *= 0.99;
		if (game.baseSpeed < 0) game.baseSpeed = 0;
		if (!game.showReplay) {
			var distance = game.vehicle.position.distanceTo(terrain.mesh.position);
			if ((distance < 630 || distance > 2000) && !game.showReplay) {
				game.showReplay = true;
				printScoreboard(htmlUI.scoreboard);
				particlesHolder.spawnParticles(false, 0, game.vehicle.position.clone(), 5, Colors.red, 2);
				scene.remove(game.vehicle);
				removeShield();
			}
		}
	}
}


function loop() {
	stats.begin();
	newTime = new Date().getTime();
	deltaTime = newTime - oldTime;
	if (deltaTime > 1000) deltaTime = 1;
	if (options.fixedDeltaFramesTime) deltaTime = FIXED_DELTA_VALUE;
	game.deltaTime = deltaTime;
	oldTime = newTime;
	var meshesReady = enemyMeshStorage.isReady();
	if (options.paused) {
		requestAnimationFrame(loop);
		return;
	}
	applySettings();
	if (terrainIsChanging && levelChanged != undefined && newTime - levelChanged < 5000) {
		terrain.moveVerts();
	} else terrainIsChanging = false;
	if (!game.gameOver) {

		if (game.distanceSinceStartLevel > (game.levelDistance + 5 * game.level)) {
			game.distanceSinceStartLevel = 0;
			game.level = game.level + 1;
			game.speedLastUpdate = Math.floor(game.distance);
			game.baseSpeed = 0;
			game.targetBaseSpeed = game.vehicleInitialSpeed + game.levelSpeedIncrement * game.level;
			levelChanged = new Date().getTime();
			terrainIsChanging = true;

		}
		if ((meshesReady && !game.firstMeshesSpawned && game.vehicle != undefined) || (Math.floor(game.distance) % game.distanceForBonusesSpawn == 0 && game.vehicle != undefined && Math.floor(game.distance) > game.bonusLastSpawn)) {
			game.bonusLastSpawn = Math.floor(game.distance);
			bonusHolder.spawnBonuses();
		}

		if ((meshesReady && !game.firstMeshesSpawned && game.vehicle != undefined) || (Math.floor(game.distance) % game.distanceForEnemiesSpawn == 0 && game.vehicle != undefined && Math.floor(game.distance) > game.enemiesLastSpawn)) {
			if (enemyMeshStorage.isReady()) {
				game.enemiesLastSpawn = Math.floor(game.distance);
				enemiesHolder.spawnEnemies();
			}
		}

		if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
			game.speedLastUpdate = Math.floor(game.distance);
			game.targetBaseSpeed += game.speedIncrement * deltaTime;
		}
	}

	if (game.vehicle != undefined) {
		updateVehicle();
	}

	if (vehicleType != options.vehicle) {
		vehicleType = options.vehicle;
		if (game.vehicle != undefined) scene.remove(game.vehicle);
		removeShield();
		resetGame();
	}
	if (meshesReady && !game.firstMeshesSpawned) game.firstMeshesSpawned = true;
	handleTerrainRotation(deltaTime);
	handleLightBrightness(deltaTime);
	handleSpeed(deltaTime);
	handleEnergy(deltaTime);
	handleShield(deltaTime);
	handleSmoke();
	handleGameStatus(deltaTime);
	sky.moveClouds();
	bonusHolder.animateElements();
	bonusHolder.checkCollisions();
	enemiesHolder.animateEnemies();
	enemiesHolder.checkCollisions();
	updateUI();
	renderer.render(scene, camera);
	stats.end();
	requestAnimationFrame(loop);
}
