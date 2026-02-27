import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, mixer;
let robot, actions = {};
let keys = {};
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let clock = new THREE.Clock();

init();
animate();

function init() {

scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 20, 200);

camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0,8,25);

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambient = new THREE.AmbientLight(0xffffff,1);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff,2);
dir.position.set(10,20,10);
scene.add(dir);

loadRobot();

window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);
window.addEventListener("resize", onResize);

}

function loadRobot(){
const loader = new GLTFLoader();
loader.load("assets/robot.glb", (gltf)=>{

robot = gltf.scene;
scene.add(robot);

mixer = new THREE.AnimationMixer(robot);

gltf.animations.forEach((clip)=>{
actions[clip.name] = mixer.clipAction(clip);
});

if(actions["Idle"]) actions["Idle"].play();

document.getElementById("loadingScreen").style.display="none";

});
}

function updateMovement(delta){

if(!robot) return;

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

if(actions["Walk"]){
actions["Idle"]?.stop();
actions["Walk"].play();
}

}else{

velocity.lerp(new THREE.Vector3(0,0,0),0.1);
robot.position.addScaledVector(velocity,delta);

if(actions["Walk"]){
actions["Walk"].stop();
actions["Idle"]?.play();
}

}

}

function animate(){
requestAnimationFrame(animate);
let delta = clock.getDelta();
if(mixer) mixer.update(delta);
updateMovement(delta);
renderer.render(scene,camera);
}

function onResize(){
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);
}
