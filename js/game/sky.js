Sky = function (game, nClouds) {
	this.game = game;
	this.mesh = new THREE.Object3D();
	this.nClouds = nClouds;
	this.clouds = [];
	var stepAngle = Math.PI * 2 / this.nClouds;
	for (var i = 0; i < this.nClouds; i++) {
		var cloud = new Cloud();
		this.clouds.push(cloud);
		var a = stepAngle * i;
		var h = 750 + Math.random() * 200;
		cloud.mesh.position.y = Math.sin(a) * h;
		cloud.mesh.position.x = Math.cos(a) * h;
		cloud.mesh.position.z = -400 - Math.random() * 500;
		cloud.mesh.rotation.z = a + Math.PI / 2;
		var scaleFactor = 1 + Math.random() * 2;
		cloud.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
		this.mesh.add(cloud.mesh);
	}
}

Sky.prototype.moveClouds = function () {
	for (var i = 0; i < this.nClouds; i++) {
		var cloud = this.clouds[i];
		cloud.rotate();
	}
	this.mesh.rotation.z += this.game.baseSpeed * this.game.deltaTime;

}