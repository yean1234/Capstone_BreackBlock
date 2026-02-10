const SCREEN = {
  HOME: "HOME",
  GAME: "GAME",
};

const STATE = {
  NORMAL: "NORMAL",
  FEVER: "FEVER",
  GAMEOVER: "GAMEOVER",
  CLEAR: "CLEAR",
};

const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  INITIAL_LIFE: 3,
  PADDLE_WIDTH: 120,
  PADDLE_HEIGHT: 16,
  PADDLE_SPEED: 520,
  BALL_RADIUS: 8,
  BALL_BASE_SPEED: 300,
  BRICK_ROWS: 6,
  BRICK_COLS: 10,
  BRICK_HEIGHT: 20,
  BRICK_GAP: 8,
  BRICK_TOP_OFFSET: 70,
  BRICK_SIDE_PADDING: 40,
  BRICK_SCORE_NORMAL: 100,
  BRICK_SCORE_FEVER: 150,
  FEVER_SCORE_STEP: 1500,
  FEVER_MAX_DURATION: 15,
  FEVER_SPEED_MULTIPLIER: 1.6,
  GHOST_SPAWN_INTERVAL: 0.15,
  GHOST_MAX_COUNT: 12,
  GHOST_SPEED_MULTIPLIER: 1.3,
  GHOST_SPREAD_RAD: (25 * Math.PI) / 180,
};

const DEBUG_LOGS = true;

const ui = {
  homeScreen: document.getElementById("homeScreen"),
  gameScreen: document.getElementById("gameScreen"),
  startButton: document.getElementById("start-button"),
  hud: document.getElementById("hud"),
  score: document.getElementById("score"),
  life: document.getElementById("life"),
  gameArea: document.getElementById("gameArea"),
  canvas: document.getElementById("game"),
  fever: null,
  clearOverlay: document.getElementById("clearOverlay"),
  clearScore: document.getElementById("clearScore"),
  retryButton: document.getElementById("retryButton"),
};

const ctx = ui.canvas.getContext("2d");
ui.canvas.width = CONFIG.CANVAS_WIDTH;
ui.canvas.height = CONFIG.CANVAS_HEIGHT;

let screenState = SCREEN.HOME;
let gameState = STATE.NORMAL;
let score = 0;
let life = CONFIG.INITIAL_LIFE;
let nextFeverScore = CONFIG.FEVER_SCORE_STEP;
let ghostSpawnTimer = 0;
let ghostSpawnEnabled = false;
let feverElapsed = 0;
let loopRunning = false;
let lastTime = performance.now();
let bricksLeft = 0;
let bricksGenerated = false;
let isGameReady = false;

const keys = {
  left: false,
  right: false,
};

const paddle = {
  width: CONFIG.PADDLE_WIDTH,
  height: CONFIG.PADDLE_HEIGHT,
  x: (CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_WIDTH) / 2,
  y: CONFIG.CANVAS_HEIGHT - 40,
  speed: CONFIG.PADDLE_SPEED,
};

let mainBall = null;
let ghostBalls = [];
let bricks = [];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatScore(value) {
  return value.toLocaleString("en-US");
}

function setScreenState(nextState) {
  screenState = nextState;
  if (screenState === SCREEN.HOME) {
    ui.homeScreen.classList.remove("hidden");
    ui.gameScreen.classList.add("hidden");
    hideFeverUI();
    hideClearOverlay();
  } else {
    ui.homeScreen.classList.add("hidden");
    ui.gameScreen.classList.remove("hidden");
  }
}

function showFeverUI() {
  if (ui.fever) return;
  const fever = document.createElement("div");
  fever.id = "fever";
  const text = document.createElement("span");
  text.className = "fever-text";
  text.textContent = "FEVER";
  fever.append(text);
  ui.gameScreen.insertBefore(fever, ui.gameArea);
  ui.fever = fever;
}

function hideFeverUI() {
  if (!ui.fever) return;
  ui.fever.remove();
  ui.fever = null;
}

function showClearOverlay() {
  ui.clearScore.textContent = formatScore(score);
  ui.clearOverlay.classList.remove("hidden");
  ui.clearOverlay.setAttribute("aria-hidden", "false");
}

function hideClearOverlay() {
  ui.clearOverlay.classList.add("hidden");
  ui.clearOverlay.setAttribute("aria-hidden", "true");
}

