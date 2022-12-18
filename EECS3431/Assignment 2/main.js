// Template code for A2 Fall 2021 -- DO NOT DELETE THIS LINE

var canvas;
var gl;

var program ;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(3, 14, 14);
var at = vec3(-2, 5, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;
var prevTime = 0.0 ;
var useTextures = 1 ;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
	var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
	image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;



function isLoaded(im) {
	if (im.complete) {
		console.log("loaded") ;
		return true ;
	}
	else {
		console.log("still not loaded!!!!") ;
		return false ;
	}
}

function loadFileTexture(tex, filename)
{
	tex.textureWebGL  = gl.createTexture();
	tex.image = new Image();
	tex.image.src = filename ;
	tex.isTextureReady = false ;
	tex.image.onload = function() { handleTextureLoaded(tex); }
	// The image is going to be loaded asyncronously (lazy) which could be
	// after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
	tex.textureWebGL  = gl.createTexture();
	tex.image = new Image();
	//tex.image.src = "CheckerBoard-from-Memory" ;

	gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
				  gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap( gl.TEXTURE_2D );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
					 gl.NEAREST_MIPMAP_LINEAR );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER); //Prevents s-coordinate wrapping (repeating)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_BORDER); //Prevents t-coordinate wrapping (repeating)
	gl.bindTexture(gl.TEXTURE_2D, null);

	tex.isTextureReady = true ;

}

const TEXTURES_TO_LOAD = ["grass2.jpeg", "noiseTexture.png", "1_Basic.png", "2_Surprised.png", "3_Frustrated.png", "4_Sad.png", "5_Happy.png", "6_Scream.png", "stone.jpg"];
const GRASS = TEXTURES_TO_LOAD.indexOf("grass2.jpeg");
const NOISE = TEXTURES_TO_LOAD.indexOf("noiseTexture.png");
const STONE = TEXTURES_TO_LOAD.indexOf("stone.jpg");
const BASICFACE = TEXTURES_TO_LOAD.indexOf("1_Basic.png");
const SURPRISEDFACE = TEXTURES_TO_LOAD.indexOf("2_Surprised.png");
const FRUSTRATEDFACE = TEXTURES_TO_LOAD.indexOf("3_Frustrated.png");
const SADFACE = TEXTURES_TO_LOAD.indexOf("4_Sad.png");
const HAPPYFACE = TEXTURES_TO_LOAD.indexOf("5_Happy.png");
const SCREAMFACE = TEXTURES_TO_LOAD.indexOf("6_Scream.png");


function initTextures() {
	const TEX_DIR = "textures/";

	for(var i = 0; i < TEXTURES_TO_LOAD.length; i++)
	{
		textureArray.push({});
		loadFileTexture(textureArray[textureArray.length-1], TEX_DIR + TEXTURES_TO_LOAD[i]);
	}
	// textureArray.push({}) ;
	// loadFileTexture(textureArray[textureArray.length-1],"sunset.bmp") ;

	// textureArray.push({}) ;
	// loadFileTexture(textureArray[textureArray.length-1],"cubetexture.png") ;

	// textureArray.push({}) ;
	// loadImageTexture(textureArray[textureArray.length-1],image2) ;


}


function handleTextureLoaded(textureObj) {
	gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //Prevents s-coordinate wrapping (repeating)
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //Prevents t-coordinate wrapping (repeating)
	gl.bindTexture(gl.TEXTURE_2D, null);
	console.log(textureObj.image.src) ;

	textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
	ambientProduct = mult(lightAmbient, c);
	diffuseProduct = mult(lightDiffuse, c);
	specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv( gl.getUniformLocation(program,
										 "ambientProduct"),flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program,
										 "diffuseProduct"),flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program,
										 "specularProduct"),flatten(specularProduct) );
	gl.uniform4fv( gl.getUniformLocation(program,
										 "lightPosition"),flatten(lightPosition) );
	gl.uniform1f( gl.getUniformLocation(program,
										"shininess"),materialShininess );
}

function shaderTime(newtime)
{
	gl.uniform1f( gl.getUniformLocation(program, "vTime"), newtime);
	gl.uniform1f( gl.getUniformLocation(program, "fTime"), newtime);
}
function flipLight(bool)
{
	gl.uniform1f( gl.getUniformLocation(program, "vLight"), bool);
	gl.uniform1f( gl.getUniformLocation(program, "fLight"), bool);
}

function toggleTextures() {
	useTextures = 1 - useTextures ;
	gl.uniform1i( gl.getUniformLocation(program,
										 "useTextures"), useTextures );
}

function waitForTextures1(tex) {
	setTimeout( function() {
	console.log("Waiting for: "+ tex.image.src) ;
	wtime = (new Date()).getTime() ;
	if( !tex.isTextureReady )
	{
		console.log(wtime + " not ready yet") ;
		waitForTextures1(tex) ;
	}
	else
	{
		console.log("ready to render") ;
		window.requestAnimFrame(render);
	}
			   },5) ;

}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
	setTimeout( function() {
			   var n = 0 ;
			   for ( var i = 0 ; i < texs.length ; i++ )
			   {
					console.log("boo"+texs[i].image.src) ;
					n = n+texs[i].isTextureReady ;
			   }
			   wtime = (new Date()).getTime() ;
			   if( n != texs.length )
			   {
			   console.log(wtime + " not ready yet") ;
			   waitForTextures(texs) ;
			   }
			   else
			   {
			   console.log("ready to render") ;
			   window.requestAnimFrame(render);
			   }
			   },5) ;

}

