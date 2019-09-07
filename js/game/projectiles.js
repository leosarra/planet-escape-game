Projectile = function (holder) {
    var geom, mat;
    this.holder = holder;
	var geom = new THREE.OctahedronGeometry(5, 0);
	var mat = new THREE.MeshPhongMaterial({
		color: 0x38761D,
		shininess: 0,
		specular: 0xffffff,
		flatShading: true
	});
	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.castShadow = true;
}

Projectile.prototype.fire = function (pos) {
    var _this = this;
    var _p = this.mesh.parent;
    var speed = 0.6;
    var targetX = pos.x + 400;
    this.holder.activeProjectiles.unshift(this);
    TweenMax.to(this.mesh.position, speed, {x: targetX, y: pos.y, ease: Linear.easeOut, onComplete: function () {
          if (_p) _p.remove(_this.mesh);
          for (var i = 0; i < _this.holder.activeProjectiles.length; i++) {
              if (_this.holder.activeProjectiles[i] == _this) {
                _this.holder.projectilesPool.unshift(_this.holder.activeProjectiles.splice(i, 1)[0]);
                break;
              }
          }
        }
      });
}

ProjectilesHolder = function (nProjectiles) {
    this.mesh = new THREE.Object3D();
    this.projectilesPool = [];
    this.activeProjectiles = [];
    for (var i = 0; i < nProjectiles; i++) {
		var projectile = new Projectile(this);
		this.projectilesPool.push(projectile);
	}
}

ProjectilesHolder.prototype.spawnParticles = function (pos) {

    if (this.projectilesPool.length) {
        projectile = this.projectilesPool.pop();
        projectile.mesh.visible = true;
    } else {
        projectile = new Projectile(data);
    }
    this.mesh.add(projectile.mesh);
    projectile.mesh.position.y = pos.y;
    projectile.mesh.position.x = pos.x;
    projectile.fire(pos);
}

ProjectilesHolder.prototype.checkCollisions = function (pos) {
    for (var i = 0; i < this.activeProjectiles.length; i++) {
        var projectile = this.activeProjectiles[i];
        if (!projectile.mesh.visible) {
            console.log("IGNORED");
            continue;
        }
        var diffPos = projectile.mesh.position.clone().sub(pos.clone());
        var d = diffPos.length();
        console.log(d);
		if (d < 15) {
            projectile.mesh.visible = false;
            return true;
        }
    }
    return false;
}