function setupBricks() {
  bricks = [];
  const totalGap = (CONFIG.BRICK_COLS - 1) * CONFIG.BRICK_GAP;
  const totalWidth = CONFIG.CANVAS_WIDTH - CONFIG.BRICK_SIDE_PADDING * 2 - totalGap;
  const brickWidth = totalWidth / CONFIG.BRICK_COLS;

  for (let row = 0; row < CONFIG.BRICK_ROWS; row += 1) {
    for (let col = 0; col < CONFIG.BRICK_COLS; col += 1) {
      bricks.push({
        x: CONFIG.BRICK_SIDE_PADDING + col * (brickWidth + CONFIG.BRICK_GAP),
        y: CONFIG.BRICK_TOP_OFFSET + row * (CONFIG.BRICK_HEIGHT + CONFIG.BRICK_GAP),
        width: brickWidth,
        height: CONFIG.BRICK_HEIGHT,
        alive: true,
        row,
      });
    }
  }

  if (bricks.length === 0) {
    const fallbackWidth = 80;
    bricks.push({
      x: (CONFIG.CANVAS_WIDTH - fallbackWidth) / 2,
      y: CONFIG.BRICK_TOP_OFFSET,
      width: fallbackWidth,
      height: CONFIG.BRICK_HEIGHT,
      alive: true,
      row: 0,
    });
  }
}

function updateHud() {
  ui.score.textContent = score;
  ui.life.textContent = life;
}

function createMainBall() {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - CONFIG.BALL_RADIUS - 2,
    radius: CONFIG.BALL_RADIUS,
    speed: CONFIG.BALL_BASE_SPEED,
    vx: 0,
    vy: 0,
    launched: false,
    active: true,
  };
}

function resetMainBall() {
  mainBall.x = paddle.x + paddle.width / 2;
  mainBall.y = paddle.y - mainBall.radius - 2;
  mainBall.vx = 0;
  mainBall.vy = 0;
  mainBall.launched = false;
  mainBall.active = true;
}

function setMainBallSpeed(speed) {
  mainBall.speed = speed;
  if (!mainBall.launched || !mainBall.active) return;
  const angle = Math.atan2(mainBall.vy, mainBall.vx);
  mainBall.vx = Math.cos(angle) * speed;
  mainBall.vy = Math.sin(angle) * speed;
}

function launchMainBall() {
  if (gameState === STATE.GAMEOVER || gameState === STATE.CLEAR) return;
  if (!mainBall.active || mainBall.launched) return;

  const launchAngle = (-60 * Math.PI) / 180;
  mainBall.vx = Math.cos(launchAngle) * mainBall.speed;
  mainBall.vy = Math.sin(launchAngle) * mainBall.speed;
  mainBall.launched = true;
}

function addScore(points) {
  score += points;
  updateHud();

  if (gameState === STATE.NORMAL && score >= nextFeverScore) {
    startFever();
  }
}

function startFever() {
  gameState = STATE.FEVER;
  ghostSpawnEnabled = true;
  ghostSpawnTimer = 0;
  feverElapsed = 0;
  showFeverUI();
  setMainBallSpeed(CONFIG.BALL_BASE_SPEED * CONFIG.FEVER_SPEED_MULTIPLIER);
}

function endFever() {
  gameState = STATE.NORMAL;
  hideFeverUI();
  ghostBalls = [];
  ghostSpawnEnabled = false;
  feverElapsed = 0;
  nextFeverScore = score + CONFIG.FEVER_SCORE_STEP;
  mainBall = createMainBall();
  setMainBallSpeed(CONFIG.BALL_BASE_SPEED);
  resetMainBall();
}

function triggerClear() {
  gameState = STATE.CLEAR;
  ghostSpawnEnabled = false;
  ghostBalls = [];
  hideFeverUI();
  showClearOverlay();
}

function spawnGhostBall() {
  if (!ghostSpawnEnabled) return;
  if (!mainBall.active || !mainBall.launched) return;
  if (ghostBalls.length >= CONFIG.GHOST_MAX_COUNT) return;

  const baseAngle = Math.atan2(mainBall.vy, mainBall.vx);
  const spread = (Math.random() * 2 - 1) * CONFIG.GHOST_SPREAD_RAD;
  const angle = baseAngle + spread;
  const speed = mainBall.speed * CONFIG.GHOST_SPEED_MULTIPLIER;

  ghostBalls.push({
    x: mainBall.x,
    y: mainBall.y,
    radius: mainBall.radius,
    speed,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  });
}

