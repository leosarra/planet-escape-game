EnemyMeshStorage = function(){
}

EnemyMeshStorage.prototype.load = function() {
	var storage = this;
    storage.airplane = new AirPlane();
    storage.airplane = this.airplane.mesh;
	var gltfLoader = new THREE.GLTFLoader(THREE.DefaultLoadingManager);
	gltfLoader.load('models/mars.glb',
		function ( gltf ) {
			gltf.scene.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.castShadow = true;
				}
			} );
            gltf.scene.castShadow = true;
			storage.asteroid = gltf.scene;
		},
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		function ( error ) {
			console.log( 'An error happened' );
		});
	gltfLoader.load('models/satelite.glb',
		function ( gltf ) {
			gltf.scene.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.castShadow = true;
				}
			} );
            gltf.scene.castShadow = true;
			storage.satelite = gltf.scene;
		},
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		function ( error ) {
			console.log( 'An error happened' );
		});
	
	gltfLoader.load('models/pterodactyl.glb',
		function ( gltf ) {
			gltf.scene.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.castShadow = true;
				}
			} );
            gltf.scene.castShadow = true;
			storage.pterodactyl = gltf.scene;
		},
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		function ( error ) {
			console.log( 'An error happened' );
		});	
}

EnemyMeshStorage.prototype.isReady = function() {
    if (this.airplane != undefined && this.asteroid != undefined) return true;
    else return false;
}

EnemyMeshStorage.prototype.getAirplaneMesh = function () {
	if (!this.isReady()) return;
	return this.airplane.clone();
}

EnemyMeshStorage.prototype.getAsteroidMesh = function () {
	if (!this.isReady()) return;
	return this.asteroid.clone();
}

EnemyMeshStorage.prototype.getSateliteMesh = function () {
	if (!this.isReady()) return;
	return this.satelite.clone();
}

EnemyMeshStorage.prototype.getPterodactyl = function () {
	if (!this.isReady()) return;
	return this.pterodactyl.clone();
}