// Shader class for loading and compiling shaders
class Shader { 
    constructor(gl, vertexName, fragmentName) { // Constructor takes the WebGL context and the name of the vertex and fragment shader
        this.gl = gl;
        this.shader = null;

        this.init(vertexName, fragmentName);
    }

    // Function for loading and compiling shaders
    getShader(id) { 
        let script = document.getElementById(id); // Get the shader

        if (!script) { // If the shader is not found, return null
            return null;
        }

        let str = ""; // Create the string
        let k = script.firstChild; // Get the first child of the shader

        while (k) { // Loop through the shader and add it to the string
            if (k.nodeType === 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        let shader; // Create the shader

        if (script.type === "x-shader/x-fragment") { // Create the shader based on the type
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        } else if (script.type === "x-shader/x-vertex") { // Create the shader based on the type
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        } else { // If the type is not found, return null
            return null;
        }

        // Compile the shader
        this.gl.shaderSource(shader, str);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) { // If the shader fails to compile, return null
            alert(this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    // Function for initializing the shader
    init(vertexName,fragmentName) { 
        // Load and compile the shaders
        let vertexShader = this.getShader(vertexName);
        let fragmentShader = this.getShader(fragmentName);

        // Create the shader program
        this.shader = this.gl.createProgram();
        this.gl.attachShader(this.shader, vertexShader);
        this.gl.attachShader(this.shader, fragmentShader);
        this.gl.linkProgram(this.shader);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
    }

    // Function for using the shader
    use() { 
        this.gl.useProgram(this.shader);
    }

    // Function for returning the shader
    get() { 
        return this.shader;
    }
}

// Global variables
const YAW = -90.0;
const PITCH = 0.0;
const SPEED = 0.0005;
const SENSITIVITY = 0.5;

// Camera class for creating a camera
class Camera { 
    constructor(position, up, front) { // Constructor takes the position, up and front vectors
        // Set the camera variables
        this.Position = position;
        this.Front = front;
        this.Up = vec3.create();
        this.Right = vec3.create();
        this.WorldUp = up;

        // Set the camera variables
        this.Yaw = YAW;
        this.Pitch = PITCH;

        // Set the camera variables
        this.MovementSpeed = SPEED;
        this.MouseSensitivity = SENSITIVITY;

        this.updateCameraVectors(); // Update the camera vectors
    }

    // Function for updating the camera vectors
    updateCameraVectors() { 
        let front = vec3.create(); // Create the front vector

        // Calculate the front vector
        front[0] = Math.cos(degToRad(this.Yaw)) * Math.cos(degToRad(this.Pitch));
        front[1]= Math.sin(degToRad(this.Pitch));
        front[2] = Math.sin(degToRad(this.Yaw)) * Math.cos(degToRad(this.Pitch));
        vec3.normalize(this.Front,front);

        // Calculate the right and up vectors
        let right = vec3.create();
        let up = vec3.create();

        // Calculate the right and up vectors
        vec3.cross(right, this.Front, this.WorldUp);
        vec3.normalize(this.Right,right);
        vec3.cross(up, this.Right, this.Front);
        vec3.normalize(this.Up, up);
    }

    // Function for returning the view matrix
    getViewMatrix() { 
        // Create the view matrix
        let lookAt = mat4.create();
        let dir = vec3.create();

        // Calculate the direction
        vec3.add(dir, this.Position, this.Front);
        mat4.lookAt(lookAt, this.Position, dir, this.Up);

        return lookAt;
    }

    // Function for processing keyboard input
    processKeyboard(direction, deltaTime) { 
        let velocity = this.MovementSpeed * deltaTime; // Calculate the velocity

        if (direction === 0) { // Move the camera based on the direction
            vec3.scaleAndAdd(this.Position, this.Position, this.Front, velocity);
        }
        if (direction === 1) { // Move the camera based on the direction
            vec3.scaleAndAdd(this.Position, this.Position, this.Front, -velocity);
        }
        if (direction === 2) { // Move the camera based on the direction
            vec3.scaleAndAdd(this.Position, this.Position, this.Right, -velocity);
        }
        if (direction === 3) { // Move the camera based on the direction
            vec3.scaleAndAdd(this.Position, this.Position, this.Right, velocity);
        }
    }

    // Function for processing mouse movement
    processMouseMovement(xoffset, yoffset) { 
        // Make sure the mouse is not locked
        xoffset *= this.MouseSensitivity;
        yoffset *= this.MouseSensitivity;

        // Update the yaw and pitch
        this.Yaw += xoffset;
        this.Pitch += yoffset;

        if (this.Pitch > 89.0) { // Make sure the pitch stays within the range of -89 to 89
            this.Pitch = 89.0;
        }
        if (this.Pitch < -89.0) { // Make sure the pitch stays within the range of -89 to 89
            this.Pitch = -89.0;
        }

        this.updateCameraVectors(); // Update the camera vectors
    }
}

// Grid class for creating a grid
class Grid { 
    constructor(normalTexPath,gl) { // Constructor takes the normal texture path and the gl context
        // Context
        this.gl = gl;
        this.normalTexPath = normalTexPath;

        this.shader = null; // Shader

        this.normalTex = null; // Normal texture

        // Grid data
        this.vertex = [];
        this.texture = [];
        this.index = [];

        // Buffers
        this.vertexBuffer = null;
        this.texBuffer = null;
        this.indexBuffer = null;

        // Uniforms
        this.i = 0;
        this.time = 0;
        this.texSize = 0;

        // Matrices
        this.model = mat4.create();
        this.normal = mat3.create();

        // Camera
        this.initProgram();
        this.initBuffers();
        this.initTexture();
        this.initMatrix();
    }

    // Function for initializing the program
    initProgram() {
        this.shader = new Shader(this.gl, "shader-vs", "shader-fs"); // Create a new shader

        // Get the locations of the attributes and uniforms
        this.shader.aPosition = this.gl.getAttribLocation(this.shader.get(), "aPosition");
        this.shader.aTexture = this.gl.getAttribLocation(this.shader.get(), "aTexture");

        // Get the locations of the uniforms
        this.shader.matrixModel = this.gl.getUniformLocation(this.shader.get(), "model");
        this.shader.matrixView = this.gl.getUniformLocation(this.shader.get(), "view");
        this.shader.matrixProj = this.gl.getUniformLocation(this.shader.get(), "projection");
        this.shader.matrixNormal = this.gl.getUniformLocation(this.shader.get(), "normal");

        // Get the locations of the light uniforms
        this.shader.lightAmbient = this.gl.getUniformLocation(this.shader.get(), "light.ambient");
        this.shader.lightDiffuse = this.gl.getUniformLocation(this.shader.get(), "light.diffuse");
        this.shader.lightSpecular = this.gl.getUniformLocation(this.shader.get(), "light.specular");
        this.shader.lightPosition = this.gl.getUniformLocation(this.shader.get(), "light.position");
        this.shader.viewPos = this.gl.getUniformLocation(this.shader.get(), "viewPos");
        this.shader.normalTexture = this.gl.getUniformLocation(this.shader.get(), "normalSampler");
        this.shader.skyboxloc = this.gl.getUniformLocation(this.shader.get(), "skybox");
        this.shader.detalX = this.gl.getUniformLocation(this.shader.get(), "detalX");
        this.shader.time = this.gl.getUniformLocation(this.shader.get(), "time");
    }

    // Function for generating the grid
    generateGrid(gridSize) { 
        let i = 0; // Index counter

        for(let x = 0.0; x < gridSize; x += 1.0) { // Loop through the grid
            for (let z = 0.0; z < gridSize; z += 1.0) { // Loop through the grid
                this.vertex.push(x, 0.0, z);
                this.vertex.push(x + 1.0, 0.0, z);
                this.vertex.push(x + 1.0, 0.0, z + 1.0);
                this.vertex.push(x, 0.0, z + 1.0);

                this.texture.push(0.0, 0.0);
                this.texture.push(1.0, 0.0);
                this.texture.push(1.0, 1.0);
                this.texture.push(0.0, 1.0);

                this.index.push(i);
                this.index.push(i + 1);
                this.index.push(i + 2);
                this.index.push(i);
                this.index.push(i + 2);
                this.index.push(i + 3);

                i += 4;
            }
        }
    }

    // Function for initializing the buffers
    initBuffers() {
        this.generateGrid(500); // Generate the grid

        // Create the buffers and fill them with the data
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertex), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // Create the buffers for the texture
        this.texBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.texture), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // Create the buffers for the index
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.index), this.gl.STATIC_DRAW);
    }