function updatePaddle(dt) {
  if (keys.left) paddle.x -= paddle.speed * dt;
  if (keys.right) paddle.x += paddle.speed * dt;
  paddle.x = clamp(paddle.x, 0, CONFIG.CANVAS_WIDTH - paddle.width);
}

function bounceOffWalls(ball) {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x + ball.radius >= CONFIG.CANVAS_WIDTH) {
    ball.x = CONFIG.CANVAS_WIDTH - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }
}

function handlePaddleCollision(ball, prevX = ball.x, prevY = ball.y) {
  if (ball.vy <= 0) return;

  const prevBottom = prevY + ball.radius;
  const currBottom = ball.y + ball.radius;
  const crossedTop = prevBottom <= paddle.y && currBottom >= paddle.y;
  const withinBand = currBottom >= paddle.y && currBottom <= paddle.y + paddle.height;

  if (!crossedTop && !withinBand) return;
  if (ball.x < paddle.x - ball.radius || ball.x > paddle.x + paddle.width + ball.radius) return;

  const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  const clamped = clamp(hitPoint, -1, 1);
  const maxBounce = (60 * Math.PI) / 180;
  const bounceAngle = clamped * maxBounce;
  const speed = ball.speed ?? Math.hypot(ball.vx, ball.vy);

  ball.vx = Math.sin(bounceAngle) * speed;
  ball.vy = -Math.cos(bounceAngle) * speed;
  ball.y = paddle.y - ball.radius - 1;
}

function handleBrickCollision(ball) {
  for (let i = 0; i < bricks.length; i += 1) {
    const brick = bricks[i];
    if (!brick.alive) continue;

    const closestX = clamp(ball.x, brick.x, brick.x + brick.width);
    const closestY = clamp(ball.y, brick.y, brick.y + brick.height);
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    if (dx * dx + dy * dy <= ball.radius * ball.radius) {
      brick.alive = false;
      if (bricksLeft > 0) bricksLeft -= 1;
      const rectCenterX = brick.x + brick.width / 2;
      const rectCenterY = brick.y + brick.height / 2;
      const distX = ball.x - rectCenterX;
      const distY = ball.y - rectCenterY;
      const overlapX = brick.width / 2 + ball.radius - Math.abs(distX);
      const overlapY = brick.height / 2 + ball.radius - Math.abs(distY);

      if (overlapX < overlapY) {
        ball.vx *= -1;
        ball.x += distX > 0 ? overlapX : -overlapX;
      } else {
        ball.vy *= -1;
        ball.y += distY > 0 ? overlapY : -overlapY;
      }

      const points = gameState === STATE.FEVER
        ? CONFIG.BRICK_SCORE_FEVER
        : CONFIG.BRICK_SCORE_NORMAL;
      addScore(points);
      break;
    }
  }
}

function updateMainBall(dt) {
  if (!mainBall.active) return;

  if (!mainBall.launched) {
    mainBall.x = paddle.x + paddle.width / 2;
    mainBall.y = paddle.y - mainBall.radius - 2;
    return;
  }

  const prevX = mainBall.x;
  const prevY = mainBall.y;
  mainBall.x += mainBall.vx * dt;
  mainBall.y += mainBall.vy * dt;

  bounceOffWalls(mainBall);
  handlePaddleCollision(mainBall, prevX, prevY);
  handleBrickCollision(mainBall);

  if (mainBall.y - mainBall.radius > CONFIG.CANVAS_HEIGHT) {
    if (gameState === STATE.FEVER) {
      mainBall.active = false;
      mainBall.launched = false;
      ghostSpawnEnabled = false;
    } else {
      life -= 1;
      updateHud();
      if (life <= 0) {
        gameState = STATE.GAMEOVER;
        hideFeverUI();
      } else {
        resetMainBall();
      }
    }
  }
}

function updateGhostBalls(dt) {
  ghostBalls = ghostBalls.filter((ghost) => {
    const prevX = ghost.x;
    const prevY = ghost.y;
    ghost.x += ghost.vx * dt;
    ghost.y += ghost.vy * dt;

    bounceOffWalls(ghost);
    handlePaddleCollision(ghost, prevX, prevY);
    handleBrickCollision(ghost);

    if (ghost.y - ghost.radius > CONFIG.CANVAS_HEIGHT) return false;
    return true;
  });
}