window.onload = function init() {

	canvas = document.getElementById( "gl-canvas" );

	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.5, 0.5, 1.0, 1.0 );

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );


	// Load canonical objects and their attributes
	Cube.init(program);
	Cylinder.init(9,program);
	Cone.init(9,program) ;
	Sphere.init(36,program) ;

	gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

	// record the locations of the matrices that are used in the shaders
	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
	normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

	// set a default material
	setColor(materialDiffuse) ;



	// set the callbacks for the UI elements
	document.getElementById("sliderXi").oninput = function() {
		RX = this.value ;
		window.requestAnimFrame(render);
	};
	document.getElementById("sliderYi").oninput = function() {
		RY = this.value;
		window.requestAnimFrame(render);
	};
	document.getElementById("sliderZi").oninput = function() {
		RZ =  this.value;
		window.requestAnimFrame(render);
	};

	document.getElementById("animToggleButton").onclick = function() {
		if( animFlag ) {
			animFlag = false;
		}
		else {
			animFlag = true  ;
			resetTimerFlag = true ;
			window.requestAnimFrame(render);
		}
	};

	document.getElementById("textureToggleButton").onclick = function() {
		toggleTextures() ;
		window.requestAnimFrame(render);
	};

	var controller = new CameraController(canvas);
	controller.onchange = function(xRot,yRot) {
		RX = xRot ;
		RY = yRot ;
		window.requestAnimFrame(render); };

	// load and initialize the textures
	initTextures() ;

	// Recursive wait for the textures to load
	waitForTextures(textureArray) ;
	//setTimeout (render, 100) ;
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
	modelViewMatrix = mult(viewMatrix,modelMatrix) ;
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	normalMatrix = inverseTranspose(modelViewMatrix) ;
	gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
	setMV() ;

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
	setMV() ;
	Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
	setMV() ;
	Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
	setMV() ;
	Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
	setMV() ;
	Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
	modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
	modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
	modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
	modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
	MS.push(modelMatrix) ;
}

const BLUE = vec4(0.2, 0.2, 0.8, 1.0);
const RED = vec4(0.8, 0.2, 0.2, 1.0);
const BLADECOLOR = vec4(0.753, 0.753, 0.753, 1.0);
const SKINCOLOR = vec4(1.0, 0.8, 0.3, 1.0);

class person
{
	constructor()
	{
		this.position = new vec3(0, 0, 0)
		this.yrot = 0
		this.leftArm = 0
		this.rightArm = 0
		this.leftFore = 15
		this.rightFore = 15
		this.forefactor = 1.5;
		this.leftLeg = 0
		this.leftKnee = 0
		this.rightLeg = 0
		this.rightKnee = 0
		this.color = new vec4(BLUE);
		this.headrot = 0;

		// Facial Textures
		this.faceTex = BASICFACE; // Basic Face by Default
	}