    // Function for initializing the texture
    initTexture() { 
        // Normal texture initialization
        this.normalTex = this.gl.createTexture();
        this.normalTex.image = new Image();

        this.normalTex.image.onload = function() {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalTex);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.normalTex.image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }.bind(this); // Bind the texture

        this.normalTex.image.src = this.normalTexPath; // Set the texture path
    }

    // Function for initializing the matrix
    initMatrix() {
        mat4.translate(this.model, this.model, [-1000.0, 0.0, -1000.0]); // Translate the model
        mat4.scale(this.model, this.model, [5.0,0.0,5.0]); // Scale the model
        mat3.normalFromMat4(this.normal, this.model); // Calculate the normal matrix
    }

    // Function for animating the object
    animate() { 
        this.i < this.normalTex.image.height ? this.i += 1.0 : this.i = 0.0; // Animate the texture
        this.time++; // Animate the time
    }

    // Function for drawing the object
    draw(view,projection,skybox,camera) { 
        this.shader.use(); // Use the shader

        // Bind the buffers
        this.gl.enableVertexAttribArray(this.shader.aPosition);
        this.gl.enableVertexAttribArray(this.shader.aTexture);

        // Bind the vertex buffer
        this.gl.uniform3fv(this.shader.lightAmbient, [0.2, 0.2, 0.2]);
        this.gl.uniform3fv(this.shader.lightDiffuse, [0.5, 0.5, 0.5]);
        this.gl.uniform3fv(this.shader.lightSpecular, [1.0, 1.0, 1.0]);
        this.gl.uniform3fv(this.shader.lightPosition, [20.0, 20.0, 20.0]);
        this.gl.uniform3fv(this.shader.viewPos, camera.Position);

        // Bind the texture buffer
        this.gl.uniformMatrix4fv(this.shader.matrixModel, false, this.model);
        this.gl.uniformMatrix4fv(this.shader.matrixView, false, view);
        this.gl.uniformMatrix4fv(this.shader.matrixProj, false, projection);
        this.gl.uniformMatrix3fv(this.shader.matrixNormal, false, this.normal);

        // Bind the index buffer
        this.gl.uniform1f(this.shader.detalX, this.i);
        this.gl.uniform1f(this.shader.time, this.time * 0.001);

        // Bind the texture
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalTex);
        this.gl.uniform1i(this.shader.normalTexture, 1);

        // Bind the skybox
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, skybox.skybox);
        this.gl.uniform1i(this.shader.skyboxloc, 0);

        // Draw the object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.shader.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texBuffer);
        this.gl.vertexAttribPointer(this.shader.aTexture, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.gl.drawElements(this.gl.TRIANGLES, this.index.length, this.gl.UNSIGNED_INT, 0); // Draw the object

        // Unbind the buffers
        this.gl.disableVertexAttribArray(this.shader.aPosition);
        this.gl.disableVertexAttribArray(this.shader.aTexture);
    }
}

