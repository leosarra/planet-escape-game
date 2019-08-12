Coin = function(){
	var geom = new THREE.OctahedronGeometry(5,0);
	var mat = new THREE.MeshPhongMaterial({
	  color:0x009999,
	  shininess:0,
	  specular:0xffffff,
  
	  flatShading:THREE.FlatShading
	});
	this.mesh = new THREE.Mesh(geom,mat);
	this.mesh.castShadow = true;
	this.angle = 0;
	this.dist = 0;
  }
  
  CoinsHolder = function (game, particlesHolder, nCoins){
    this.particlesHolder = particlesHolder;
	this.mesh = new THREE.Object3D();
	this.coinsInUse = [];
	this.coinsPool = [];
	this.game = game;
	for (var i=0; i<nCoins; i++){
		var coin = new Coin();
		this.coinsPool.push(coin);
	  }

  }
  
  CoinsHolder.prototype.spawnCoins = function(){
  
	var nCoins = 1 + Math.floor(Math.random()*7);
	var d = 700 + 100 + (-1 + Math.random() * 2) * 120;
	var amplitude = 8 + Math.round(Math.random()*7);
	for (var i=0; i<nCoins; i++){
	  var coin;
	  if (this.coinsPool.length) {
		coin = this.coinsPool.pop();
	  }else{
		coin = new Coin();
	  }
	  this.mesh.add(coin.mesh);
	  this.coinsInUse.push(coin);
	  coin.angle = - (i*0.02);
	  coin.distance = d + Math.cos(i*.5)*amplitude;
	  coin.mesh.position.y = -700 + Math.sin(coin.angle)*coin.distance;
	  coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
	}
  }
  
  CoinsHolder.prototype.rotateCoins = function(){
	for (var i=0; i<this.coinsInUse.length; i++){
	  var coin = this.coinsInUse[i];
	  if (coin.exploding) continue;
	  adj = this.game.baseSpeed*this.game.deltaTime*0.5;
	  if (Math.abs(adj)>0.2) adj = 0.2;
	  coin.angle += adj;
	  if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
	  coin.mesh.position.y = -700 + Math.sin(coin.angle)*coin.distance;
	  coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
	  coin.mesh.rotation.z += Math.random()*.1;
	  coin.mesh.rotation.y += Math.random()*.1;
      if (this.game.vehicle == undefined) return;

	  var diffPos = this.game.vehicle.position.clone().sub(coin.mesh.position.clone());
	  var d = diffPos.length();
	  if (d<15){
		this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
		this.mesh.remove(coin.mesh);
		this.game.energy +=5;
		if (this.game.energy > 100) this.game.energy = 100;
		this.particlesHolder.spawnParticles(false, 0, coin.mesh.position.clone(), 5, 0x009999, .8);
		i--;
	  }else if (coin.angle > Math.PI || coin.mesh.position.x < -600){
		this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
		this.mesh.remove(coin.mesh);
		i--;
	  }
	}
  }