	render()
	{
		// console.log("rendering person");
		gPush(); //.
		{
			const TORSOLENGTH = 1.5;
			const TORSOWIDTH = 1;
			const LEGLENGTH = 1;
			const HEIGHT = 1.5*(2*LEGLENGTH + TORSOLENGTH);
			const LEGWIDTH = 0.45;

			const ARMLENGTH = 0.8;
			const ARMWIDTH = 0.4;
			const FOREFACTOR = this.forefactor; //Factor for the forearm angle 

			const HEAD_DIA = 1;

			setColor(vec4(this.color));
			gTranslate(this.position[0], this.position[1]+HEIGHT, this.position[2]);
			gRotate(this.yrot, 0, 1, 0);
			gPush(); //Body
			{
				setColor(this.color);
				gPush();
					gScale(TORSOWIDTH, TORSOLENGTH, 0.6);
					drawCube();
				gPop();


				gPush(); //Body, LeftLeg
				{
					gTranslate(LEGWIDTH*1.05, -TORSOLENGTH, 0);
					gRotate(this.leftLeg, 1, 0, 0);
					gTranslate(0, -LEGLENGTH, 0);
					gPush();
						gScale(LEGWIDTH, LEGLENGTH, LEGWIDTH);
						drawCube();
					gPop();

					gPush(); //Body, Left, Leftshin
					{
						gTranslate(0, -LEGLENGTH, 0);
						gRotate(Math.max(this.leftKnee, 0), 1, 0, 0);
						gTranslate(0, -LEGLENGTH, 0);
						gPush();
							gScale(LEGWIDTH, LEGLENGTH, LEGWIDTH);
							drawCube();
						gPop();
					}
					gPop(); //Body, Left
				}
				gPop(); //Body
				gPush(); //Body, RightLeg
				{
					gTranslate(-LEGWIDTH*1.05, -TORSOLENGTH, 0);
					gRotate(this.rightLeg, 1, 0, 0);
					gTranslate(0, -LEGLENGTH, 0);
					gPush();
						gScale(LEGWIDTH, LEGLENGTH, LEGWIDTH);
						drawCube();
					gPop();

					gPush(); //Body, Right, Rightshin
					{
						gTranslate(0, -LEGLENGTH, 0);
						gRotate(Math.max(this.rightKnee, 0), 1, 0, 0);
						gTranslate(0, -LEGLENGTH, 0);
						gPush();
							gScale(LEGWIDTH, LEGLENGTH, LEGWIDTH);
							drawCube();
						gPop();
					}
					gPop(); //Body, Right
				}
				gPop(); //Body

				gPush(); //Body, leftarm
				{
					gTranslate(TORSOWIDTH + ARMWIDTH, TORSOLENGTH, 0);
					gRotate(-this.leftArm, 1, 0, 0);
					gRotate(-this.leftFore, 0, 1, 0);
					gTranslate(0, -ARMLENGTH, 0);
					gPush();
						gScale(ARMWIDTH, ARMLENGTH, ARMWIDTH);
						drawCube();
					gPop();

					gPush(); //B, L, forearm
					{
						gTranslate(0, -ARMLENGTH, 0);
						gRotate(Math.min(-this.leftArm * FOREFACTOR, 0), 1, 0, 0);
						gTranslate(0, -ARMLENGTH, 0);
						gPush();
							gScale(ARMWIDTH, ARMLENGTH, ARMWIDTH);
							drawCube();
						gPop();

						gPush(); //B, L, forearm, hand
						{
							gTranslate(0, -ARMLENGTH, 0);
							setColor(SKINCOLOR);
							gPush();
								gScale(ARMWIDTH, ARMWIDTH, ARMWIDTH);
								drawSphere();
							gPop();
							setColor(this.color);
						}
						gPop(); //B, L, forearm
					}
					gPop();
				}
				gPop(); //Body
				gPush(); //Body, rightarm
				{
					gTranslate(-TORSOWIDTH - ARMWIDTH, TORSOLENGTH, 0);
					gRotate(-this.rightArm, 1, 0, 0);
					gRotate(this.rightFore, 0, 1, 0);
					gTranslate(0, -ARMLENGTH, 0);
					gPush();
						gScale(ARMWIDTH, ARMLENGTH, ARMWIDTH);
						drawCube();
					gPop();

					gPush(); //B, R, forearm
					{
						gTranslate(0, -ARMLENGTH, 0);
						gRotate(Math.min(-this.rightArm * FOREFACTOR, 0), 1, 0, 0);
						gTranslate(0, -ARMLENGTH, 0);
						gPush();
							gScale(ARMWIDTH, ARMLENGTH, ARMWIDTH);
							drawCube();
						gPop();

						gPush(); //B, R, forearm, hand
						{
							gTranslate(0, -ARMLENGTH, 0);
							setColor(SKINCOLOR);
							gPush();
								gScale(ARMWIDTH, ARMWIDTH, ARMWIDTH);
								drawSphere();
							gPop();
							setColor(this.color);
						}
						gPop(); //B, R, forearm
					}
					gPop();
				}
				gPop(); //Body
				gPush(); //Body, head
				{
					gTranslate(0, TORSOLENGTH + HEAD_DIA, 0);
					gRotate(90, 1, 0, 0);
					gRotate(this.headrot, 0, 0, 1);
					beginTextures();
					gPush();
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, textureArray[this.faceTex].textureWebGL);
						gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
						gScale(HEAD_DIA, HEAD_DIA, HEAD_DIA);
						drawSphere();
					gPop();
					endTextures();
				}
				gPop();

			}
			gPop(); //.
		}
		gPop(); //
	}
}

class sword
{
	constructor()
	{
		this.position = new vec3(0, 0, 0);
		this.zrot = 0;
	}

	render()
	{
		// Sword
		gPush();
		{
			gTranslate(this.position[0], this.position[1], this.position[2]);
			gRotate(this.zrot, 0, 0, 1);
			gScale(1,1,1);

			// Hilt
			gPush();
			{
				gTranslate(0,0,0);
				gScale(0.25,1,0.25);
				gRotate(90,1,0,0);
				setColor(vec4(0.3843,0.2902,0.1804,1.0));
				drawCylinder();
			}
			gPop();

			// Pommel
			gPush();
			{
				gPush();
				{
					gTranslate(0,0.5,0);
					gScale(0.18,0.18,0.18);
					gRotate(90,1,0,0);
					setColor(vec4(0.35,0.33,0.32,1.0));
					drawSphere();
				}
				gPop();
			}
			gPop();

			// Guard
			gPush();
			{
				gTranslate(0,-0.5,0);
				gScale(1,0.2,0.2);
				setColor(vec4(0.1,0.1,0.1,1.0));
				drawCube();
			}
			gPop();

			// Blade
			const SWORD_WIDTH = 0.5;
			const SWORD_THICK = 0.2;
			const SWORD_LENGTH = 1.5;
			gPush();
			{
				gTranslate(0,(-SWORD_LENGTH*0.8)-1,0);
				gPush();
				{
					gRotate(90, 1, 0, 0);
					// gScale(0.3,1.5,0.1);
					gScale(SWORD_WIDTH, SWORD_THICK, SWORD_LENGTH*2);
					setColor(BLADECOLOR);
					// drawCube();
					drawCylinder();

				}
				gPop();
				gPush(); //Blade tip
				{
					// gTranslate(1,-2.65,1);
					gTranslate(0, -SWORD_LENGTH-0.5, 0);
					// gScale(0.35,0.3,0.1);
					gScale(SWORD_WIDTH/2, 1, SWORD_THICK/2);
					gRotate(90,1,0,0);
					drawCone();
				}
				gPop();
			}
			gPop();

		}
		gPop();
	}
}

