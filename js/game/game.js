window.addEventListener('load', init, false);
var gui;
var audio, audioListener, scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;
var vehicleType = 0;
var hemisphereLight, shadowLight;
var terrain, sky, airplane;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var coinsHolder, enemiesHolder;
var particlesHolder;
var stats;
var game, scoreboard;
var paused = false;
var Colors = {
	red: 0xf25346,
	green: 0x38761D,
	white: 0xd8d0d1,
	brown: 0x59332e,
	pink: 0xF5986E,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
	ligherBlack: 0x404040,
	black: 0x000000,
	gray: 0xD3D3D3
};

var data = {
	enemiesPool : [],
	particlesPool : [],
	smokePool : [],
	particlesActive : [],
}

var options = {
	vehicle : 0,
	difficulty : 0,
	audio : false,
	paused : false,
	reset: function() {
		removeShield();
		resetGame();
		if (typeof(airplane)!='undefined') scene.remove(airplane);
		createPlane(vehicleType);
	  }
	};

function createScene() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(Colors.gray, 100, 950);
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
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

function onPauseButton(){
	options.paused!=options.paused;
}

function addShield(){
	if (game.shieldCooldown != 0) return;
	game.energy *= (1-game.shieldActivationCost);
	if (game.bubble != undefined) {
		game.hasShield = true;
		return;
	}
	var geom = new THREE.IcosahedronGeometry(13,0);
	var mat = new THREE.MeshPhongMaterial({
		color:0xF5986E,
		shininess:0,
		specular:0xffffff,
		transparent: true, opacity: 0,
		flatShading:THREE.FlatShading
	  });
	  game.bubble = new THREE.Mesh(geom,mat);
	  game.bubble.position.x = game.vehicle.position.x;
	  game.bubble.position.y = game.vehicle.position.y;
	  scene.add(game.bubble);
	game.hasShield = true;
}

function removeShield(){
	if (game.bubble != undefined) {
		scene.remove(game.bubble);
		game.hasShield = false;
	}
}

function disableShieldImmunity(){
	if (!game.hasShield) return;
	game.hasShield = false;
	game.shieldCooldown = 10000;
}

function handleShieldFade(deltaTime){
	if (game.bubble == undefined) return;
	if (game.shieldCooldown!=0) {
		game.shieldCooldown = game.shieldCooldown - deltaTime;
		if (game.shieldCooldown<0) game.shieldCooldown = 0;
	}

	game.bubble.rotation.z += .002 * deltaTime;
	game.bubble.rotation.y += .002 * deltaTime;
	if (game.hasShield == true && game.bubble.material.opacity < 0.3) {
		game.bubble.material.opacity += 0.01;
	} else if (game.hasShield == false && game.bubble.material.opacity > 0) {
		game.bubble.material.opacity -= 0.01;
	}
}

function init() {
	initUI();
	resetGame();
	createScene();
	createLights();
	createPlane(vehicleType);
	createTerrain();
	createSky();
	fillParticlesPool();
	createCoins();
	createEnemies();
	setupPlayerInputListener();
	loop();
}

