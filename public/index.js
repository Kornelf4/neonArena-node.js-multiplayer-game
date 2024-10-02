const socket = io();
let players = {};
let bullets = [];
let keys = {};
const fps = 42;
let cursorX = 0;
let cursorY = 0;
let walls = [];
let imprints = [];
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
console.log(walls);
socket.emit("getWallMap");
socket.on("reciveWallMap", (wallsSent) => {
    walls = wallsSent;
})
function radToDeg(rad) {
    return rad * (180 / Math.PI);
}
function getAlpha(xside, yside) {
    return radToDeg(Math.atan2(yside / xside));
}
socket.on("updatePlayers", (backendPlayers) => {
    for (const id in backendPlayers) {
        if (!players[id]) {
            players[id] = new player(backendPlayers[id].x, backendPlayers[id].y, backendPlayers[id].color)
        } else {
            //If already exist
            players[id].x = backendPlayers[id].x;
            players[id].y = backendPlayers[id].y;
            players[id].hp = backendPlayers[id].hp;
        }
    }
    for (const id in players) {
        if (!backendPlayers[id]) {
            delete players[id];
        }
    }
    if(players[socket.id] === undefined) return;
    if (players[socket.id].hp <= 0) {
        socket.emit("forceDisconnect", socket.id);
    } else {
    }
})
socket.on("updateBullets", (backendBullets) => {
    bullets = backendBullets;
});
socket.on("updateImprins", (imprint) => {
    imprints = imprint;
});
socket.on("sendFPS", (sfps) => {
    document.getElementById("fps").innerText = Math.round(sfps);
});
function renderAll() {
    ctx.clearRect(0, 0, 1200, 700);
    for (const i in bullets) {
        ctx.strokeStyle = bullets[i].color;
        ctx.strokeRect(bullets[i].x, bullets[i].y, bullets[i].xsize, bullets[i].ysize);
    }
    for (const i in imprints) {
        if (imprints[i].lifetime <= 0) ;
        imprints[i].alpha = imprints[i].lifetime / imprints[i].maxlifetime * imprints[i].alphaM;
        ctx.globalAlpha = imprints[i].alpha;
        ctx.fillStyle = imprints[i].color;
        ctx.strokeStyle = imprints[i].color;
        ctx.lineJoin = "bevel";
        ctx.lineWidth = 3;
        ctx.fillRect(imprints[i].x, imprints[i].y, imprints[i].xsize, imprints[i].ysize);
        ctx.globalAlpha = 1;
    }
    for (const i in walls) {
        ctx.strokeStyle = "white";
        ctx.lineJoin = "bevel";
        ctx.lineWidth = 3;
        ctx.fillStyle = "white";
        ctx.strokeRect(walls[i].x, walls[i].y, walls[i].xsize, walls[i].ysize);
        ctx.strokeRect(walls[i].x + 5, walls[i].y + 5, walls[i].xsize - 10, walls[i].ysize - 10);
        ctx.font = "28px Arial";
        ctx.fillText(walls[i].hp, walls[i].x + 13, walls[i].y + 30);
    }
    for (const id in players) {
        players[id].render();
    }
}
function playerInput() {
    if (players[socket.id] === undefined) return;
    if (keys.w) {
        socket.emit("keydown", "w")
    }
    if (keys.s) {
        socket.emit("keydown", "s")
    }
    if (keys.a) {
        socket.emit("keydown", "a")
    }
    if (keys.d) {
        socket.emit("keydown", "d")
    }
}
function tick() {
    playerInput();
    renderAll();
    setTimeout("tick()", 10)
}
setTimeout("tick()", 1000 / fps);
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;

});
window.addEventListener("keyup", (e) => {
    delete keys[e.key];
});
const canvasX = (canvas.getBoundingClientRect().left).toFixed(5);
const canvasY = (canvas.getBoundingClientRect().top).toFixed(5);
window.onmousemove = function (e) {
    cursorX = (e.clientX - canvasX) / (canvas.getBoundingClientRect().right - canvasX) * parseFloat(canvas.width);
    cursorY = (e.clientY - canvasY) / (canvas.getBoundingClientRect().bottom - canvasY) * parseFloat(canvas.height);
}
function joinClick() {
    if(players[socket.id] === undefined) {
        socket.emit("playerJoin", socket.id);
    }
}
function quitClick() {
    console.log("clicked");
    socket.emit("clickDisconnect", socket.id);
}
canvas.onclick = function () {
    if (players[socket.id] === undefined) return;
    let playerX = players[socket.id].x + players[socket.id].xsize / 2;
    let playerY = players[socket.id].y + players[socket.id].ysize / 2;
    const angle = Math.atan2(cursorY - playerY, cursorX - playerX) * 180 / Math.PI;

    socket.emit("spawnBullet", { x: playerX, y: playerY, alpha: angle, owner: socket.id, color: players[socket.id].color });
}