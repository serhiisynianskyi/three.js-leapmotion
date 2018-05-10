"use strict";
window.onload = function() {
	let canvas = document.getElementById('canvas');
	let scene = new THREE.Scene();
	let camera, renderer, light, controls, stats, textureCube;

	function initScene() {
		camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas }); // antialias - сглаживаем ребра
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

	let videosArray = [],
		videoWidth = 300,
		catalogueMesh = new THREE.Group();
	// video.src = "video3.webm";
	// video.load(); // must call after setting/changing source
	// video.play();

	let videosCatalogue = [{
			name: "media/video1.mp4",
			position: [0, 0, videoWidth],
			rotation: 0
		},
		{
			name: "media/video2.webm",
			position: [videoWidth, 0, 0],
			rotation: 90
		},
		{
			name: "media/video3.mp4",
			position: [0, 0, -videoWidth],
			rotation: 180
		},
		{
			name: "media/video4.webm",
			position: [-videoWidth, 0, 0],
			rotation: 270
		}
	]

	function createCatalogue() {
		for (let video in videosCatalogue) {
			createVideos(videosCatalogue[video])
		}
		catalogueMesh.position.set(0, 0,-300)
		scene.add(catalogueMesh);
		videosArray[0].play();
	}

	function createVideos(videoItem) {
		let video = document.createElement('video');
		video.src = videoItem.name;
		video.load();
		catalogueMesh.add(createVideoMesh(video, videoItem));
		videosArray.push(video);
	}

	function createVideoMesh(video, videoItem) {
		let texture = new THREE.VideoTexture(video);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		let videoMaterial = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5, side: THREE.DoubleSide }),
			videoGeometry = new THREE.PlaneGeometry(videoWidth * 2, videoWidth * 1.2, 4, 4),
			videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
		videoMesh.position.set(...videoItem.position)
		videoMesh.rotation.y = (videoItem.rotation * Math.PI) / 180;
		return videoMesh;
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

	stats = new Stats();
	document.body.appendChild(stats.dom);

	initScene();
	addLights();
	createSceneBackground();
	createCatalogue();
	rendering();

	controls = new THREE.OrbitControls(camera);
	// stats = new Stats();
	// window.fps.appendChild(stats.dom);

	function rendering() {
		requestAnimationFrame(rendering);
		renderer.render(scene, camera);
		stats.begin();
		stats.end();
	};

	window.addEventListener('resize', function(e) {
		resize();
	});

	let baseBoneRotation = (new THREE.Quaternion).setFromEuler(
		new THREE.Euler(Math.PI / 2, 0, 0)
	);
	let armRotation = (new THREE.Quaternion).setFromEuler(
		new THREE.Euler(Math.PI / 2, 0, 0)
	);
	let giftBump = new THREE.TextureLoader().load('images/5.jpg');
	//https://developer.leapmotion.com/gallery/bone-hands -- plugin
	let convertedRotationMatrix;
	Leap.loop({ background: false }, {
			hand: function(hand) {
				hand.fingers.forEach(function(finger) {
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
				let engineBodyMesh = hand.data('engineBodyMesh');
				let convertedPositionMatrix = hand.fingers[2].bones[0].center().map(function(value) {
					return value;
				});
				convertedPositionMatrix[1] = convertedPositionMatrix[1] - 50;
				engineBodyMesh.position.fromArray(convertedPositionMatrix);

				let convertedRotationMatrix = hand.fingers[2].bones[0].matrix().map(function(value) {
					return value;
				});
				// console.log(convertedRotationMatrix)
				// convertedRotationMatrix = new THREE.Matrix4).fromArray(convertedRotationMatrix);
				// convertedRotationMatrix[12] = convertedRotationMatrix[12] *2;
				// console.log(hand.palmNormal)
				// convertedRotationMatrix.makeRotationAxis(new THREE.Vector3(hand.palmNormal).normalize(),(90 * 3.14 / 180));
				// convertedRotationMatrix = (new THREE.Matrix4).fromArray(convertedRotationMatrix)
				// convertedRotationMatrix = convertedRotationMatrix.makeRotationAxis(hand.palmNormal,90 * 3.14 / 180)
				// convertedRotationMatrix.setPosition(new THREE.Vector3(2, 1, 2))
				// convertedRotationMatrix.transpose();
				// console.log(convertedRotationMatrix)
				// engineBodyMesh.setRotationFromMatrix(
				// 	convertedRotationMatrix
				// );
				// engineBodyMesh.quaternion.multiply(armRotation);
				// debugger
				// armMesh.position.fromArray(hand.arm.center());
				// armMesh.position.fromArray(hand.palmPosition);
				// armMesh.rotation.fromArray(hand.palmNormal);

				// console.log(hand.palmNormal)
				// armMesh.setRotationFromMatrix(
				// 	(new THREE.Matrix4).fromArray(hand.arm.matrix())
				// );
				// armMesh.quaternion.multiply(baseBoneRotation);
				// armMesh.scale.x = hand.arm.width / 2;
				// armMesh.scale.z = hand.arm.width / 2;
			}
		})
		// these two LeapJS plugins, handHold and handEntry are available from leapjs-plugins, included above.
		// handHold provides hand.data
		// handEntry provides handFound/handLost events.
		.use('handHold')
		.use('handEntry')
		.on('handFound', function(hand) {
			let engine = [],
				engineBodyMesh,
				armMesh;
			hand.fingers.forEach(function(finger, fingerIndex) {
				let boneMeshes = [],
					jointMeshes = [];

				finger.bones.forEach(function(bone, index, array) {
					// create joints
					// CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
					// console.log(bone.length);
					let boneType;
					if (index === 3) {
						boneType = new THREE.CylinderGeometry(10, 6.9, bone.length, 32, 2)
					} else if (index === 0) {
						if (fingerIndex !== 0) {
							boneType = new THREE.CylinderGeometry(25, 13, bone.length, 32, 2)
						}
					} else if (index === 1) {
						boneType = new THREE.CylinderGeometry(13, 11, bone.length, 32, 2)
					} else {
						boneType = new THREE.CylinderGeometry(10, 10, bone.length, 80)
					}
					if (fingerIndex === 0) {
						if (index === 1) {
							boneType = new THREE.CylinderGeometry(20, 13, bone.length, 32, 2)
						}
						if (index === 2) {
							boneType = new THREE.CylinderGeometry(13, 10, bone.length, 32, 2)
						}

					}
					let boneMesh = new THREE.Mesh(
						boneType,
						new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x450000, envMap: textureCube })
					);
					scene.add(boneMesh);
					boneMeshes.push(boneMesh);
				});
				for (let i = 0; i < finger.bones.length + 1; i++) {
					let jointMeshGeometryParam = 9.5,
						material = new THREE.MeshStandardMaterial({ metalness: 0.4, roughness: 0.6, color: 0x010101 });
					if (i === 4) {
						jointMeshGeometryParam = 6.8;
						material = new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x450000, envMap: textureCube });
					}
					if (i === 3) {
						jointMeshGeometryParam = 9;
					} else if (i === 0) {
						jointMeshGeometryParam = 24;
					} else if (i === 1) {
						jointMeshGeometryParam = 12.2;
					}
					let jointMesh = new THREE.Mesh(
						new THREE.SphereGeometry(jointMeshGeometryParam, 20, 20),
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
				armMesh = new THREE.Mesh(
					new THREE.CylinderGeometry(2.5, .9, hand.arm.length + 10, 32, 2),
					new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x450000, envMap: textureCube })
				);
				// armMesh.material.color.setHex(0xffffff);
				scene.add(armMesh);
				hand.data('armMesh', armMesh);
			}
			// add engine
			engineBodyMesh = new THREE.Mesh(
				new THREE.TorusBufferGeometry(30, 10, 16, 60),
				new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x007700, envMap: textureCube })
			);
			scene.add(engineBodyMesh);
			hand.data('engineBodyMesh', engineBodyMesh);

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