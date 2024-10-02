const express = require("express")
const app = express()

//socket.io setup
const http = require("http");
const path = require("path");
let playersIn = 0;
const fps = 42;
const sizeUnit = 50;
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })
const imprints = [];
const walls = [];

app.use(express.static("public"));

function generate2DArray(rows, columns) {
    const array = [];
    for (let i = 0; i < rows; i++) {
        array[i] = [];
        for (let j = 0; j < columns; j++) {
            array[i][j] = 0;
        }
    }
    return array;
}

let map = generate2DArray(1500 / sizeUnit, 700 / sizeUnit);
map[5][4] = "#";
map[6][4] = "#";
map[7][4] = "#";
map[8][4] = "#";

map[6][5] = "#";
map[7][5] = "#";

map[5][19] = "#";
map[6][19] = "#";
map[7][19] = "#";
map[8][19] = "#";


map[6][18] = "#";
map[7][18] = "#";

map[0][0] = "#";
map[0][23] = "#";
map[13][0] = "#";
map[12][23] = "#";

map[11][12] = "#";
map[11][11] = "#";
map[11][10] = "#";
map[11][13] = "#";


map[2][12] = "#";
map[2][11] = "#";
map[2][10] = "#";
map[2][13] = "#";

map[6][12] = "@";
map[6][11] = "@";
map[7][12] = "@";
map[7][11] = "@";
class imprint {
    constructor(obj, lifetime, alphM) {
        this.x = obj.x;
        this.y = obj.y;
        this.xsize = obj.xsize;
        this.ysize = obj.ysize;
        this.color = obj.color;
        this.maxlifetime = lifetime,
            this.alpha = 1;
        this.alphaM = alphM;
        this.lifetime = lifetime;
        this.render = () => {
            this.lifetime -= 1;
            this.alpha = (this.lifetime / this.maxlifetime) * this.alphaM;
        }
    }
}
class wall {
    constructor(x, y, hp) {
        this.x = x;
        this.y = y;
        this.xsize = sizeUnit;
        this.ysize = sizeUnit;
        this.color = "white";
        this.hp = hp;
    }
}
const bulletSpeed = 5;
const players = {}
const bullets = [];

function checkAABBCollision(obj1, obj2) {
    if (obj1 === undefined || obj2 === undefined) return false;
    return obj1.x < obj2.x + obj2.xsize &&
        obj1.x + obj1.xsize > obj2.x &&
        obj1.y < obj2.y + obj2.ysize &&
        obj1.y + obj1.ysize > obj2.y;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"))
})

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

function radians_to_degrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi)
}