function checkClearCondition() {
  if (!bricksGenerated) return;
  if (gameState !== STATE.NORMAL && gameState !== STATE.FEVER) return;
  if (bricksLeft !== 0) return;
  triggerClear();
}

function update(dt) {
  if (gameState === STATE.GAMEOVER || gameState === STATE.CLEAR) return;
  if (!isGameReady) return;

  updatePaddle(dt);
  updateMainBall(dt);

  if (gameState === STATE.FEVER) {
    feverElapsed += dt;
    ghostSpawnTimer += dt;
    while (ghostSpawnTimer >= CONFIG.GHOST_SPAWN_INTERVAL) {
      spawnGhostBall();
      ghostSpawnTimer -= CONFIG.GHOST_SPAWN_INTERVAL;
    }
    updateGhostBalls(dt);

    if (feverElapsed >= CONFIG.FEVER_MAX_DURATION) {
      endFever();
      return;
    }

    if (!mainBall.active && ghostBalls.length === 0) {
      endFever();
    }
  }

  if (DEBUG_LOGS && bricksGenerated && (gameState === STATE.NORMAL || gameState === STATE.FEVER)) {
    console.log("[CLEAR CHECK] bricksLeft", bricksLeft);
  }
  checkClearCondition();
}

function drawBricks() {
  const colors = ["#2dd4bf", "#60a5fa", "#f97316", "#facc15", "#f472b6", "#a78bfa"];
  bricks.forEach((brick) => {
    if (!brick.alive) return;
    ctx.fillStyle = colors[brick.row % colors.length];
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  });
}

function drawPaddle() {
  ctx.fillStyle = "#4fb0ff";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall(ball, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = "#0f1720";
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  drawBricks();
  drawPaddle();

  if (mainBall.active) {
    drawBall(mainBall, "#f8fafc");
  }

  if (ghostBalls.length > 0) {
    ghostBalls.forEach((ghost) => drawBall(ghost, "#f8fafc"));
  }

  if (gameState === STATE.GAMEOVER) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "36px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
  }
}

function resetGame() {
  isGameReady = false;
  gameState = STATE.NORMAL;
  score = 0;
  life = CONFIG.INITIAL_LIFE;
  keys.left = false;
  keys.right = false;
  paddle.x = (CONFIG.CANVAS_WIDTH - paddle.width) / 2;
  ghostBalls = [];
  ghostSpawnEnabled = false;
  ghostSpawnTimer = 0;
  feverElapsed = 0;
  nextFeverScore = CONFIG.FEVER_SCORE_STEP;
  setupBricks();
  bricksLeft = bricks.filter((brick) => brick.alive).length;
  bricksGenerated = bricksLeft > 0;
  mainBall = createMainBall();
  setMainBallSpeed(CONFIG.BALL_BASE_SPEED);
  resetMainBall();
  updateHud();
  hideFeverUI();
  hideClearOverlay();
  isGameReady = true;
  if (DEBUG_LOGS) {
    const expected = CONFIG.BRICK_ROWS * CONFIG.BRICK_COLS;
    console.log(
      "[START] bricksLeft",
      bricksLeft,
      "bricks",
      `${bricks.length}/${expected}`,
      "gameState",
      gameState
    );
  }
}

function loop(now) {
  if (screenState !== SCREEN.GAME) {
    lastTime = now;
    requestAnimationFrame(loop);
    return;
  }

  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function startLoop() {
  if (loopRunning) {
    lastTime = performance.now();
    return;
  }
  loopRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

ui.startButton.addEventListener("click", () => {
  setScreenState(SCREEN.GAME);
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);
  resetGame();
  startLoop();
});

ui.retryButton.addEventListener("click", () => {
  if (screenState !== SCREEN.GAME) return;
  resetGame();
});

window.addEventListener("keydown", (event) => {
  if (screenState !== SCREEN.GAME) return;
  if (gameState === STATE.CLEAR) return;
  if (event.code === "ArrowLeft") {
    keys.left = true;
  }
  if (event.code === "ArrowRight") {
    keys.right = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    launchMainBall();
  }
});

window.addEventListener("keyup", (event) => {
  if (screenState !== SCREEN.GAME) return;
  if (event.code === "ArrowLeft") keys.left = false;
  if (event.code === "ArrowRight") keys.right = false;
});

setScreenState(SCREEN.HOME);
