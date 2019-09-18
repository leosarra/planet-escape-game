Projectile = function (holder) {
    var geom, mat;
    this.holder = holder;
    var geom = new THREE.BoxGeometry(7, 0.75, 2);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x7CFC00,
        shininess: 0,
        specular: 0xffffff,
        flatShading: true,
        opacity: 0.0,
        transparent: true,
    });
    this.mesh = new THREE.Mesh(geom, mat);
}

Projectile.prototype.fire = function (pos) {
    var _this = this;
    var _p = this.mesh.parent;
    var speed = 0.6;
    var targetX = pos.x + 2000;
    this.holder.activeProjectiles.unshift(this);
    this.tween1 = TweenMax.to(this.mesh.material, 0.05, { opacity: 1 });
    this.tween2 = TweenMax.to(this.mesh.position, speed, {
        x: targetX, y: pos.y, ease: Linear.easeOut, onComplete: function () {
            if (_p) _p.remove(_this.mesh);
            for (var i = 0; i < _this.holder.activeProjectiles.length; i++) {
                if (_this.holder.activeProjectiles[i] == _this) {
                    _this.holder.projectilesPool.unshift(_this.holder.activeProjectiles.splice(i, 1)[0]);
                    break;
                }
            }
        }
    }).duration(5);
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
        projectile.mesh.material.opacity = 0;
    } else {
        projectile = new Projectile(this);
    }
    this.mesh.add(projectile.mesh);
    projectile.mesh.position.y = pos.y;
    projectile.mesh.position.x = pos.x;
    projectile.fire(pos);
}

ProjectilesHolder.prototype.checkCollisions = function (pos) {
    var ret = false;
    for (var i = 0; i < this.activeProjectiles.length; i++) {
        var projectile = this.activeProjectiles[i];
        var d = projectile.mesh.position.distanceTo(pos);
        if (d < 14) {
            projectile.tween1.kill();
            projectile.tween2.kill();
            this.projectilesPool.unshift(this.activeProjectiles.splice(i, 1)[0]);
            this.mesh.remove(projectile.mesh);
            i--;
            ret = true;
        }
    }
    return ret;
}