const ROCKPOS = new vec3(-2.25, -1, 40);

class lightcone
{
	constructor()
	{
		this.pos = new vec3(ROCKPOS[0], ROCKPOS[1] + 15, ROCKPOS[2]);
		this.stretch = 8;
	}

	render()
	{
		gPush();
		{
			gTranslate(this.pos[0], this.pos[1], this.pos[2]);
			gRotate(-90, 1, 0, 0);
			// setColor(vec4(1.0, 1.0, 1.0, 0.5));
			beginTextures();
			gl.activeTexture(gl.TEXTURE0);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_, gl.REPEAT);
			gl.bindTexture(gl.TEXTURE_2D, textureArray[NOISE].textureWebGL);
			gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
			gPush();
				gScale(4, 4, -this.stretch);
				drawCone();
			gPop();
			endTextures();
		}
		gPop();
	}
}

var person1 = new person();
var person2 = new person();
var sword1 = new sword();
var lightcone1 = new lightcone();

var debugTime = false;
var frameRateTime = 0;
var frameNumber = 0;
var myPreviousTime = 0;

function render() {

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	// set the projection matrix
	// projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	projectionMatrix = perspective(45, 1, near, far);

	// set the camera matrix
	viewMatrix = lookAt(eye, at , up);

	// initialize the modeling matrix stack
	MS= [] ;
	modelMatrix = mat4() ;

	// apply the slider rotations
	gRotate(RZ,0,0,1) ;
	gRotate(RY,0,1,0) ;
	gRotate(RX,1,0,0) ;

	// send all the matrices to the shaders
	setAllMatrices() ;

	// get real time
	var curTime ;
	var debugOffset = 0;
	if( animFlag )
	{
		curTime = (new Date()).getTime() /1000 ;
		if( resetTimerFlag ) {
			prevTime = curTime ;
			resetTimerFlag = false ;
		}
		TIME = TIME + curTime - prevTime ;
		prevTime = curTime ;
		
		if(!debugTime && TIME < debugOffset)
		{
			TIME += 0.05;
		}
		else debugTime = true;
	}


	drawBG();


	// The end times of each scene
	const s0 = 0;
	const s1 = s0 + 10;
	const s2 = s1 + 13;
	const s3 = s2 + 8;
	const s4 = s3 + 23;

	if (TIME <= s1) 
	{
		scene1(TIME - s0);
	}
	else if (s1 < TIME && TIME <= s2) 
	{
		scene2(TIME - s1);
	}
	else if (s2 < TIME && TIME <= s3)
	{
		scene3(TIME - s2);
	}
	else if (s3 < TIME)// && TIME <= s4)
	{
		scene4(TIME - s3);
	}

	// if (TIME == s0) 	sword1.position = new vec3(1, 4, 1);
	// if (TIME <= s1+10) scene4(TIME - s0);

	
	frameRateTime += TIME - myPreviousTime;
	frameNumber++;
	if (frameRateTime >= 2.0) {
		console.log("FPS: " + (frameNumber / frameRateTime).toFixed(1));
		frameRateTime = 0;
		frameNumber = 0;
	}
	myPreviousTime = TIME;

	if( animFlag ) window.requestAnimFrame(render);
}

var stonePos = new vec3(-2.25, -1, 40);

function beginTextures()
{
	gl.uniform1i( gl.getUniformLocation(program,"useTextures"), useTextures );
}
function endTextures()
{
	gl.uniform1i( gl.getUniformLocation(program,"useTextures"), 0 );
}

function drawBG()
{
	beginTextures();
	gPush(); //Floor
	{
		gl.activeTexture(gl.TEXTURE0);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_, gl.REPEAT);
		gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
		gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
		setColor(vec4(0.0,1.0,0.0,1.0));
		gScale(100, 0.01, 100);
		drawCube() ;
	}
	gPop();
	endTextures();

	// Stone
	beginTextures();
	gPush();
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textureArray[STONE].textureWebGL);
		gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
		gTranslate(ROCKPOS[0], ROCKPOS[1], ROCKPOS[2]);
		gPush();
		{
			gTranslate(0,0.5,0);
			gScale(1.0,0.80,1.0);
			setColor(vec4(0.35,0.35,0.35,1.0));
			drawCube();
		}
		gPop();
		gPush();
		{
			gTranslate(0,1.5,0);
			gScale(0.70,0.60,0.70);
			setColor(vec4(0.35,0.35,0.35,1.0));
			drawCube();
		}
		gPop();
	}
	gPop();
	endTextures();

}

function LERP(p1, p2, interp)
{
	if(typeof p1 === typeof new vec3())
	{
		return new vec3(p1[0] + (p2[0] - p1[0])*interp, p1[1] + (p2[1] - p1[1])*interp, p1[2] + (p2[2] - p1[2])*interp);
	}
	else
	{
		return p1 + (p2 - p1) * interp;
	}
	// p1 = 4;
	// console.log(typeof p1 === typeof new vec3());
	// return ret;
}

