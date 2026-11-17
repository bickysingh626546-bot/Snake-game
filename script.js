
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const message = document.getElementById("message");

const grid = 20;
const tileCount = canvas.width / grid;

let snake = [];
let food = {};
let direction = "right";
let nextDirection = "right";
let score = 0;
let best = Number(localStorage.getItem("snakeBest")) || 0;

let running = false;
let gameOver = false;
let lastTime = 0;
let accumulator = 0;

const speed = 105;

bestText.textContent = best;

function randomFood() {
    let position;

    do {
        position = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(part =>
        part.x === position.x && part.y === position.y
    ));

    return position;
}

function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = "right";
    nextDirection = "right";
    score = 0;

    scoreText.textContent = score;
    food = randomFood();

    gameOver = false;
    accumulator = 0;
    lastTime = 0;

    draw();
}

function startGame() {
    if (running) return;

    if (gameOver) resetGame();

    running = true;
    message.textContent = "Game Playing... 🐍";
}

function pauseGame() {
    if (!running) return;

    running = false;
    message.textContent = "Game Paused!";
}

function endGame() {
    running = false;
    gameOver = true;

    message.textContent = "Game Over! Restart दबाएँ";

    if (score > best) {
        best = score;
        localStorage.setItem("snakeBest", best);
        bestText.textContent = best;
    }
}

function changeDirection(newDirection) {
    const opposite = {
        up: "down",
        down: "up",
        left: "right",
        right: "left"
    };

    if (newDirection !== opposite[direction]) {
        nextDirection = newDirection;
    }
}

function update() {
    direction = nextDirection;

    const head = { ...snake[0] };

    if (direction === "up") head.y--;
    if (direction === "down") head.y++;
    if (direction === "left") head.x--;
    if (direction === "right") head.x++;

    // Wall collision
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= tileCount ||
        head.y >= tileCount
    ) {
        endGame();
        return;
    }

    const eating = (
        head.x === food.x && head.y === food.y
    );

    const body = eating ? snake : snake.slice(0, -1);

    // Snake body collision
    if (body.some(part =>
        part.x === head.x && part.y === head.y
    )) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        score += 10;
        scoreText.textContent = score;
        food = randomFood();
    } else {
        snake.pop();
    }
}

function draw() {
    // Background
    ctx.fillStyle = "#07140f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#173126";
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= canvas.width; i += grid) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Food
    ctx.fillStyle = "#ff4747";
    ctx.shadowColor = "#ff4747";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(
        food.x * grid + grid / 2,
        food.y * grid + grid / 2,
        grid / 2 - 3,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((part, index) => {
        const padding = 2;

        ctx.fillStyle = index === 0 ? "#a5ffbf" : "#35dc75";

        ctx.beginPath();
        ctx.roundRect(
            part.x * grid + padding,
            part.y * grid + padding,
            grid - padding * 2,
            grid - padding * 2,
            5
        );
        ctx.fill();
    });

    // Snake eyes
    if (snake.length > 0) {
        const head = snake[0];

        ctx.fillStyle = "#10251b";

        let eye1 = { x: 6, y: 6 };
        let eye2 = { x: 14, y: 6 };

        if (direction === "down") {
            eye1 = { x: 6, y: 14 };
            eye2 = { x: 14, y: 14 };
        }

        if (direction === "left") {
            eye1 = { x: 6, y: 6 };
            eye2 = { x: 6, y: 14 };
        }

        if (direction === "right") {
            eye1 = { x: 14, y: 6 };
            eye2 = { x: 14, y: 14 };
        }

        [eye1, eye2].forEach(eye => {
            ctx.beginPath();
            ctx.arc(
                head.x * grid + eye.x,
                head.y * grid + eye.y,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
    }
}

function gameLoop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;

    let delta = Math.min(timestamp - lastTime, 250);
    lastTime = timestamp;

    accumulator += delta;

    while (accumulator >= speed && running) {
        update();
        accumulator -= speed;
    }

    draw();

    if (running) {
        requestAnimationFrame(gameLoop);
    }
}

// Keyboard controls
document.addEventListener("keydown", event => {
    const keys = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    if (keys[event.key]) {
        event.preventDefault();
        changeDirection(keys[event.key]);
    }

    if (event.code === "Space") {
        event.preventDefault();
        running ? pauseGame() : startGame();
    }
});

// Mobile touch controls
document.querySelectorAll("[data-dir]").forEach(button => {
    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        changeDirection(button.dataset.dir);
    });
});

// Buttons
document.getElementById("startBtn").addEventListener("click", () => {
    if (gameOver) resetGame();
    if (!running) {
        startGame();
        requestAnimationFrame(gameLoop);
    }
});

document.getElementById("pauseBtn").addEventListener("click", pauseGame);

document.getElementById("restartBtn").addEventListener("click", () => {
    running = false;
    resetGame();
    message.textContent = "Start Game दबाकर खेल शुरू करें!";
});

// Initial setup
resetGame();