// Class for the skybox
class Skybox {
    constructor(path,gl) { // Constructor for the skybox
        // Setting the variables
        this.gl = gl;
        this.path = path;
        this.shader = null;

        this.textures = []; // The textures for the skybox

        // Creating the vertices
        this.vertices = [];
        this.indices = [];

        // Creating the buffers
        this.vertexBuffer = null;
        this.indexBuffer = null;

        // Creating the skybox
        this.cntLoad = 0;
        this.skybox = null;
        this.loaded = false;

        this.targets = [
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        ]; // The targets for the textures

        this.faceName = ["right", "left", "top", "bottom", "back", "front"]; // The name of the faces

        // Creating the faces
        this.initProgram();
        this.initBuffers();
        this.initTexture();
    }

    // Function for initializing the program
    initProgram() { 
        this.shader = new Shader(this.gl,"skybox-shader-vs","skybox-shader-fs"); // Creating the shader

        // Getting the attributes and uniforms
        this.shader.sbCoordsAttribute = this.gl.getAttribLocation(this.shader.get(), "aPos");
        this.shader.sbMVMatrixUniform = this.gl.getUniformLocation(this.shader.get(), "view");
        this.shader.sbPMatrixUniform = this.gl.getUniformLocation(this.shader.get(), "projection");
        this.shader.cubeTextureUniform = this.gl.getUniformLocation(this.shader.get(), "skybox");
    }

