Particle = function(isSmoke, data){
    var geom,mat;
    this.data = data;
    if (isSmoke) {
      geom = new THREE.IcosahedronGeometry(3,0);
      mat = new THREE.MeshPhongMaterial({
        color:0x009999,
        shininess:0,
        specular:0xffffff,
        flatShading:THREE.FlatShading,
        opacity:0.0,
        transparent:true,
      });

      
    } else {
      geom = new THREE.TetrahedronGeometry(3,0);
      mat = new THREE.MeshPhongMaterial({
        color:0x009999,
        shininess:0,
        specular:0xffffff,
        flatShading:THREE.FlatShading,
      });
    }
    this.mesh = new THREE.Mesh(geom,mat);
    if (isSmoke) {
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = false;
    }
  }


  Particle.prototype.explode = function(isSmoke, speedFactor, pos, color, scale){
    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color( color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random()*2)*50;
    var targetY = pos.y + (-1 + Math.random()*2)*50;
    var ease = Power2.easeOut;
    if (isSmoke) {
      if (speedFactor>23) speedFactor = 23
      targetX = pos.x - 35 - speedFactor;
      targetY = pos.y + (-1 + Math.random()*2)*3;
      ease = Power0.easeOut;
    }
    var speed = .6+Math.random()*.2;
    var data = this.data;
    var rotationSpeedFactor;
    if (isSmoke) {
      rotationSpeedFactor = 3
      TweenMax.to(this.mesh.material, speed*0.6, {opacity: 1});
    } else {
      rotationSpeedFactor = 12
    }
    TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*rotationSpeedFactor, y:Math.random()*rotationSpeedFactor});
    TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
    TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:ease, onComplete:function(){
        if(_p) _p.remove(_this.mesh);
        _this.mesh.scale.set(1,1,1);
        if (isSmoke) data.smokePool.unshift(_this);
        else data.particlesPool.unshift(_this);
      }});
  }
  
  ParticlesHolder = function (data){
    this.mesh = new THREE.Object3D();
    this.data = data;
    this.data.particlesActive = [];
  }
  
  ParticlesHolder.prototype.spawnParticles = function(isSmoke, speedFactor, pos, density, color, scale){
  
    var nPArticles = density;
    for (var i=0; i<nPArticles; i++){
      var particle;
      if(!isSmoke) {
        if (this.data.particlesPool.length ) {
          particle = this.data.particlesPool.pop();
        } else {
          particle = new Particle(false,data);
        }
      }
      else {
        if (this.data.smokePool.length) {
          particle = this.data.smokePool.pop();
        } else {
          particle = new Particle(true,data);
        }
      }
      this.mesh.add(particle.mesh);
      particle.mesh.visible = true;
      var _this = this;
      particle.mesh.position.y = pos.y;
      particle.mesh.position.x = pos.x;
      particle.explode(isSmoke, speedFactor, pos,color, scale);
      if (isSmoke) break;
    }
  }