class player {
    constructor(x, y, color, name) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.xsize = 50;
        this.hp = 10;
        this.name = name;
        this.ysize = 50;
        this.render = () => {
            socket.emit("addImprint", this, 15, 0.25);
            ctx.strokeStyle = "white";
            ctx.strokeRect(this.x, this.y, this.xsize, this.ysize);
            ctx.fillStyle = "white";
            ctx.font = "28px Arial";
            ctx.fillText(this.hp, this.x, this.y + 28);
            ctx.fillStyle = this.color;
            ctx.fillText(this.name, this.x, this.y - 10);
        }
    }
}