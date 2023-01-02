import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js'

const searchParameters = document.getElementById("search-parameters");
searchParameters.style.display = "none";
const searchResults = document.getElementById("search-results");
searchResults.style.display = "none";
const loadingMessage = document.getElementById("loading-message");
loadingMessage.style.display = "flex";

/*     DATA */
var data;
var dataCells = [];

const scene = new THREE.Scene();

const background = new THREE.Color(0x9dbef5);
scene.background = (background);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.setZ(30);

//HDRI
new RGBELoader()
  .load('kloppenheim_06_puresky_4k.hdr', function (texture) {

    texture.mapping = THREE.EquirectangularReflectionMapping;

    //scene.background = texture;
    scene.environment = texture;

    renderer.render(scene, camera);
  });

//Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  antialias: true
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1;

renderer.render(scene, camera);


//Orbit Control
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();


const ballGeometry = new THREE.SphereGeometry(0.1, 32, 16, 100);
const material = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: false });
const ball = new THREE.Mesh(ballGeometry, material);

scene.add(ball);

const loader = new GLTFLoader();

var abb = "AZ";

var stadium;
loader.load(`models/Stadium_${abb}.glb`, function (model) {
  stadium = model.scene;
  stadium.castShadow = true;
  stadium.receiveShadow = true;
  stadium.name = "stadium-mlb"
  scene.add(stadium);
  renderer.render(scene, camera);
  loadingMessage.style.display = "none";
});

const light = new THREE.AmbientLight(0xffffff, 5);
light.position.y = 10;

scene.add(light);

//1 foot is 19.4 units in 3.js
const SCALE = 19.4 / 90;
const DISTANCE_SCALE = 182 / 128;

//Mathy Stuff
var moving = false;

//Distance & Height when batted
var initialHeight = 2.23;
var hitDistance = 383 * DISTANCE_SCALE;

const gravity = 32.174 * SCALE;

//Radians ofc =D
var launch_angle = 0.4188790;

//Feet per second
var launch_speed_fts = 100.2 * 5280 / 3600;

var spray;


//Mystery numbers haha
var hc_x = -93.7124460;
var hc_y = 374.30074;

/*var curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0)
]);*/

var stadiumIds = [
  /*Ari*/ "15%7C",
  /*Atl*/ "4705%7C",
  /*Bal*/ "2%7C",
  /*Bos*/ "3%7C",
  /*Chc*/ "17%7C",
  /*Cin*/ "2602%7C",
  /*Cle*/ "5%7C",
  /*Col*/ "19%7C",
  /*Cws*/ "4%7C",
  /*Det*/ "2394%7C",
  /*Hou*/ "2392%7C",
  /*Kc*/ "7%7C",
  /*Laa*/ "1%7C",
  /*Lad*/ "22%7C",
  /*Mia*/ "4169%7C",
  /*Mil*/ "32%7C",
  /*Min*/ "3312%7C",
  /*Nym*/ "3289%7C",
  /*Nyy*/ "3313%7C",
  /*Oak*/ "10%7C",
  /*Phi*/ "2681%7C",
  /*Pit*/ "31%7C",
  /*Sd*/ "2680%7C",
  /*Sea*/ "680%7C",
  /*Sf*/ "2395%7C",
  /*Stl*/ "2889%7C",
  /*Tb*/ "12%7C",
  /*Tex*/ "5325%7C",
  /*Tor*/ "14%7C",
  /*Wsh*/ "3309%7C",
  /*None*/ ""
]

var playerRows;

Papa.parse("player-map.csv", {
  download: true,
  complete: function (results) {
    playerRows = results.data;
    for (var i = 1; i < results.data.length; i++) {
      var temp = document.createElement("option");
      temp.value = i;
      temp.innerText = results.data[i][1];
      document.getElementById("player-select-search").append(temp);
    }
  }
});