    // Function for creating a face of the skybox
    createFace(xyz) {
        let start = this.vertices.length / 3; // Starting index

        for (let i = 0; i < 12; i++) { // Pushing the vertices
            this.vertices.push(xyz[i]);
        }

        this.indices.push(start, start + 1, start + 2, start, start + 2, start + 3); // Pushing the indices
    }

    // Function for initializing the buffers
    initBuffers() {
        let size = 1.0; // Size of the skybox

        // Creating the faces of the skybox
        this.createFace( [-size, -size, size, size,-size, size, size, size, size, -size, size, size]);
        this.createFace( [-size, -size, -size, -size, size, -size, size, size, -size, size, -size, -size]);
        this.createFace( [-size, size, -size, -size, size, size, size, size, size, size, size, -size]);
        this.createFace( [-size, -size, -size, size, -size, -size, size, -size, size, -size, -size, size]);
        this.createFace( [size, -size, -size, size, size, -size, size, size, size, size, -size, size]);
        this.createFace( [-size, -size, -size, -size, -size, size, -size, size, size, -size, size, -size]);

        // Creating the buffers
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // Creating the index buffer
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    // Function for initializing the texture
    initTexture() { 
        this.cntLoad = 0; // Setting the counter to 0

        for(let j = 0; j < 6; j++) { // Loading the textures
            this.textures[j] = new Image();
            this.textures[j].onload = this.textureLoading.bind(this);
            this.textures[j].src = this.path + this.faceName[j] + ".jpg";
        }
    }

    // Function for loading the texture
    textureLoading() {
        this.cntLoad++; // Incrementing the counter

        if(this.cntLoad === 6) { // If all the textures are loaded
            this.skybox = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);

            for(let i = 0; i < 6; i++) { // Pushing the textures
                this.gl.texImage2D(this.targets[i], 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textures[i]);
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            }

            this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP); // Generating the mipmaps
            this.loaded = true; // Setting the loaded flag
        }
    }

    // Function for drawing the skybox
    draw(view,projection) { 
        if(this.loaded) { // If the skybox is loaded
            let view3 =  mat3.create();
            mat3.fromMat4(view3,view);
            let viewSkybox = mat4.fromValues(view3[0], view3[1], view3[2], 0.0, view3[3], view3[4], view3[5], 0.0, view3[6], view3[7], view3[8], 0.0, 0.0, 0.0, 0.0, 0.0);

            this.shader.use();

            this.gl.depthFunc(this.gl.LEQUAL);

            this.gl.uniformMatrix4fv(this.shader.sbMVMatrixUniform, false, viewSkybox);
            this.gl.uniformMatrix4fv(this.shader.sbPMatrixUniform, false, projection);

            this.gl.enableVertexAttribArray(this.shader.sbCoordsAttribute);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox);
            this.gl.uniform1i(this.shader.cubeTextureUniform, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.vertexAttribPointer(this.shader.sbCoordsAttribute, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

            this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);

            this.gl.disableVertexAttribArray(this.shader.sbCoordsAttribute);

            this.gl.depthFunc(this.gl.LESS);
        }
    }
}