// Variables for scene1 - they are public so scene2 can access where they left off
var WALK = 20;
var SPEED = 3;
const WALKDIST = 16;
var c1 = new vec3(3, 14, 14);
var c2 = new vec3(3, 14, c1[2] + WALKDIST);
var c3 = new vec3(-2.25, 8, c2[2]);
var at1 = new vec3(-2, 5, 0);
var at2 = new vec3(-2, 5, WALKDIST);
var at3 = new vec3(-2.25, 6, WALKDIST);
var guy1 = new vec3(0, 0, 0);
var guy2 = new vec3(-4.5, 0, 0);
// Starting scene. Two people walking and then surprised.
function scene1(sTime) {
	var t1 = 0;
	var t2 = t1 + 7; // 7
	var t3 = t2 + 2; //9

	if(t1 <= sTime && sTime < t2)
	{
		var interp = (sTime - t1) / (t2 - t1);
		eye = LERP(c1, c2, interp);
		at = LERP(at1, at2, interp);
		person1.position = LERP(guy1, new vec3(guy1[0], guy1[1], guy1[2] + WALKDIST), interp);
		person2.position = LERP(guy2, new vec3(guy2[0], guy2[1], guy2[2] + WALKDIST), interp);

		person1.leftLeg = Math.sin(SPEED * sTime)*WALK;
		person1.leftKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person1.leftArm = Math.sin(SPEED*sTime)*10;
		person1.rightLeg = Math.sin(SPEED * sTime + Math.PI)*WALK;
		person1.rightKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person1.rightArm = Math.sin(SPEED*sTime + Math.PI)*10;
		
		person2.color = new vec4(RED);
		person2.leftLeg = person1.rightLeg;
		person2.leftKnee = person1.rightKnee;
		person2.leftArm = person1.rightArm;
		person2.rightLeg = person1.leftLeg;
		person2.rightKnee = person1.leftKnee;
		person2.rightArm = person1.leftArm;
	}
	
	if(t2 <= sTime && sTime < t3)
	{
		var interp = (sTime - t2) / (t3 - t2);
		eye = LERP(c2, c3, interp);
		at = LERP(at2, at3, interp);
		person1.leftLeg = LERP(person1.leftLeg, 0, interp);
		person1.leftKnee = LERP(person1.leftKnee, 0, interp);
		person1.leftArm = LERP(person1.leftArm, 0, interp);
		person1.rightLeg = LERP(person1.rightLeg, 0, interp);
		person1.rightKnee = LERP(person1.rightKnee, 0, interp);
		person1.rightArm = LERP(person1.rightArm, 0, interp);
		person2.leftLeg = LERP(person2.leftLeg, 0, interp);
		person2.leftKnee = LERP(person2.leftKnee, 0, interp);
		person2.leftArm = LERP(person2.leftArm, 0, interp);
		person2.rightLeg = LERP(person2.rightLeg, 0, interp);
		person2.rightKnee = LERP(person2.rightKnee, 0, interp);
		person2.rightArm = LERP(person2.rightArm, 0, interp);

		person1.faceTex = SURPRISEDFACE;
		person2.faceTex = SURPRISEDFACE;
	}
	
	person1.render();
	person2.render();

}

var at4 = new vec3(at3[0] + 20, c3[1], at3[2]);
var at5 = new vec3(-2.25, at4[1] - 4, 35);
var at6 = new vec3(-2.25, at5[1] + 1, 35);

var c4 = new vec3(c3[0], c3[1] - 3, c3[2] -4);
var c5 = new vec3(c4[0], c4[1], c4[2] + 1);
var c6 = new vec3(c5[0], c5[1]+2, c5[2] - 4);

var guy1s2 = new vec3(2, 0, 39);
var guy2s2 = new vec3(-6.5, 0, 39);
var conePos = new vec3(lightcone1.pos);

