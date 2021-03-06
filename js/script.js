"use strict";
window.onload = function() {
	let canvas = document.getElementById('canvas'),
		scene = new THREE.Scene(),
		camera, renderer, light, controls, stats, textureCube,
		fingers = [],
		isCatalogueCreated = false,
		currentPlayingVideo;

	function initScene() {
		camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 9000);
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas }); // antialias - сглаживаем ребра
		camera.position.set(0, 600, 800);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		// renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
		renderer.setSize(window.innerWidth, window.innerHeight - 5);
		renderer.gammaInput = renderer.gammaOutput = true;
		renderer.toneMapping = THREE.LinearToneMapping;
		// renderer.toneMappingExposure = 1;
		renderer.setClearColor(0xffffff);
		textureCube = new THREE.CubeTextureLoader()
			.setPath('./cube/dark_dust/')
			.load(['sleepyhollow_ft.jpg', 'sleepyhollow_bk.jpg', 'sleepyhollow_up.jpg', 'sleepyhollow_dn.jpg', 'sleepyhollow_rt.jpg', 'sleepyhollow_lf.jpg']);
	}

	let videosArray = [],
		videoWidth = 500,
		catalogueMesh = new THREE.Group(),

		videosCatalogue = [{
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
		if (!isCatalogueCreated) {
			for (let video in videosCatalogue) {
				createVideos(videosCatalogue[video], video)
			}
			catalogueMesh.position.set(0, 400, -650)
			catalogueMesh.rotation.set(0, Math.PI / 2, 0)
			scene.add(catalogueMesh);
			isCatalogueCreated = true;
		}

	}

	function createVideos(videoItem, index) {
		let video = document.createElement('video');
		video.src = videoItem.name;
		video.load();
		catalogueMesh.add(createVideoMesh(video, videoItem, index));
		videosArray.push(video);
	}

	function createVideoMesh(video, videoItem, index) {
		let texture = new THREE.VideoTexture(video);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		let videoMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
			videoGeometry = new THREE.PlaneGeometry(videoWidth * 2, videoWidth * 1.2, 1, 1),
			videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
		videoMesh.position.set(...videoItem.position)
		videoMesh.rotation.y = (videoItem.rotation * Math.PI) / 180;
		videoMesh.videoIndex = index;
		return videoMesh;
	}

	function resize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		renderer.setSize(window.innerWidth - 5, window.innerHeight - 5);
		camera.updateProjectionMatrix()
	}

	function playVideo(index) {
		if (index !== currentPlayingVideo) {
			videosArray.forEach(function(item) {
				item.pause();
			});
			videosArray[index].play();
			currentPlayingVideo = index;
		}
	}

	function detectCollision() {
		if (fingers.length !== 0) {
			fingers.forEach(function(finger) {
				let originPoint = finger.position.clone();
				if (finger.geometry.vertices) {
					for (let vertexIndex = 0; vertexIndex < finger.geometry.vertices.length; vertexIndex++) {
						let localVertex = finger.geometry.vertices[vertexIndex].clone(),
							globalVertex = localVertex.applyMatrix4(finger.matrix),
							directionVector = localVertex.sub(finger.position),
							ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize()),
							collisionResults = ray.intersectObjects(catalogueMesh.children);
						if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
							playVideo(collisionResults[0].object.videoIndex);
					}
				}
			});
		};
	}

	function addLights() {
		light;
		let d = 900;
		light = new THREE.DirectionalLight(0xdfebff, 1.1);
		light.position.set(100, 500, -650);
		light.position.multiplyScalar(1.3);
		light.castShadow = true;
		light.shadow.mapSize.width = 256;
		light.shadow.mapSize.height = 256;
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
		scene.add(cubeMesh);
	}

	stats = new Stats();
	document.body.appendChild(stats.dom);

	initScene();
	addLights();
	createSceneBackground();
	rendering();

	controls = new THREE.OrbitControls(camera);
	camera.lookAt(0, 250, 0);
	controls.target.z = -500;

	function rendering() {
		requestAnimationFrame(rendering);
		renderer.render(scene, camera);
		stats.begin();
		stats.end();
		detectCollision();
	};

	function rotateCatalogue(hand) {
		if (hand._rotation[4] < 0) {
			catalogueMesh.rotation.y = catalogueMesh.rotation.y - 0.03;
		} else {
			catalogueMesh.rotation.y = catalogueMesh.rotation.y + 0.03;
		}
	}

	window.addEventListener('resize', function(e) {
		resize();
	});
	window.addEventListener('keypress', function(e) {
		if (e.keyCode === 32) { // Space
			createCatalogue();
		}
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
	Leap.loop({ background: false, enableGestures: true },
			function(frame) {
				// debugger
				// console.log(frame);
				// if (frame.valid && frame.gestures.length > 0) {
				// 	frame.gestures.forEach(function(gesture) {
				// 		switch (gesture.type) {
				// 			case "circle":
				// 				console.log("Circle Gesture");
				// 				break;
				// 			case "keyTap":
				// 				console.log("Key Tap Gesture");
				// 				break;
				// 			case "screenTap":
				// 				console.log("Screen Tap Gesture");
				// 				break;
				// 			case "swipe":
				// 				console.log("Swipe Gesture");
				// 				break;
				// 		}
				// 	});
				// }
				frame.hands.forEach(function(hand) {
					// debugger
					if (hand.type === "left" && hand.pinchStrength > 0.7) {
						rotateCatalogue(hand);
					}

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
				})
				// {
				// 	hand: function(hand) {
				// 		hand.fingers.forEach(function(finger) {
				// 			finger.data('boneMeshes').forEach(function(mesh, i) {
				// 				let bone = finger.bones[i];
				// 				mesh.position.fromArray(bone.center());
				// 				mesh.setRotationFromMatrix(
				// 					(new THREE.Matrix4).fromArray(bone.matrix())
				// 				);
				// 				mesh.quaternion.multiply(baseBoneRotation);
				// 			});
				// 			finger.data('jointMeshes').forEach(function(mesh, i) {
				// 				let bone = finger.bones[i];
				// 				if (bone) {
				// 					mesh.position.fromArray(bone.prevJoint);
				// 				} else {
				// 					// special case for the finger tip joint sphere:
				// 					bone = finger.bones[i - 1];
				// 					mesh.position.fromArray(bone.nextJoint);
				// 				}
				// 			});
				// 		});
				// 		let engineBodyMesh = hand.data('engineBodyMesh');
				// 		let convertedPositionMatrix = hand.fingers[2].bones[0].center().map(function(value) {
				// 			return value;
				// 		});
				// 		convertedPositionMatrix[1] = convertedPositionMatrix[1] - 50;
				// 		engineBodyMesh.position.fromArray(convertedPositionMatrix);

				// 		let convertedRotationMatrix = hand.fingers[2].bones[0].matrix().map(function(value) {
				// 			return value;
				// 		});
				// 		// console.log(convertedRotationMatrix)
				// 		// convertedRotationMatrix = new THREE.Matrix4).fromArray(convertedRotationMatrix);
				// 		// convertedRotationMatrix[12] = convertedRotationMatrix[12] *2;
				// 		// console.log(hand.palmNormal)
				// 		// convertedRotationMatrix.makeRotationAxis(new THREE.Vector3(hand.palmNormal).normalize(),(90 * 3.14 / 180));
				// 		// convertedRotationMatrix = (new THREE.Matrix4).fromArray(convertedRotationMatrix)
				// 		// convertedRotationMatrix = convertedRotationMatrix.makeRotationAxis(hand.palmNormal,90 * 3.14 / 180)
				// 		// convertedRotationMatrix.setPosition(new THREE.Vector3(2, 1, 2))
				// 		// convertedRotationMatrix.transpose();
				// 		// console.log(convertedRotationMatrix)
				// 		// engineBodyMesh.setRotationFromMatrix(
				// 		// 	convertedRotationMatrix
				// 		// );
				// 		// engineBodyMesh.quaternion.multiply(armRotation);
				// 		// debugger
				// 		// armMesh.position.fromArray(hand.arm.center());
				// 		// armMesh.position.fromArray(hand.palmPosition);
				// 		// armMesh.rotation.fromArray(hand.palmNormal);

				// 		// console.log(hand.palmNormal)
				// 		// armMesh.setRotationFromMatrix(
				// 		// 	(new THREE.Matrix4).fromArray(hand.arm.matrix())
				// 		// );
				// 		// armMesh.quaternion.multiply(baseBoneRotation);
				// 		// armMesh.scale.x = hand.arm.width / 2;
				// 		// armMesh.scale.z = hand.arm.width / 2;
				// 	}
				// }
			})
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
					if (fingerIndex === 1 && index === 3) { // Direct finger
						boneMesh['parentHand'] = hand.type;
						fingers.push(boneMesh);
					}
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
			if (hand.arm) { // 2.0.3+ have arm api,
				armMesh = new THREE.Mesh(
					new THREE.CylinderGeometry(2.5, .9, hand.arm.length + 10, 32, 2),
					new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x450000, envMap: textureCube })
				);
				// armMesh.material.color.setHex(0xffffff);
				// scene.add(armMesh);
				hand.data('armMesh', armMesh);
			}
			// add engine
			engineBodyMesh = new THREE.Mesh(
				new THREE.TorusBufferGeometry(30, 10, 16, 60),
				new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.4, color: 0x007700, envMap: textureCube })
			);
			// scene.add(engineBodyMesh);
			hand.data('engineBodyMesh', engineBodyMesh);

		})
		.on('handLost', function(hand) {
			console.log('Hand lost');
			hand.fingers.forEach(function(finger) {
				let boneMeshes = finger.data('boneMeshes'),
					jointMeshes = finger.data('jointMeshes');

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
			fingers.forEach(function(finger) {
				if(hand.type === finger.parentHand){
					fingers.splice(finger, 1);
				}
			});
			let armMesh = hand.data('armMesh');
			scene.remove(armMesh);
			hand.data('armMesh', null);
		})
		.connect();
};