function getHit() {
  var hc_x_ = hc_x - 125.42;
  var hc_y_ = 198.27 - hc_y;
  var launch_speed_y = launch_speed_fts * Math.sin(launch_angle) * SCALE;

  spray = Math.atan(hc_x_ / hc_y_) * -180 / Math.PI * 1;

  if (spray > 44.75) {
    spray = 44.75;
  } else if (spray < -44.75) {
    spray = -44.75;
  }

  console.log("Spray Angle: " + spray);
  //Total Hang Time
  var total_time = (launch_speed_y + Math.sqrt(Math.pow(launch_speed_y, 2) + (2 * gravity * initialHeight))) / gravity;

  ball.position.y = initialHeight * SCALE;

  var landingGeometry = new THREE.SphereGeometry(0.5, 32, 16, 100);
  const landing = new THREE.Mesh(landingGeometry, material);

  landing.name = "landing";
  scene.add(landing);

  landing.position.z = Math.cos(convert(spray)) * hitDistance * SCALE * -1;
  landing.position.y = 0;
  landing.position.x = Math.sin(convert(spray)) * hitDistance * SCALE * -1;

  var maxHeight = (-16.085 * Math.pow(total_time, 2)) + (launch_speed_fts * Math.sin(launch_angle) * (total_time / 2)) + (initialHeight * 2);
  console.log("Maximum Height: " + maxHeight);

  const bezier = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(landing.position.x / 2, maxHeight * SCALE * -1 * DISTANCE_SCALE, landing.position.z / 2),
    new THREE.Vector3(landing.position.x, landing.position.y, landing.position.z)
  );

  /*curve.points.push(new THREE.Vector3(landing.position.x / 2, 100 * SCALE, landing.position.z / 2));
  curve.points.push(new THREE.Vector3(landing.position.x, landing.position.y, landing.position.z));*/

  const points = bezier.getPoints(50);
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

  const curveMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 100,
    linecap: 'round', //ignored by WebGLRenderer
    linejoin: 'round' //ignored by WebGLRenderer
  });

  const curveObject = new THREE.Line(curveGeometry, curveMaterial);
  curveObject.name = "curve";
  scene.add(curveObject);
}




function animate() {
  requestAnimationFrame(animate);

  /*camera.position.x = ball.position.x/4;
  camera.position.y = ball.position.y +4;
  camera.position.z = ball.position.z/2 + 10;

  camera.lookAt(ball.position);*/

  /*if (moving) {
    camera.lookAt(ball.position);

    ball.position.z -= (launch_speed_x * Math.cos(convert(spray))) / 10;
    ball.position.x -= (launch_speed_x * Math.sin(convert(spray))) / 10;
    ball.position.y += launch_speed_y / 10;
    launch_speed_y -= gravity / 10;

    curve.points.push(new THREE.Vector3(ball.position.x, ball.position.y, ball.position.z));
  }

  //Done, create arc
  if (ball.position.y < 0) {
    moving = false;



    // Create the final object to add to the scene
    const points = curve.getPoints(50);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const curveObject = new THREE.Line(curveGeometry, material);
    scene.add(curveObject);


    console.log(Math.sqrt(Math.pow(ball.position.x, 2) + Math.pow(ball.position.z, 2)));
  }*/

  renderer.render(scene, camera);
}

animate();

function convert(deg) {
  return deg * (Math.PI / 180);
}

//New Stadium
function swapStadium(manual) {
  loadingMessage.style.display = "flex";

  if (manual) {
    abb = document.getElementById("stadium-select").value;
  }

  var selectedObject = scene.getObjectByName("stadium-mlb");
  scene.remove(selectedObject);

  loader.load(`models/Stadium_${abb}.glb`, function (model) {
    stadium = model.scene;
    stadium.name = "stadium-mlb"
    scene.add(stadium);
    renderer.render(scene, camera);
    loadingMessage.style.display = "none";
  });
}

//Stadium Select
document.getElementById("stadium-select").addEventListener("change", function () {
  swapStadium(true);
});

//New Hit Button
document.getElementById("new-hit").addEventListener("click", function () {
  searchParameters.style.display = "flex";
});