class bullet {
    constructor(x, y, deg, color) {
        this.x = x;
        this.color = color;
        this.y = y;
        this.deg = deg;
        this.xsize = 10;
        this.ysize = 10;
        this.vx = bulletSpeed * Math.cos(this.deg * Math.PI / 180);
        this.vy = bulletSpeed * Math.sin(this.deg * Math.PI / 180);
        this.move = () => {
            this.x += this.vx * 2;
            this.y += this.vy * 2;
            io.emit("updateBullets", bullets);
        }
    }
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
io.on("connection", (socket) => {
    const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    socket.on("playerJoin", (joinID) => {
        const r = randomBetween(0, 255);
        const g = randomBetween(0, 255);
        const b = randomBetween(0, 255);
        const rgb = `rgb(${r},${g},${b})`;
        players[joinID] = {
            x: 500 * Math.random(),
            y: 100 * Math.random(),
            color: rgb,
            xsize: 50,
            ysize: 50,
            hp: 10
        }
        playersIn += 1;
        console.log("Player connected with id: " + joinID);
        console.log("Players on server: " + playersIn);
        io.emit("updatePlayers", players);
    })
    socket.on("disconnect", (reason) => {
        if (players[socket.id] !== undefined) {
            playersIn -= 1;
            console.log("Player disconnected with id: " + socket.id);
            console.log("Players on server: " + playersIn);
            delete players[socket.id];
            io.emit("updatePlayers", players);
        }
    })
    socket.on("clickDisconnect", (reason) => {
        playersIn -= 1;
        console.log("Player disconnected with id: " + socket.id);
        console.log("Players on server: " + playersIn);
        delete players[socket.id];
        io.emit("updatePlayers", players);
        for(let i = 0;i < 150; i++) {
            damageImprints();
            io.emit("updateImprins", imprints);
        }
    })
    socket.on("addImprint", (object, lifetime, alphaMultiplayer) => {
        imprints.unshift(new imprint(object, lifetime, alphaMultiplayer));
        function a() {
            imprints.splice(getRndInteger(0, imprints.length - 1));
            a();
        }
        //a();
        io.emit("updateImprins", imprints);
    })
    socket.on("destroyImprint", (index) => {
        imprints.splice(index, 1);
    })
    socket.on("damageImprint", (index) => {
    })
    socket.on("keydown", (key) => {
        if (players[socket.id] === undefined) return;
        try {
            if (key == "w") {
                for (const i in walls) {
                    if (checkAABBCollision(walls[i], { x: players[socket.id].x, y: players[socket.id].y - 3, xsize: players[socket.id].xsize, ysize: players[socket.id].ysize })) {
                        return;
                    }
                }
                players[socket.id].y -= 3;
                io.emit("updatePlayers", players);
            }
            if (key == "s") {
                for (const i in walls) {
                    if (checkAABBCollision(walls[i], { x: players[socket.id].x, y: players[socket.id].y + 3, xsize: players[socket.id].xsize, ysize: players[socket.id].ysize })) {
                        return;
                    }
                }
                players[socket.id].y += 3;
                io.emit("updatePlayers", players);
            }
            if (key == "a") {
                for (const i in walls) {
                    if (checkAABBCollision(walls[i], { x: players[socket.id].x - 3, y: players[socket.id].y, xsize: players[socket.id].xsize, ysize: players[socket.id].ysize })) {
                        return;
                    }
                }
                players[socket.id].x -= 3;
                io.emit("updatePlayers", players);
            }
            if (key == "d") {
                for (const i in walls) {
                    if (checkAABBCollision(walls[i], { x: players[socket.id].x + 3, y: players[socket.id].y, xsize: players[socket.id].xsize, ysize: players[socket.id].ysize })) {
                        return;
                    }
                }
                players[socket.id].x += 3;
                io.emit("updatePlayers", players);
            }
            if (players[socket.id].x + players[socket.id].xsize < 0) {
                players[socket.id].x = 1200;
                io.emit("updatePlayers", players);
            }
            if (players[socket.id].x > 1200) {
                players[socket.id].x = 0 - players[socket.id].xsize;
                io.emit("updatePlayers", players);
            }
            if (players[socket.id].y + players[socket.id].ysize < 0) {
                players[socket.id].y = 700;
                io.emit("updatePlayers", players);
            }
            if (players[socket.id].y > 700) {
                players[socket.id].y = 0;
                io.emit("updatePlayers", players);
            }
        } catch (e) {
            console.error("Catch unknown anomaly")
        }

    })
    socket.on("spawnBullet", (config) => {
        bullets.unshift(new bullet(config.x, config.y, config.alpha, config.color));
        bullets[0]["owner"] = config.owner;
        io.emit("updateBullets", bullets);
    });
    socket.on('forceDisconnect', function (frontplayerid) {
        delete players[frontplayerid];
        io.emit("updatePlayers", players);
    });
    socket.on("getWallMap", () => {
        io.emit("reciveWallMap", walls);
    })
});
function damageImprints() {
    for (let index in imprints) {
        if (imprints[index] === undefined) return;
        imprints[index].lifetime -= 1;
        imprints[index].alpha = imprints[index].lifetime / imprints[index].maxlifetime * imprints[index].alphaM;
        if (imprints[index].x < 0 || imprints[index].x > 1200 || imprints[index].y > 700 || imprints[index].y < 0) {
            imprints.splice(index, 1);
            return;
        }
        if (imprints[index].lifetime == 0) imprints.splice(index, 1);
    }
}
function moveBullets() {
    let removed = 0;
    for (const i in bullets) {
        imprints.unshift(new imprint(bullets[i - removed], 10, 0.55));
        bullets[i - removed].move();
        if (bullets[i - removed].x + bullets[i - removed].xsize < 0) {
            bullets[i - removed].x = 1200;
            io.emit("updateBullets", bullets);
        }
        if (bullets[i - removed].x > 1200) {
            bullets[i - removed].x = 0 - bullets[i - removed].xsize;
            io.emit("updateBullets", bullets);
        }
        if (bullets[i - removed].y + bullets[i - removed].ysize < 0) {
            bullets[i - removed].y = 700;
            io.emit("updateBullets", bullets);
        }
        if (bullets[i - removed].y > 700) {
            bullets[i - removed].y = 0;
            io.emit("updateBullets", bullets);
        }
        for (const i2 in players) {
            if (checkAABBCollision(bullets[i - removed], players[i2]) && bullets[i - removed].owner != i2) {
                bullets.splice(i - removed, 1);
                removed++;
                players[i2].hp -= 1;
                io.emit("updateBullets", bullets);
                io.emit("updatePlayers", players);
            }
        }
        for (const i2 in walls) {
            if (checkAABBCollision(bullets[i - removed], walls[i2])) {
                bullets.splice(i - removed, 1);
                removed++;
                walls[i2].hp -= 1;
                if (walls[i2].hp <= 0) {
                    walls.splice(i2, 1);
                }
                io.emit("reciveWallMap", walls);
                io.emit("updateBullets", bullets);
            }
        }
    }
}
var lastLoop = new Date();
setInterval(() => {
    var thisLoop = new Date();
    var fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    moveBullets();
    io.emit("sendFPS", fps);
    io.emit("updatePlayers", players);
    damageImprints();
}, 1000 / fps)
const port = 6567;
const host = "192.168.0.105";

server.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}`);
    for (let i in map) {
        for (let i2 in map[i]) {
            switch (map[i][i2]) {
                case "#":
                    walls.unshift(new wall(i2 * sizeUnit, i * sizeUnit, 8));
                    break;
                case 0:
                    break;
                case "@":
                    walls.unshift(new wall(i2 * sizeUnit, i * sizeUnit, 15));
                    break;
            }
        }
    }
    io.emit("reciveWallMap", walls);
})
