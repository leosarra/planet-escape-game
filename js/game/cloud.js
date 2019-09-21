
Cloud = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.DodecahedronGeometry(20, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });
  var nChildren = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nChildren; i++) {
    var childrenMesh = new THREE.Mesh(geom.clone(), mat);
    childrenMesh.position.x = i * 15;
    childrenMesh.position.y = Math.random() * 10;
    childrenMesh.position.z = Math.random() * 10;
    childrenMesh.rotation.z = Math.random() * Math.PI * 2;
    childrenMesh.rotation.y = Math.random() * Math.PI * 2;
    var scaleFactor = .1 + Math.random() * .8;
    childrenMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    childrenMesh.castShadow = true;
    childrenMesh.receiveShadow = true;
    this.mesh.add(childrenMesh);
  }
}

Cloud.prototype.rotate = function () {
  var l = this.mesh.children.length;
  for (var i = 0; i < l; i++) {
    var childrenMesh = this.mesh.children[i];
    var animationBoost = (i + 1) * 0.5;
    childrenMesh.rotation.z += Math.random() * .0055 * animationBoost;
    childrenMesh.rotation.y += Math.random() * .00225 * animationBoost;
  }
}