// Two people walk into scene with sword in stone.
function scene2(sTime) {
	var t1 = 0;
	var t2 = t1 + 1.5; //pause 0.5
	var t3 = t2 + 1; //1.5 
	var t31 = t3 + 2; //3.5
	var t4 = t31 + 3; //pause 6.5
	var t5 = t4 + 2; //8.5
	var t6 = t5 + 1.5; //11

	var p1source = new vec3(4, 0, 36);
	var p2source = new vec3(-8.5, 0, 36);

	var coneheight = 40;
	var conestretch = 40;

	var p1rot = -45;
	var p2rot = -p1rot;

	if(t1 <= sTime && sTime <= t2) //Look at the rock
	{
		sword1.position = new vec3(ROCKPOS[0], ROCKPOS[1] + 5, ROCKPOS[2]);
		var interp = (sTime - t1) / (t2 - t1);

		atrr = new vec4(at3[0], 0, at3[2], 1);
		rotangle = 180 * (1-interp);
		rotmat = rotate(rotangle, new vec3(0, 1, 0));
		//Make new position:
		//x = x of camera + rotated amount (since we rotate about camera)
		//y = don't change
		//z = same as x
		at = new vec3(dot(rotmat[0], atrr) + eye[0], at[1], dot(rotmat[2], atrr) + eye[2]);


		// at = at5; 
		// eye = c4;
		lightcone1.pos = conePos;
	}
	else if(t2 <= sTime && sTime <= t3) //zoom slowly
	{
		var interp = (sTime - t2) / (t3 - t2);
		eye = LERP(c3, c5, interp);
		at = LERP(at, at5, interp);
		person1.position = p1source;
		person2.position = p2source;
		// lightcone1.render();
		conePos = new vec3(lightcone1.pos[0], coneheight, lightcone1.pos[2]);
	}
	else if(t3 <= sTime && sTime <= t31) //tornado appears
	{
		var interp = (sTime - t3) / (t31 - t3);
		//SPOTLIGHT EFFECT
		flipLight(1);
		lightcone1.render();
		shaderTime(TIME/8);
		flipLight(0);
		lightcone1.stretch = LERP(1, conestretch, interp);
		lightcone1.pos = LERP(conePos, new vec3(conePos[0], conePos[1] - coneheight, conePos[2]), interp);
	}
	else if(t31 <= sTime && sTime <= t4) //tornado persists
	{
		flipLight(1);
		lightcone1.render();
		shaderTime(TIME/8);
		flipLight(0);;
		sword1.render();
	}
	else if(t4 <= sTime && sTime <= t5) //tornado pulls out and they approach
	{
		var interp = (sTime - t4) / (t5 - t4);
		flipLight(1);
		lightcone1.render();
		shaderTime(TIME/8);
		flipLight(0);;
		lightcone1.stretch = LERP(conestretch, 1, interp);
		lightcone1.pos = LERP(new vec3(conePos[0], conePos[1]-coneheight, conePos[2]), conePos, interp);

	
		person1.yrot = p1rot;
		person2.yrot = p2rot;

		person1.position = LERP(p1source, guy1s2, interp);
		person2.position = LERP(p2source, guy2s2, interp);
	
		person1.leftLeg = Math.sin(SPEED * sTime)*WALK;
		person1.leftKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person1.leftArm = Math.sin(SPEED*sTime)*10;
		person1.rightLeg = Math.sin(SPEED * sTime + Math.PI)*WALK;
		person1.rightKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person1.rightArm = Math.sin(SPEED*sTime + Math.PI)*10;
		
		person2.color = new vec4(RED);
		person2.leftLeg = person1.rightLeg;
		person2.leftKnee = person1.rightKnee;
		person2.leftArm = person1.rightArm;
		person2.rightLeg = person1.leftLeg;
		person2.rightKnee = person1.leftKnee;
		person2.rightArm = person1.leftArm;

		sword1.render();
	}
	else if(t5 <= sTime && sTime <= t6) //they stop
	{
		var interp = (sTime - t5) / (t6 - t5);

		eye = LERP(c5, c6, interp);
		at = LERP(at5, at6, interp);

		// console.log(person1.yrot);
		person1.yrot = LERP(p1rot, -100, interp);
		person2.yrot = LERP(p2rot, 100, interp);

		person1.leftLeg = LERP(person1.leftLeg, 0, interp);
		person1.leftKnee = LERP(person1.leftKnee, 0, interp);
		person1.leftArm = LERP(person1.leftArm, 0, interp);
		person1.rightLeg = LERP(person1.rightLeg, 0, interp);
		person1.rightKnee = LERP(person1.rightKnee, 0, interp);
		person1.rightArm = LERP(person1.rightArm, 0, interp);
		person2.leftLeg = LERP(person2.leftLeg, 0, interp);
		person2.leftKnee = LERP(person2.leftKnee, 0, interp);
		person2.leftArm = LERP(person2.leftArm, 0, interp);
		person2.rightLeg = LERP(person2.rightLeg, 0, interp);
		person2.rightKnee = LERP(person2.rightKnee, 0, interp);
		person2.rightArm = LERP(person2.rightArm, 0, interp);

		sword1.render();
	}
	if(sTime > t6)
	{
		sword1.render();
	}


	person1.render();
	person2.render();
}