function setupPlayerInputListener(){
	document.addEventListener('mousemove', handleMouseMove, false);
	document.addEventListener('mouseup', function(){
		if (game.showReplay) {
			resetGame();
			createPlane(vehicleType);
		}
	}, false)
	document.addEventListener('keyup', (e) => {
		if (e.which == 32) {
			if (!game.hasShield) addShield(); 
			else disableShieldImmunity();
		} else if (e.which == 83 && game.showReplay) {
			var name = window.prompt("Enter your name");
			if (name === "") alert("Name can't be left empty");
			addScore(name,Math.floor(game.distance * 40));
			game.scoreAdded = true;
			printScoreboard(scoreboard.scoreboard);
		}
	  });
}
function initUI(){
	stats = new Stats();
	gui = new dat.GUI();
	[].forEach.call(stats.domElement.children, (child) => (child.style.display = ''));
	gui.add(options, 'vehicle', { Spaceship1: 0, Spaceship2: 1, Spaceship3:2, TARDIS: 3 });
	gui.add(options, 'difficulty', 0, 10);
	gui.add(options, 'paused');
	gui.add(options, "audio").onChange(function(){

		if (options.audio) {
			audioListener = new THREE.AudioListener();
			camera.add(audioListener);
			sound = new THREE.Audio( audioListener );
			startAudio();
		}
		else {
			if (typeof(sound)!='undefined') sound.stop();
		}
	});
	gui.add(options, 'reset');
	
	var perfFolder = gui.addFolder("Performance");
	var perfLi = document.createElement("li");
	stats.domElement.height = '48px';
	stats.domElement.style.position = "static";
	perfLi.appendChild(stats.dom);
	perfLi.classList.add("gui-stats");
	perfFolder.__ul.appendChild(perfLi);
	perfFolder.domElement.getElementsByClassName("title")[0].addEventListener("click", function(){
		if (perfLi.style.height != "auto") perfLi.style.height = "auto";
		else perfLi.style.height = "";
	});

	scoreboard = {
		level : document.getElementById('levelValue'),
		distance : document.getElementById('distValue'),
		energy : document.getElementById('energyBar'),
		shield : document.getElementById('shieldValue'),
		replay : document.getElementById('replayMessage'),
		scoreMessage : document.getElementById('scoreboardMessage'),
		scoreboard : document.getElementById('scoreboard'),
		scoreboard_header : document.getElementById('scoreboard_header'),
	}
}
function resetGame(){
	if (game == undefined) {
		game = {};
	}
	game.hasShield = false;
	game.energyDecayPerFrame = 0.0015;
	game.level = 1;
	game.energy = 100;
	game.firstLoop= true;
	game.vehicle = undefined;
	game.targetBaseSpeed = .00035;
	game.vehicleInitialSpeed = .00035;
	game.baseHeigth = 100;
	game.speedIncrement = .000004;
	game.levelSpeedIncrement = .000040;
	game.coinLastSpawn=0;
	game.enemiesLastSpawn=0;
	game.speedLastUpdate= 0;
	game.distanceForCoinsSpawn=2;
	game.distanceForEnemiesSpawn=2;
	game.distanceForSpeedUpdate=2;
	game.distance = 0;
	game.speed = 0;
	game.baseSpeed = .00035
	game.deltaTime = 0;
	game.levelDistance = 20;
	game.distanceSinceStartLevel = 0;
	game.bubble = undefined;
	game.lastSmokeSpawn = 0;
	game.shieldActivationCost = 0.33;
	game.shieldActiveCost = 0.0015;
	game.shieldCooldown = 0;
	game.gameOver = false;
	game.gameOverVehicleSpeed = .002;
	game.showReplay = false;
	game.scoreAdded =false;
	scoreboard.level.innerHTML = 1;
	scoreboard.distance.innerHTML == 0;
	scoreboard.energy.style.right = (100-game.energy)+"%";
	scoreboard.energy.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";
	scoreboard.shield.innerHTML = "Ready";
	if (typeof(sound) != 'undefined') {
		sound.stop();
		if (options.audio) sound.play();
	}
	
}

var mousePos = { x: 0, y: 0 };
function handleMouseMove(event) {
	var tx = -1 + (event.clientX / WIDTH) * 2;
	var ty = 1 - (event.clientY / HEIGHT) * 2;
	mousePos = { x: tx, y: ty };

}


function updatePlane() {
	if (game.gameOver) return;
	var targetY = normalize(mousePos.y, -.75, .75, 75, 250);
	var targetX = normalize(mousePos.x, -.75, .75, -100, 100);
	// Move the plane at each frame by adding a fraction of the remaining distance
	airplane.position.y += (targetY - airplane.position.y) * 0.005 * deltaTime;
	airplane.position.x += (targetX - airplane.position.x) * 0.005 * deltaTime;
	// Rotate the plane proportionally to the remaining distance
	airplane.rotation.z = (targetY - airplane.position.y) * 0.0008 * deltaTime;
	airplane.rotation.x = (airplane.position.y - targetY) * 0.0004 * deltaTime;
	if (typeof(game.bubble)!='undefined'){
		game.bubble.position.y = game.vehicle.position.y;
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

function startAudio(){
	var audioLoader = new THREE.AudioLoader();
	console.log("starting audio...");
	audioLoader.load( 'music/background.ogg', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 1 );
	sound.play();

});
}

function createLights() {
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);
	ambientLight = new THREE.AmbientLight(0xdc8874, .5);
	shadowLight.position.set(150, 350, 350);
	shadowLight.castShadow = true;
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;
	scene.add(hemisphereLight);
	scene.add(shadowLight);
	scene.add(ambientLight);
}



