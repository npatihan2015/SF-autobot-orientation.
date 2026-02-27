import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, mixer;
let robot, skeleton;
let clock = new THREE.Clock();
let assemblyProgress = 0;
let assemblyComplete = false;
let keys = {};
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let idleAction, walkAction, activeAction;

init();
animate();

function init(){

scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 20, 200);

camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0,5,35);

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.AmbientLight(0x220000,0.5));

const redLight = new THREE.PointLight(0xff0000,3,100);
redLight.position.set(0,15,0);
scene.add(redLight);

loadRobot();

window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);
window.addEventListener("resize", onResize);

}

function loadRobot(){

const loader = new GLTFLoader();

loader.load("assets/gipsy_danger.glb",(gltf)=>{

robot = gltf.scene;
robot.position.y = -20; // start underground
scene.add(robot);

mixer = new THREE.AnimationMixer(robot);

if(gltf.animations.length >= 2){
idleAction = mixer.clipAction(gltf.animations[0]);
walkAction = mixer.clipAction(gltf.animations[1]);
activeAction = idleAction;
}

});
}

function updateAssembly(delta){

if(!robot) return;

if(assemblyComplete) return;

assemblyProgress += delta * 0.2;

if(assemblyProgress < 1){
robot.position.y = -20 + (assemblyProgress * 20);
}

if(assemblyProgress >= 1){
assemblyComplete = true;
activateRobot();
}

}

function activateRobot(){

scene.background = new THREE.Color(0x001111);

if(idleAction){
idleAction.play();
activeAction = idleAction;
}

showActivationOverlay();

}

function showActivationOverlay(){

let overlay = document.createElement("div");
overlay.style.position="fixed";
overlay.style.top="0";
overlay.style.left="0";
overlay.style.width="100%";
overlay.style.height="100%";
overlay.style.background="black";
overlay.style.color="#00ffff";
overlay.style.display="flex";
overlay.style.flexDirection="column";
overlay.style.alignItems="center";
overlay.style.justifyContent="center";
overlay.style.fontSize="40px";
overlay.innerHTML="⚠ WELCOME TO SANFUN GROUP<br>A Million Lives • A Million Dreams";

document.body.appendChild(overlay);

setTimeout(()=>overlay.remove(),4000);

}

function updateMovement(delta){

if(!assemblyComplete || !robot) return;

direction.set(0,0,0);

if(keys["w"]) direction.z-=1;
if(keys["s"]) direction.z+=1;
if(keys["a"]) direction.x-=1;
if(keys["d"]) direction.x+=1;

if(direction.length()>0){

direction.normalize();
velocity.lerp(direction.multiplyScalar(5),0.1);
robot.position.addScaledVector(velocity,delta);
robot.rotation.y = Math.atan2(velocity.x, velocity.z);

if(walkAction && activeAction !== walkAction){
activeAction.fadeOut(0.3);
walkAction.reset().fadeIn(0.3).play();
activeAction = walkAction;
}

}else{

velocity.lerp(new THREE.Vector3(0,0,0),0.1);
robot.position.addScaledVector(velocity,delta);

if(idleAction && activeAction !== idleAction){
activeAction.fadeOut(0.3);
idleAction.reset().fadeIn(0.3).play();
activeAction = idleAction;
}

}

}

function animate(){

requestAnimationFrame(animate);

let delta = clock.getDelta();

if(mixer) mixer.update(delta);

updateAssembly(delta);
updateMovement(delta);

renderer.render(scene,camera);

}

function onResize(){

camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);

}
