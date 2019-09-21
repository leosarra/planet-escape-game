Bonus = function () {
	var geom = new THREE.OctahedronGeometry(5, 0);
	var mat = new THREE.MeshPhongMaterial({
		color: 0x009999,
		shininess: 0,
		specular: 0xffffff,
		flatShading: true
	});
	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.castShadow = true;
	this.angle = 0;
	this.dist = 0;
}

BonusHolder = function (game, particlesHolder, quantity) {
	this.particlesHolder = particlesHolder;
	this.mesh = new THREE.Object3D();
	this.bonusesInUse = [];
	this.bonusesPool = [];
	this.game = game;
	for (var i = 0; i < quantity; i++) {
		var bonus = new Bonus();
		this.bonusesPool.push(bonus);
	}

}

BonusHolder.prototype.spawnBonuses = function () {

	var quantity = 1 + Math.floor(Math.random() * 7);
	var d = Math.floor(Math.random() * (923 - 730 + 1)) + 730;
	var a = 8 + Math.round(Math.random() * 7);
	var goldBonusSpawned = false;
	var goldBonusPos = -1;

	for (var i = 0; i < quantity; i++) {
		if (Math.random() < 0.01) {
			goldBonusSpawned = true;
			goldBonusPos = i;
			break;
		}
	}
	for (var i = 0; i < quantity; i++) {
		var bonus;
		if (this.bonusesPool.length) {
			bonus = this.bonusesPool.pop();
		} else {
			bonus = new Bonus();
		}
		var color = 0x009999;

		if (goldBonusSpawned && goldBonusPos == i) {
			bonus.type = 0;
			color = 0xFFD700;
		} else if (Math.random() < 0.15 && !goldBonusSpawned) {
			bonus.type = 1;
			color = 0x38761D;
		} else {
			bonus.type = 2;
		}
		bonus.mesh.material.color = new THREE.Color(color);
		bonus.mesh.material.needsUpdate = true;
		this.mesh.add(bonus.mesh);
		this.bonusesInUse.push(bonus);
		bonus.angle = - (i * 0.02);
		bonus.distance = d + Math.cos(i * .5) * a;
		bonus.mesh.position.y = -700 + Math.sin(bonus.angle) * bonus.distance;
		bonus.mesh.position.x = Math.cos(bonus.angle) * bonus.distance;
	}
}

BonusHolder.prototype.animateElements = function () {
	for (var i = 0; i < this.bonusesInUse.length; i++) {
		var bonus = this.bonusesInUse[i];
		adj = this.game.baseSpeed * this.game.deltaTime * 0.5;
		if (Math.abs(adj) > 0.2) adj = 0.2;
		bonus.angle += adj;
		if (bonus.angle > Math.PI * 2) bonus.angle -= Math.PI * 2;
		bonus.mesh.position.y = -700 + Math.sin(bonus.angle) * bonus.distance;
		bonus.mesh.position.x = Math.cos(bonus.angle) * bonus.distance;
		bonus.mesh.rotation.z += Math.random() * .005 * game.deltaTime;
		bonus.mesh.rotation.y += Math.random() * .005 * game.deltaTime;
	}
}

BonusHolder.prototype.checkCollisions = function () {
	if (this.game.vehicle == undefined) return;
	for (var i = 0; i < this.bonusesInUse.length; i++) {
		var bonus = this.bonusesInUse[i];
		var distance = game.vehicle.position.distanceTo(bonus.mesh.position);
		if (distance < 15) {
			this.bonusesPool.unshift(this.bonusesInUse.splice(i, 1)[0]);
			this.mesh.remove(bonus.mesh);
			var energyBonus = 5;
			if (bonus.type == 1) energyBonus = energyBonus * 2;
			else if (bonus.type == 0) energyBonus = 100;
			if (!this.game.gameOver) this.game.energy += energyBonus;
			if (this.game.energy > 100) this.game.energy = 100;
			this.particlesHolder.spawnParticles(false, 0, bonus.mesh.position.clone(), 5, bonus.mesh.material.color, .8);
			i--;
		} else if (bonus.angle > Math.PI || bonus.mesh.position.x < -600) {
			this.bonusesPool.unshift(this.bonusesInUse.splice(i, 1)[0]);
			this.mesh.remove(bonus.mesh);
			i--;
		}
	}
}