function statcast_search() {
  loadingMessage.style.display = "flex";

  //Remove old curve & Landing
  scene.remove(scene.getObjectByName("curve"));
  scene.remove(scene.getObjectByName("landing"));

  searchParameters.style.display = "none";
  console.log("Fetching data...");

  var whichStadium = 30;

  if (document.getElementById("stadium-select-search").value != "void") {
    whichStadium = parseInt(document.getElementById("stadium-select-search").value);
  }

  var year = parseInt(document.getElementById("year-select-search").value);

  var playerId = parseInt(document.getElementById("player-select-search").value);

  var playerTeam = "";


  if(playerId != -1) {
    playerTeam = playerRows[parseInt(document.getElementById("player-select-search").value)][5];
    console.log("That player plays on " + playerTeam);
  }

  if(playerTeam == "CHW") {
    playerTeam = "CWS";
  }

  if(playerTeam == "ARI") {
    playerTeam = "AZ";
  }

  if(playerTeam == "WAS") {
    playerTeam = "WSH";
  }

  //console.log("Requested URL: " + `https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=single%7Cdouble%7Ctriple%7Chome%5C.%5C.run%7Cfield%5C.%5C.out%7C&hfGT=R%7C&hfPR=&hfZ=&hfStadium=${stadiumIds[whichStadium]}&hfBBL=7%7C8%7C9%7C&hfNewZones=&hfPull=&hfC=&hfSea=${year}%7C&hfSit=&player_type=batter&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=${playerTeam}%7C&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=fly%5C.%5C.ball%7Cline%5C.%5C.drive%7C&hfFlag=&metric_1=&group_by=name-date&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=detals#results`);

  dataCells = [];

  searchResults.innerHTML = "";
  var title = document.createElement("h1");
  title.innerText = "Search Results";
  searchResults.appendChild(title);

  var outcomeSelect = document.getElementById("outcome-select-search").value;

  Papa.parse(`https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=${outcomeSelect}&hfGT=R%7C&hfPR=&hfZ=&hfStadium=${stadiumIds[whichStadium]}&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSea=${year}%7C&hfSit=&player_type=batter&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=${playerTeam}%7C&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=fly%5C.%5C.ball%7Cline%5C.%5C.drive%7C&hfFlag=&metric_1=&group_by=name-date&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=detals#results`, {
    download: true,
    complete: function (results) {
      data = results;
      searchResults.style.display = "flex";
      var dataCount = 0;
      for (var i = 1; i < data.data.length; i++) {
        var temp = document.createElement("div");
        temp.className = "result-cell";
        var hitResult = "Out";
        switch (data.data[i][8]) {
          case "home_run":
            hitResult = "HR";
            break;
          case "single":
            hitResult = "1B";
            break;
          case "double":
            hitResult = "2B";
            break;
          case "triple":
            hitResult = "3B";
            break;
          default:
            break;
        }
        temp.innerText = data.data[i][1] + " | " + hitResult + " | " + data.data[i][15] + " | " + results.data[i][20] + " at " + results.data[i][19] + " | " + results.data[i][52] + "ft";
        temp.id = i;
        temp.onclick = function () {
          searchResults.style.display = "none";
          selectIndex(data, this.id);
        }
        if (data.data[i][6] == playerRows[playerId][10] || playerId == -1) {
          if (data.data[i][52] > 300) {
            dataCount++;
            searchResults.appendChild(temp);
          }
        }
      }
      if (dataCount < 1) {
        alert("No data Found");
        searchResults.style.display = "none";
      }
      loadingMessage.style.display = "none";
    }
  });
}

function selectIndex(results, index) {
  console.log(results.data[index]);
  abb = results.data[index][19];
  swapStadium(false);
  initialHeight = results.data[index][30] * DISTANCE_SCALE*3;
  hitDistance = results.data[index][52] * DISTANCE_SCALE;
  hc_x = results.data[index][37];
  hc_y = results.data[index][38];
  launch_speed_fts = results.data[index][53] * 5280 / 3600;
  launch_angle = results.data[index][54] * Math.PI / 180;
  console.log("Launch Angle: " + launch_angle);
  getHit();
}

document.getElementById("search-button").addEventListener("click", function () {
  statcast_search();
})

window.addEventListener('resize', () => {

  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})