function createCoins(){
	coinsHolder = new CoinsHolder(game,particlesHolder, 20);
	scene.add(coinsHolder.mesh)
  }

function createEnemies(){
	for (var i=0; i<10; i++){
		var ennemy = new Enemy();
		this.data.enemiesPool.push(ennemy);
	  }
	enemiesHolder = new EnemiesHolder(game,data, particlesHolder);
	scene.add(enemiesHolder.mesh)
  }

function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

function createTerrain() {
	terrain = new Terrain();
	terrain.mesh.position.y = -550;
	scene.add(terrain.mesh);
}

function createSky() {
	sky = new Sky(game);
	sky.mesh.position.y = -600;
	scene.add(sky.mesh);
}

function createPlane(vehicleType) {
	var file = null;
	if (vehicleType == 0) file = "spaceship1";
	else if (vehicleType == 1) file = "spaceship2";
	else if (vehicleType == 2) file = "spaceship3";
	else if (vehicleType == 3) file = "spaceship4";
	var mtlLoader = new THREE.MTLLoader()
	mtlLoader.load('models/' + file + '.mtl', function (materials) {
		materials.preload();
		var loader = new THREE.OBJLoader();
		loader.setMaterials(materials);
		loader.load(
			'models/' + file + '.obj',
			function (object) {
				airplane = object;
				scene.add(object);
				lock = false;
				if (vehicleType ==1) airplane.scale.set(.04, .05, .04);
				else airplane.scale.set(.04, .05, .03);
				airplane.position.y = 150;
				airplane.rotation.y = 1.5;
				airplane.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.castShadow = true;
					}
				} );
				airplane.castShadow = true;
				scene.add(airplane);
				game.vehicle = airplane;
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
}

function fillParticlesPool(){
	for (var i=0; i<10; i++){
	  var particle = new Particle(false, data);
	  data.particlesPool.push(particle);
	}
	for (var i=0; i<10; i++){
		var particle = new Particle(true, data);
		data.smokePool.push(particle);
	  }
	particlesHolder = new ParticlesHolder(data);
	scene.add(particlesHolder.mesh)
}

function handleSmoke(){
	var speedFactor = 15000 * game.baseSpeed;
	var intervalSmoke = 140 - speedFactor;
	if (intervalSmoke < 100) intervalSmoke = 100;
	if (typeof(game.vehicle) != 'undefined' && newTime - game.lastSmokeSpawn > intervalSmoke && !game.gameOver) {
		var vehPos = game.vehicle.position.clone();
		vehPos.x -= 10;
		particlesHolder.spawnParticles(true, speedFactor, vehPos, 5, Colors.ligherBlack, .8);
		game.vehicle.position.clone();
		game.lastSmokeSpawn = newTime;
	}
	else if (game.gameOver && typeof(game.vehicle) != 'undefined' && newTime - game.lastSmokeSpawn > intervalSmoke/2 && !game.showReplay) {
		var vehPos = game.vehicle.position.clone();
		vehPos.x -= 10;
		particlesHolder.spawnParticles(true, speedFactor, vehPos, 5, Colors.black, 1.1);
		game.vehicle.position.clone();
		game.lastSmokeSpawn = newTime;
	}
}
function updateUI(){
	scoreboard.distance.innerHTML = Math.floor(game.distance * 40);
	scoreboard.level.innerHTML = game.level;
	scoreboard.energy.style.right = (100-game.energy)+"%";
	scoreboard.energy.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";
	if (game.hasShield) scoreboard.shield.innerHTML = "Active"
	else if (game.shieldCooldown == 0) scoreboard.shield.innerHTML = "Ready"
	else scoreboard.shield.innerHTML = (Math.round(game.shieldCooldown/100) / 10).valueOf() + "s";
	if (game.showReplay) {
		scoreboard.replay.style.display="block";
		scoreboard.scoreboard_header.style.display="block";
		scoreboard.scoreboard.style.display="block";
		if (!game.scoreAdded) scoreboard.scoreMessage.style.display="block";
	}
	else  {
		scoreboard.replay.style.display="none";
		scoreboard.scoreMessage.style.display="none";
		scoreboard.scoreboard_header.style.display="none";
		scoreboard.scoreboard.style.display="none";
	}
	if (game.showReplay && game.scoreAdded) scoreboard.scoreMessage.style.display="none";

}


function handleRotation(deltaTime){
	terrain.mesh.rotation.z += game.baseSpeed*game.deltaTime;
	if ( terrain.mesh.rotation.z > 2*Math.PI)  terrain.mesh.rotation.z -= 2*Math.PI;
	if (ambientLight.intensity < 1.0) ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;
	else ambientLight.intensity = 1.0;
}

function handleSpeed(deltaTime){
	if (game.gameOver) return;
	game.distance += game.baseSpeed*game.deltaTime;
	game.distanceSinceStartLevel += game.baseSpeed*game.deltaTime;
	game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
}

function handleEnergy(deltaTime){
	var energyMinus = game.energyDecayPerFrame * deltaTime;
	if (game.level>1) energyMinus = energyMinus * (game.level/3)
	if (game.hasShield)  energyMinus = energyMinus + game.shieldActiveCost;
	game.energy = game.energy - energyMinus;
	if (game.energy <= 0) game.gameOver = true;
}

function handleGameStatus(deltaTime) {
	if (game.gameOver) {
		disableShieldImmunity();
		game.vehicle.rotation.z += (-Math.PI/2 - game.vehicle.rotation.z)*.0012*deltaTime;
		game.vehicle.rotation.x += 0.0003*deltaTime;
		game.gameOverVehicleSpeed *= 1.05;
		game.vehicle.position.y -= game.gameOverVehicleSpeed*deltaTime;
		game.vehicle.position.x += game.gameOverVehicleSpeed*deltaTime;
		game.gameOverVehicleSpeed *= 1.01;
		game.baseSpeed *=0.99;
		if (game.baseSpeed<0) game.baseSpeed = 0;
		if (!game.showReplay) {
			var diffPos = game.vehicle.position.clone().sub(terrain.mesh.position);
			  var d = diffPos.length();
			  if ((d<630 || d > 2000) && !game.showReplay) {
				game.showReplay = true;
				printScoreboard(scoreboard.scoreboard);
				particlesHolder.spawnParticles(false, 0, game.vehicle.position.clone(), 5, Colors.red, 2);  
				scene.remove(airplane);
			  }
		}
	}
}


function loop() {
	stats.begin();
	newTime = new Date().getTime();
	deltaTime = newTime-oldTime;
	game.deltaTime = deltaTime;
	oldTime = newTime;
	if (options.paused) {
		requestAnimationFrame(loop);
		return;
	}

	if (!game.gameOver) {
		if (game.distanceSinceStartLevel > (game.levelDistance + 5*game.level)) {
			game.distanceSinceStartLevel = 0;
			game.level = game.level + 1;
			game.speedLastUpdate = Math.floor(game.distance);
			game.baseSpeed = 0;
			game.targetBaseSpeed = game.vehicleInitialSpeed + game.levelSpeedIncrement*game.level;
		}
	
		if ((game.firstLoop && game.vehicle != undefined)  || (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn)){
			game.coinLastSpawn = Math.floor(game.distance);
			coinsHolder.spawnCoins();
		}

		if ((game.firstLoop && game.vehicle != undefined)  || (Math.floor(game.distance)%game.distanceForEnemiesSpawn == 0 && Math.floor(game.distance) > game.enemiesLastSpawn)){
			game.enemiesLastSpawn = Math.floor(game.distance);
			enemiesHolder.spawnEnemies();
		  }
		  
		if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
			game.speedLastUpdate = Math.floor(game.distance);
			game.targetBaseSpeed += game.speedIncrement*deltaTime;
		  }
	}
	
	if (airplane != undefined) {
		updatePlane();
	}

	if (vehicleType!= options.vehicle) {
		vehicleType = options.vehicle;
		if (airplane!=undefined) scene.remove(airplane);
		removeShield();
		resetGame();
		createPlane(vehicleType);
	}

	handleRotation(deltaTime);
	handleSpeed(deltaTime);
	handleEnergy(deltaTime);
	handleShieldFade(deltaTime);
	handleSmoke();
	handleGameStatus(deltaTime);
	sky.moveClouds();
	coinsHolder.rotateCoins();
	enemiesHolder.rotateEnemies();
	updateUI();
	renderer.render(scene, camera);
	stats.end();
	game.firstLoop = false;
	requestAnimationFrame(loop);
}