var pervTime = 0;
// Person 1 attempts to pull sword out and fails.
var initEye;
var initAt;
var initPos;
function scene3(sTime) {
	// Code
	var t0 = 0.1;
	var t1 = 1; // 1.0
	var t11 = t1 + 1; //2
	if (sTime <= t0)
	{
		initEye = new vec3(eye);
		initAt = new vec3(at);
		initPos = new vec3(person2.position);
	}
	if (t0 <= sTime && sTime <= t1) //red approaches
	{
		// eye = new vec3(1, 12, 20);
		// at = new vec3(0, 5, 0);
		var interp = (sTime - t0) / (t1 - t0);
		eye = LERP(initEye, add(initEye, new vec3(0, 2, -3)), interp);
		
		person2.leftLeg = Math.sin(SPEED * sTime)*WALK;
		person2.leftKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person2.rightLeg = Math.sin(SPEED * sTime + Math.PI)*WALK;
		person2.rightKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person2.position = LERP(initPos, add(initPos, new vec3(2.35, 0, 1)), interp);
	}
	
	if(t1 <= sTime && sTime <= t11)
	{
		var interp = (sTime - t1) / (t11 - t1);
		person2.faceTex = FRUSTRATEDFACE;
		
		person2.leftFore = LERP(0, 75, interp);
		person2.rightFore = LERP(0, 75, interp);
		person2.leftArm = LERP(0, 30, interp);
		person2.rightArm = LERP(0, 30, interp);
		person2.forefactor = LERP(person2.forefactor, 1.45, interp);

	}
	var t2 = t11 + 1; // 3.0
	var t3 = t2 + 1; // 4.0
	var t4 = t3 + 1; // 5.0
	var t5 = t4 + 1; // 6.0
	var t6 = t5 + 1; // 7.0
	var t7 = t6 + 1; // 8.0

	var d1 = (sTime - t11) / (t2 - t11);
	var d2 = (sTime - t2) / (t3 - t2);
	var d3 = (sTime - t3) / (t4 - t3);
	var d4 = (sTime - t4) / (t5 - t4);
	var d5 = (sTime - t5) / (t6 - t5);
	var d6 = (sTime - t6) / (t7 - t6)

	if (t11 <= sTime && sTime <= t2) {
		person2.leftFore = LERP(75, 80, d1);
		person2.rightFore = LERP(75, 80, d1);
		person2.leftArm = LERP(30, 35, d1);
		person2.rightArm = LERP(30, 35, d1);
		person2.forefactor = LERP(1.45, 1.50, d1);
	}
	if (t2 <= sTime && sTime <= t3) {
		person2.leftFore = LERP(80, 75, d2);
		person2.rightFore = LERP(80,75, d2);
		person2.leftArm = LERP(35, 30, d2);
		person2.rightArm = LERP(35, 30, d2);
		person2.forefactor = LERP(1.50, 1.45, d2);
	}
	if (t3 <= sTime && sTime <= t4) {
		person2.leftFore = LERP(75, 80, d3);
		person2.rightFore = LERP(75, 80, d3);
		person2.leftArm = LERP(30, 35, d3);
		person2.rightArm = LERP(30, 35, d3);
		person2.forefactor = LERP(1.45, 1.50, d3);
	}
	if (t4 <= sTime && sTime <= t5) {
		person2.leftFore = LERP(80, 75, d4);
		person2.rightFore = LERP(80,75, d4);
		person2.leftArm = LERP(35, 30, d4);
		person2.rightArm = LERP(35, 30, d4);
		person2.forefactor = LERP(1.50, 1.45, d4);
	}
	if (t5 <= sTime && sTime <= t6) {
		person2.headrot = Math.sin(sTime*10)*20;
		initPos = person2.position;
	}
	if (t6 <= sTime && sTime <= t7) {
		person2.headrot = LERP(person2.headrot, 0, d6);

		person2.leftLeg = Math.sin(SPEED * sTime)*WALK;
		person2.leftKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person2.rightLeg = Math.sin(SPEED * sTime + Math.PI)*WALK;
		person2.rightKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person2.position = LERP(initPos, add(initPos, new vec3(-4, 0, 4)), d6);
		person2.leftArm = LERP(person2.leftArm, 0, d6);
		person2.rightArm = LERP(person2.rightArm, 0, d6);
		person2.leftFore = LERP(person2.leftFore, 0, d6);
		person2.rightFore = LERP(person2.rightFore, 0, d6);
		person2.yrot = LERP(person2.yrot, 160, d6);
	}

	person1.render();
	person2.render();
	sword1.render();
}

