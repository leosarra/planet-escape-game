EnemiesHolder = function (game, data, particlesHolder, enemyMeshStorage){
    this.game = game;
    this.data = data;
    this.particlesHolder = particlesHolder;
    this.enemyMeshStorage = enemyMeshStorage;
    this.mesh = new THREE.Object3D();
    this.enemiesInUse = [];
  }


  EnemiesHolder.prototype.spawnEnemies = function(){
    var nEnemies = game.level;
  
    for (var i=0; i<nEnemies; i++){
      var enemy;
      if (this.data.enemiesPool.length) {
        enemy = this.data.enemiesPool.pop();
      }else{
        enemy = new Enemy();
      }
      enemy.angle = - (i*0.1);
      enemy.distance = Math.floor(Math.random() * (900 - 730 + 1)) + 730;

//>815
      if (false) {
        enemy.type = 0;
        enemy.mesh = enemyMeshStorage.getAirplaneMesh();
        enemy.mesh.scale.set(.17,.17,.17);
        enemy.mesh.rotation.y = 3 * Math.PI;
      } else {
        if (false) {
          enemy.type = 1;
          enemy.mesh = enemyMeshStorage.getAsteroidMesh();
          enemy.mesh.scale.set(40,40,40);
        } else {
          var layout = Math.floor(Math.random() * 3) + 1;
          enemy.type = 2;
          enemy.mesh = enemyMeshStorage.getSateliteMesh();
          enemy.mesh.scale.set(.03,.03,.03);
          if (layout == 1) {
            enemy.mesh.rotation.z = 27.35;
            enemy.mesh.rotation.y = 6.20;
          } else if (layout == 2) {
            enemy.mesh.rotation.z = 25.65;
            enemy.mesh.rotation.y = 6.20;
          } else {
            enemy.mesh.rotation.z = 26.35;
            enemy.mesh.rotation.y = 6.20;
          }
        }

      }
      enemy.mesh.traverse( function ( child ) {
        if ( child instanceof THREE.Object3D  ) {
          if (child.name == "propeller") enemy.propeller = child;
          else if (child.name == "parabola") enemy.sateliteDisc = child;
          else if (child.name == "topPart") enemy.sateliteTopPart = child;
        }
      } );
      enemy.mesh.position.y = -650 + Math.sin(enemy.angle)*enemy.distance;
      enemy.mesh.position.x = Math.cos(enemy.angle)*enemy.distance;
      this.mesh.add(enemy.mesh);
      this.enemiesInUse.push(enemy);
    }
  }
  
  EnemiesHolder.prototype.rotateEnemies = function(){
    for (var i=0; i<this.enemiesInUse.length; i++){
      var enemy = this.enemiesInUse[i];
      enemy.angle += this.game.baseSpeed*this.game.deltaTime*0.6;
      if (enemy.angle > Math.PI*2) enemy.angle -= Math.PI*2;
      enemy.mesh.position.y = -650 + Math.sin(enemy.angle)*enemy.distance;
      enemy.mesh.position.x = Math.cos(enemy.angle)*enemy.distance;
      if (enemy.type == 0) {
        enemy.mesh.position.y = -650 + Math.sin(enemy.angle)*enemy.distance;
        enemy.mesh.position.x = Math.cos(enemy.angle)*enemy.distance;
        enemy.propeller.rotation.x = enemy.propeller.rotation.x + 0.2 * deltaTime;
      } else if (enemy.type == 1) {
        enemy.mesh.position.y = -650 + Math.sin(enemy.angle)*enemy.distance;
        enemy.mesh.position.x = Math.cos(enemy.angle)*enemy.distance;
        enemy.mesh.rotation.z += Math.random()*.005*game.deltaTime;
        enemy.mesh.rotation.y += Math.random()*.005*game.deltaTime;
      } else if (enemy.type == 2) {
        enemy.sateliteDisc.rotation.x += 0.05;
      }
      if (game.vehicle == undefined) continue;
      var diffPos = game.vehicle.position.clone().sub(enemy.mesh.position.clone());
      var d = diffPos.length();
      if (d<15){
        this.particlesHolder.spawnParticles(false, 0, enemy.mesh.position.clone(), 15, 0x009999, 3);
  
        this.data.enemiesPool.unshift(this.enemiesInUse.splice(i,1)[0]);
        this.mesh.remove(enemy.mesh);
        if (this.game.hasShield) {
          this.particlesHolder.spawnParticles(false, 0, game.vehicle.position, 5, Colors.green, 3);
          disableShieldImmunity();
          this.mesh.remove(enemy.mesh);
        }
        else game.gameOver = true;
        i--;
      } else if (enemy.angle > Math.PI){
        this.data.enemiesPool.unshift(this.enemiesInUse.splice(i,1)[0]);
        this.mesh.remove(enemy.mesh);
        i--;
      }
    }
  }


  Enemy = function(meshStorage){
    this.type = -1;
    this.angle = 0;
    this.dist = 0;
  }