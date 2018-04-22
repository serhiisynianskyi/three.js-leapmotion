"use strict";
window.onload = function() {
	let canvas = document.getElementById('canvas');
	let scene = new THREE.Scene();
	let camera, renderer, light, controls, stats, textureCube;

	function initScene() {
		camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas }); // antialias - сглаживаем ребра
		// camera.position.set(0, 615, 700);
		camera.position.set(0, 0, 600);
		camera.rotation.set(-0.72, 0, 0);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.gammaInput = renderer.gammaOutput = true;
		renderer.toneMapping = THREE.LinearToneMapping;
		// renderer.toneMappingExposure = 1;
		renderer.setClearColor(0xffffff);
		textureCube = new THREE.CubeTextureLoader()
			.setPath('./cube/dark_dust/')
			.load(['sleepyhollow_ft.jpg', 'sleepyhollow_bk.jpg', 'sleepyhollow_up.jpg', 'sleepyhollow_dn.jpg', 'sleepyhollow_rt.jpg', 'sleepyhollow_lf.jpg']);
		// 	// .setPath('./cube/space/')
			// .load(['2.png', '4.png', '5.png', '6.png', '3.png', '1.png']);
		// scene.background = textureCube;
	}

	function resize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		renderer.setSize(window.innerWidth - 5, window.innerHeight - 5);
		camera.updateProjectionMatrix()
	}

	function addLights() {
		light;
		let d = 900;
		light = new THREE.DirectionalLight(0xdfebff, 1.1);
		light.position.set(100, 500, -650);
		light.position.multiplyScalar(1.3);
		light.castShadow = true;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;
		light.shadow.camera.left = -d;
		light.shadow.camera.right = d;
		light.shadow.camera.top = d;
		light.shadow.camera.bottom = -d;
		light.shadow.camera.far = 2000;
		scene.add(new THREE.AmbientLight(0xffffff, 1));
		scene.add(light);
	}

	function createSceneBackground(currentMap) {
		let cubeGeometry = new THREE.CubeGeometry(6000, 6000, 6000),
			cubeMesh = new THREE.Mesh(cubeGeometry, new THREE.MeshFaceMaterial([
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_ft.jpg'), side: THREE.DoubleSide }),
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_bk.jpg'), side: THREE.DoubleSide }),
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_up.jpg'), side: THREE.DoubleSide }),
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_dn.jpg'), side: THREE.DoubleSide }),
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_rt.jpg'), side: THREE.DoubleSide }),
				new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('cube/dark_dust/sleepyhollow_lf.jpg'), side: THREE.DoubleSide })
			]));
		// cubeMesh.rotation.set(0, 0.95, 0);
		scene.add(cubeMesh);
	}

	initScene();
	addLights();
	createSceneBackground();
	rendering();

	controls = new THREE.OrbitControls(camera);
	// stats = new Stats();
	// window.fps.appendChild(stats.dom);

	function rendering() {
		requestAnimationFrame(rendering);
		renderer.render(scene, camera);
	};

	window.addEventListener('resize', function(e) {
		resize();
	});

	let baseBoneRotation = (new THREE.Quaternion).setFromEuler(
		new THREE.Euler(Math.PI / 2, 0, 0)
	);
	let giftBump = new THREE.TextureLoader().load('images/5.jpg');
	//https://developer.leapmotion.com/gallery/bone-hands -- plugin
	Leap.loop({ background: false }, {
			hand: function(hand) {
				// console.log(hand)
				hand.fingers.forEach(function(finger) {
					// This is the meat of the example - Positioning `the cylinders on every frame:
					finger.data('boneMeshes').forEach(function(mesh, i) {
						let bone = finger.bones[i];
						mesh.position.fromArray(bone.center());
						mesh.setRotationFromMatrix(
							(new THREE.Matrix4).fromArray(bone.matrix())
						);
						mesh.quaternion.multiply(baseBoneRotation);
					});
					finger.data('jointMeshes').forEach(function(mesh, i) {
						let bone = finger.bones[i];
						if (bone) {
							mesh.position.fromArray(bone.prevJoint);
						} else {
							// special case for the finger tip joint sphere:
							bone = finger.bones[i - 1];
							mesh.position.fromArray(bone.nextJoint);
						}
					});
				});
				let armMesh = hand.data('armMesh');
				// debugger
				armMesh.position.fromArray(hand.arm.center());
				armMesh.setRotationFromMatrix(
					(new THREE.Matrix4).fromArray(hand.arm.matrix())
				);
				armMesh.quaternion.multiply(baseBoneRotation);
				armMesh.scale.x = hand.arm.width / 2;
				armMesh.scale.z = hand.arm.width / 2;
			}
		})
		// these two LeapJS plugins, handHold and handEntry are available from leapjs-plugins, included above.
		// handHold provides hand.data
		// handEntry provides handFound/handLost events.
		.use('handHold')
		.use('handEntry')
		.on('handFound', function(hand) {
			
			hand.fingers.forEach(function(finger,fingerIndex) {
				let boneMeshes = [];
				let jointMeshes = [];
				finger.bones.forEach(function(bone, index, array) {
					// create joints
					// CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
					// console.log(bone.length);
					let boneType;
					

					if (index === 3 ){
						boneType = new THREE.CylinderGeometry(10,6.9,bone.length,32,2)
					}
					else if (index === 0 ){
						if (fingerIndex !==0){
							boneType = new THREE.CylinderGeometry(25,13,bone.length,32,2)
						}
					}
					else if (index === 1){
						boneType = new THREE.CylinderGeometry(13,11,bone.length,32,2)	
					}	
					else {
						boneType = new THREE.CylinderGeometry(10, 10, bone.length,80)
					}
					if (fingerIndex === 0 ){
						if (index === 1) {
							boneType = new THREE.CylinderGeometry(20,13,bone.length,32,2)
						}
						if (index === 2) {
							boneType = new THREE.CylinderGeometry(13,10,bone.length,32,2)
						}
						
					}
					let boneMesh = new THREE.Mesh(
						boneType,
						new THREE.MeshStandardMaterial({metalness: 0.9, roughness: 0.4, color:0x450000, envMap: textureCube})
					);
					scene.add(boneMesh);
					boneMeshes.push(boneMesh);
				});
				for (let i = 0; i < finger.bones.length + 1; i++) {
					let jointMeshGeometryParam = 9.5,
						material = new THREE.MeshStandardMaterial({metalness: 0.4, roughness: 0.6, color:0x010101});
					if (i === 4) {
						jointMeshGeometryParam = 6.8;
						material = new THREE.MeshStandardMaterial({metalness: 0.9, roughness: 0.4, color:0x450000, envMap: textureCube});
					}
					if (i === 3) {
						jointMeshGeometryParam = 9;
					}
					else if (i === 0) {
						jointMeshGeometryParam = 24;
					}
					else if(i === 1) {
						jointMeshGeometryParam = 12.2;	
					}
					let jointMesh = new THREE.Mesh(
						new THREE.SphereGeometry(jointMeshGeometryParam,20,20),
						material
					);
					scene.add(jointMesh);
					jointMeshes.push(jointMesh);
				}
				finger.data('boneMeshes', boneMeshes);
				finger.data('jointMeshes', jointMeshes);
			});
			console.log(hand)
			// console.log(hand);
			if (hand.arm) { // 2.0.3+ have arm api,
				// CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
				let armMesh = new THREE.Mesh(
					new THREE.CylinderGeometry(2.5,.9,hand.arm.length + 10,32,2),
					new THREE.MeshStandardMaterial({metalness: 0.8, roughness: 0.5, color:0x8c0000, envMap: textureCube})
				);
				armMesh.material.color.setHex(0xffffff);
				scene.add(armMesh);
				hand.data('armMesh', armMesh);
			}
			
		})
		.on('handLost', function(hand) {
			console.log('Hand lost');
			hand.fingers.forEach(function(finger) {

				let boneMeshes = finger.data('boneMeshes');
				let jointMeshes = finger.data('jointMeshes');

				boneMeshes.forEach(function(mesh) {
					scene.remove(mesh);
				});

				jointMeshes.forEach(function(mesh) {
					scene.remove(mesh);
				});

				finger.data({
					boneMeshes: null,
					boneMeshes: null
				});

			});
			let armMesh = hand.data('armMesh');
			scene.remove(armMesh);
			hand.data('armMesh', null);
		})
		.connect();
};