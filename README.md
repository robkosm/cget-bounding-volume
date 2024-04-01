# three-kdop

## setup

`git clone https://github.com/robkosm/three-kdop`

`cd three-kdop`

`npm i`

`npm run build`

serve the `./dist` folder using any local webserver, e.g. [VSCode Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

## basic example

```
import * as THREE from 'three';
import DOP from "./DOP";
import DOPHelper from "./DOPHelper";

// create a scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// add a geometry
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

// create a 14-DOP from the geometry
const dop = new DOP(14);
dop.expandByObject(geometry, false);
const dopHelper = new DOPHelper(dop);
scene.add( dopHelper );

```