var eyeRad = 0;
var eyeInit;
var swordInit;
var leftArmAng = 0;
var rightArmAng = 0;
var leftForeAng = 0;
var rightForeAng = 0;
// Person 2 attempts to pull sword out and succeeds.
function scene4(sTime) {
	// Code
	if(sTime < 0.1)
	{
		initPos = person1.position;
		swordInit = sword1.position;
	}

	if (0.1 < sTime && sTime <= 1) {
		var interp = (sTime) / 1;
		// eye = new vec3(1, 12, 20);
		eye = LERP(eye, new vec3(ROCKPOS[0], 12, ROCKPOS[2]-25), interp);
		eyeInit = new vec3(eye);
		at = LERP(at, new vec3(add(ROCKPOS, new vec3(0, 5, 0))), interp);
		// eyeRad = Math.sqrt(Math.pow((eye[0]-0), 2) + Math.pow((eye[2]-0), 2));
		
		//LERP p1
		person1.leftFore = LERP(0, 58, interp);
		person1.forefactor = LERP(person1.forefactor, 1.45, interp);
		person1.leftArm = LERP(0, 30, interp);
		person1.position = LERP(initPos, new vec3(ROCKPOS[0]+2, 0, ROCKPOS[2]), interp);

		person1.leftLeg = Math.sin(SPEED * sTime)*WALK;
		person1.leftKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;
		person1.rightLeg = Math.sin(SPEED * sTime + Math.PI)*WALK;
		person1.rightKnee = WALK/2+Math.sin(SPEED*2*sTime + Math.PI/2)*WALK/2;

		leftForeAng = person1.leftFore;
		rightForeAng = person1.rightFore;

		person2.faceTex = SADFACE;

		person2.leftLeg = LERP(person2.leftLeg, 0, interp);
		person2.rightLeg = LERP(person2.rightLeg, 0, interp);
		person2.yrot = LERP(person2.yrot, 135, interp);

		stonePos = new vec3(ROCKPOS);
	}
	
	
	
	var t1 = 1; // 1.0
	var t2 = t1 + 1; // 5.0
	var t3 = t2 + 0.2; // 4.2
	var t4 = t3 + 1; // 5.2
	var t5 = t4 + 0.5; // 7.2
	var t6 = t5 + 1; // 8.2
	var t7 = t6 + 1; // 9.0
	var t8 = t7 + 0.2; // 9.2
	var t9 = t8 + 3; // 12.2
	var t10 = t9 + 4.8; //17
	var t11 = t10 + 3; //20
	var t12 = t11 + 1; //21
	
	var d1 = (sTime - t1) / (t2 - t1);
	var d2 = (sTime - t5) / (t7 - t5);
	
	if (t6 < sTime && sTime < t11)
	{
		var interp = (sTime - t6) / (t11 - t6);
		// eye = new vec3(eyeRad*Math.sin((sTime/1.5)-1), 12, eyeRad*Math.cos((sTime/1.5)-1));
		atrr = new vec4(eyeInit[0] - at[0], 0, eyeInit[2] - at[2], 1);
		rotangle = 720 * interp;
		rotmat = rotate(rotangle, new vec3(0, 1, 0));
		//Make new position:
		//x = x of camera + rotated amount (since we rotate about camera)
		//y = don't change
		//z = same as x
		eye = new vec3(dot(rotmat[0], atrr) + at[0], eye[1], dot(rotmat[2], atrr) + at[2]);
		
	}
	
	if (sTime < t3) {
		var interp = sTime / t3
		person1.leftArm = LERP(0, 30, interp);
		leftArmAng = person1.leftArm;
	}
	if (sTime < t4 && sTime > t3) {
		var interp = (sTime - t3) / (t4 - t3);
		person1.leftFore = LERP(person1.leftFore, leftForeAng-9.5, interp);
		
		person1.leftLeg = LERP(person1.leftLeg, 0, interp);
		person1.leftKnee = LERP(person1.leftKnee, 0, interp);
		person1.rightLeg = LERP(person1.rightLeg, 0, interp);
		person1.rightKnee = LERP(person1.rightKnee, 0, interp);
		
		person1.faceTex = FRUSTRATEDFACE;
	}
	if(t4 <= sTime && sTime <= t5)
	{
		var interp = (sTime - t4) / (t5 - t4);
		person1.leftArm = LERP(person1.leftArm, 40, interp);
		leftArmAng = person1.leftArm;
		sword1.position = LERP(sword1.position, add(swordInit, new vec3(0, 0.6, 0)), interp); 
		person2.faceTex = SURPRISEDFACE;
		person1.faceTex = HAPPYFACE;
	}
	if(t5 <= sTime && sTime <= t7)
	{
		var interp = (sTime - t5) / (t7 - t5);
		person1.leftFore = LERP(person1.leftFore, 30, interp);
		person1.rightFore = LERP(rightForeAng, rightForeAng+45, interp);
		person1.rightArm = LERP(0, 65, interp);
		person1.leftArm = LERP(leftArmAng, leftArmAng+27, interp);
		person1.forefactor = LERP(1.5, 1, interp);
		sword1.position = LERP(add(swordInit, new vec3(0, 0.6, 0)), add(swordInit, new vec3(-0.3, 3, 0)), interp);

	}
	if(t6 <= sTime && sTime <= t7)
	{
		var interp = (sTime - t6) / (t7 - t6);
		sword1.zrot = LERP(sword1.zrot, -180, interp);
	}

	if (t1 <= sTime && sTime <= t2) {

		lightcone1.stretch = 4;
		lightcone1.pos = new vec3(add(person1.position, new vec3(0, -5, 0)));
	}

	if (t8 <= sTime && sTime <= t10)
	{
		var interp = (sTime - t8) / (t10 - t8);
		lightcone1.stretch = LERP(0, 40, interp)
		flipLight(1);
		lightcone1.render();
		shaderTime(TIME/8);
		flipLight(0);
	}
	if(sTime > t9)
	{
		person1.faceTex = SURPRISEDFACE;
	}
	if (sTime < t10)
	{
		person1.render();
	}
	if (t10 <= sTime && sTime <= t11)
	{
		var interp = (sTime - t10) / (t11 - t10);
		lightcone1.stretch = LERP(lightcone1.stretch, 0, interp);
		sword1.position = LERP(sword1.position, new vec3(ROCKPOS[0], 4, ROCKPOS[2]), interp);
		sword1.zrot = LERP(sword1.zrot, 0, interp);
		flipLight(1);
		lightcone1.render();
		shaderTime(TIME/8);
		flipLight(0);
	}
	if(t11 <= sTime && sTime <= t12)
	{
		var interp = (sTime - t11) / (t12 - t11);
		person2.faceTex = SCREAMFACE;
		eye = LERP(eye, add(person2.position, new vec3(3, 7.5, -3)), interp)
		at = LERP(at, add(person2.position, new vec3(0, 7.5, 0)), interp);
	}
	

	person2.render();
	sword1.render();

}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;

	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};

	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};

	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