// Global variables
var canvas = null;
var gl = null;
var camera = null;
var skybox = null;
var grid = null;
var currentlyPressedKeys = {};
var deltaTime = 0;
var lastFrame = 0;
var lastX = 0;
var lastY = 0;
var stats = null;

// Function for initializing the scene
window.onload = function() {
    canvas = document.getElementById('glcanvas'); // Getting the canvas

    try { // Initializing the WebGL context
        gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl", {antialias: true}));

        let uint = gl.getExtension("OES_element_index_uint");
        let displayWidth = document.getElementById('container').clientWidth;
        let displayHeight = document.getElementById('container').clientHeight;

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        gl.viewportWidth = displayWidth;
        gl.viewportHeight = displayHeight;

        lastX = displayHeight / 2;
        lastY = displayWidth / 2;
    } catch(e) {
    } 
    
    if (!gl) { // If the WebGL context is not initialized
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    
    // Initializing the stats
    stats = new Stats();
    stats.showPanel(0);

    document.body.appendChild(stats.dom); // Adding the stats to the document

    // Adding the event listeners
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    document.onmousemove = handelMouse;

    init(); // Initializing the scene
};

// Function for initializing the scene
function init() { 
    // Initializing the shaders
    camera =  new Camera([0.0, 2.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, -1.0]);
    grid = new Grid("textures/waternormal3.jpg", gl);
    skybox = new Skybox("textures/skybox/mountain/", gl);

    // Setting the WebGL parameters
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    tick(); // Starting the animation
}

// Function for animating the scene
function tick() {
    // Requesting the next frame
    requestAnimFrame(tick);
    stats.begin();

    // Calculating the delta time
    let d = new Date();
    let currentFrame = d.getTime();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    // Resizing the canvas
    resizeCanvas();
    handleKeys();
    animate();
    drawScene();

    stats.end(); // Updating the stats
}

// Function for drawing the scene
function drawScene() { 
    // Setting the viewport
    let projection = mat4.create();
    mat4.perspective(projection, degToRad(80), gl.viewportWidth / gl.viewportHeight, 0.01, 1000000.0);

    let view = camera.getViewMatrix(); // Getting the view matrix

    // Clearing the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    grid.draw(view, projection, skybox,camera); // Drawing the grid

    skybox.draw(view, projection); // Drawing the skybox
}

// Function for animating the scene
function animate() { 
    grid.animate();
}

// Resizing the canvas
function resizeCanvas() {
    // Getting the display size of the canvas
    let displayWidth = document.getElementById('container').clientWidth;
    let displayHeight = document.getElementById('container').clientHeight;

    if (gl.viewportWidth !== displayWidth || gl.viewportHeight !== displayHeight) { // If the canvas is not the same size
        gl.viewportWidth = displayWidth;
        gl.viewportHeight = displayHeight;
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

// Function for converting degrees to radians
function degToRad(degrees) {
    return (degrees * Math.PI / 180.0);
}

// Function for handling the keys
function handleKeys() {
    if ( currentlyPressedKeys[65]) { // A
        camera.processKeyboard(2, deltaTime);
    } else if (currentlyPressedKeys[68]) { // D
        camera.processKeyboard(3, deltaTime);
    } else if ( currentlyPressedKeys[87]) { // W
        camera.processKeyboard(0, deltaTime);
    } else if (currentlyPressedKeys[83]) { // S
        camera.processKeyboard(1, deltaTime);
    }
}

// Handling the key down event
function handleKeyDown(event) { 
    currentlyPressedKeys[event.keyCode] = true;
}

// Handling the key up event
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

// Handling the mouse event
function handelMouse(event) {
    let xoffset = event.clientX - lastX;
    let yoffset = lastY - event.clientY;

    lastX = event.clientX ;
    lastY = event.clientY;

    camera.processMouseMovement(xoffset, yoffset);
}