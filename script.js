const game = document.getElementById("game");
let player = document.getElementById("player");
let scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const bgm = document.getElementById("bgm");
let pauseBtn = document.getElementById("pauseBtn");
const skinBtn = document.getElementById("skinBtn");
const prevScoreDisplay = document.getElementById("prevScoreDisplay");

let playerX;
let score = 0;
let gameSpeed = 2;
let interval;
let isPlaying = false;
let isPaused = false;
let obstacles = [];
let animationFrameId;
let highScore = localStorage.getItem("highScore") || 0;
highScoreDisplay.textContent = highScore;
let prevScore = localStorage.getItem("prevScore") || 0;
prevScoreDisplay.textContent = prevScore;

let playerSkins = ["images/player1.png", "images/player2.png", "images/player3.png", "images/player4.png", "images/player5.png", "images/player6.png", "images/player7.png", "images/player8.png", "images/player9.png", "images/player10.png", "images/player11.png", "images/player12.png", "images/player13.png", "images/player14.png", "images/player15.png", "images/player16.png", "images/player17.png", "images/player18.png", "images/player19.png", "images/player20.png"]
let currentSkin = parseInt(localStorage.getItem("selectedSkin")) || 0;

const sparkleColors = [
  "#2596be", // light blue for skin 1
  "#50c440", // green for skin 2
  "#90969c", // grey for skin 3
  "#717171", // dark grey for skin 4
  "#faad26", // yellow for skin 5
  "#fe72af", // pink for skin 6
  "#fcd61e", // yellow for skin 7
  "#446c24", // green for skin 8
  "#4b3a8c", // purple for skin 9
  "#b78e56", // brown for skin 10
  "#35332e", // dark grey for skin 11
  "#273345", // blue for skin 12
  "#fafd70", // yellow for skin 13
  "#fee3fb", // pink for skin 14
  "#d0e4fc", // light blue for skin 15
  "#fef3b9", // yellow for skin 16
  "#ec402b", // red for skin 17
  "#6ee4f9", // light blue for skin 18
  "#5c47b4", // purple for skin 19
  "#ce7318", // orange for skin 20
  // add more if needed
];

let useRipple = true;
let isMuted = localStorage.getItem("isMuted") === "true";
let controlsVisible = false;

function updatePlayerSkin() {
  // Update menu and game player images
  const playerMenu = document.getElementById("player-menu");
  if (playerMenu) playerMenu.src = playerSkins[currentSkin];
  if (player) player.src = playerSkins[currentSkin];
}

function showSkinModal() {
  document.getElementById("skinModal").style.display = "flex";
  // Highlight selected
  document.querySelectorAll('.skin-option').forEach((img, idx) => {
    img.classList.toggle('selected', idx === currentSkin);
  });
  scrollSelectedSkinIntoView();
}

function hideSkinModal() {
  document.getElementById("skinModal").style.display = "none";
}

skinBtn.addEventListener("click", showSkinModal);
document.getElementById("closeSkinModal").addEventListener("click", hideSkinModal);

// Skin carousel arrow logic
const skinOptions = document.getElementById('skinOptions');
const skinLeftArrow = document.getElementById('skinLeftArrow');
const skinRightArrow = document.getElementById('skinRightArrow');

function scrollSkinOptions(direction) {
  const scrollAmount = 120; // px
  if (direction === 'left') {
    if (skinOptions.scrollLeft <= 0) {
      // Loop to end
      skinOptions.scrollTo({ left: skinOptions.scrollWidth, behavior: 'smooth' });
    } else {
      skinOptions.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  } else {
    // direction === 'right'
    const maxScroll = skinOptions.scrollWidth - skinOptions.clientWidth - 1;
    if (skinOptions.scrollLeft >= maxScroll) {
      // Loop to start
      skinOptions.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      skinOptions.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
if (skinLeftArrow && skinRightArrow) {
  skinLeftArrow.addEventListener('click', () => scrollSkinOptions('left'));
  skinRightArrow.addEventListener('click', () => scrollSkinOptions('right'));
}

function scrollSelectedSkinIntoView() {
  const selected = skinOptions.querySelector('.skin-option.selected');
  if (selected) selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

document.querySelectorAll('.skin-option').forEach(img => {
  img.addEventListener('click', function() {
    currentSkin = parseInt(this.dataset.index);
    localStorage.setItem("selectedSkin", currentSkin);
    updatePlayerSkin();
    // Highlight selected
    document.querySelectorAll('.skin-option').forEach((img, idx) => {
      img.classList.toggle('selected', idx === currentSkin);
    });
    hideSkinModal();
    scrollSelectedSkinIntoView();
  });
});

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem("isMuted", isMuted);
  document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) {
    bgm.pause();
  } else if (isPlaying) {
    bgm.play();
  }
}

function toggleControls() {
  controlsVisible = !controlsVisible;
  document.querySelector(".controls").style.display = controlsVisible ? "flex" : "none";
}

function resetGame() {
  score = 0;
  gameSpeed = 2;
  scoreDisplay.innerText = "Score: 0";
  game.innerHTML = `
    <div id="score">Score: 0</div>
    <div id="pauseBtn">⏸️</div>
    <div id="muteBtn">${isMuted ? "🔇" : "🔊"}</div>
    <div id="controlsBtn">🎮</div>
    <img id="player" src="${playerSkins[currentSkin]}" alt="Player" />
    <div class="controls" style="display: none;">
      <button id="leftBtn">⟵</button>
      <button id="rightBtn">⟶</button>
    </div>`;
  player = document.getElementById("player");
  pauseBtn = document.getElementById("pauseBtn");
  scoreDisplay = document.getElementById("score");
  obstacles = [];
  attachTouchControls();
  updatePlayerSkin();

  // Wait for DOM to update, then set playerX correctly
  requestAnimationFrame(() => {
    playerX = (game.offsetWidth - player.offsetWidth) / 2;
    player.style.left = playerX + "px";
  });
}

function startGame() {
  menu.style.display = "none";
  game.style.display = "block";
  if (!isMuted) bgm.play();
  isPlaying = true;
  isPaused = false;
  resetGame();

  interval = setInterval(() => {
    if (!isPaused) createObstacle();
  }, 1000);

  loop();
}

function showNotification(message, callback) {
  const popup = document.getElementById("notificationPopup");
  const msg = document.getElementById("notificationMessage");
  popup.style.display = "flex";
  msg.textContent = message;
  const closeBtn = document.getElementById("closeNotification");
  closeBtn.onclick = () => {
    popup.style.display = "none";
    if (callback) callback();
  };
}

function gameOver() {
  isPlaying = false;
  clearInterval(interval);
  cancelAnimationFrame(animationFrameId);
  bgm.pause();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  localStorage.setItem("prevScore", score);
  prevScoreDisplay.textContent = score;

  setTimeout(() => {
    showNotification("💀 Game Over!\nYour Score: " + score, () => {
      menu.style.display = "flex";
      game.style.display = "none";
      highScoreDisplay.textContent = highScore;
    });
  }, 300);
}

function movePlayer(dir) {
  if (!isPlaying || isPaused) return;
  // Make player speed scale with gameSpeed
  const baseSpeed = 15;
  const speed = baseSpeed + (gameSpeed - 2) * 3; // Adjust multiplier as needed

  // Store previous position
  const prevX = playerX;
  const prevY = game.offsetHeight - 20 - player.offsetHeight; // 20 is bottom, player height

  // Move player
  if (dir === "left") playerX -= speed;
  if (dir === "right") playerX += speed;
  const minX = 0;
  const maxX = game.offsetWidth - player.offsetWidth;
  playerX = Math.max(minX, Math.min(maxX, playerX));
  player.style.left = playerX + "px";

  // Sparkle direction: bias angle based on movement
  const angleOffset = dir === "left" ? 0 : Math.PI; // 0 for left, PI for right

  if (useRipple) {
    // Ripple effect
    for (let i = 0; i < 3; i++) {
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      ripple.style.color = sparkleColors[currentSkin] || "#00BFFF";
      // Slightly randomize position
      const angle = Math.random() * 2 * Math.PI;
      const radius = 8 * Math.random();
      const x = prevX + 50 + Math.cos(angle) * radius - 5;
      const y = prevY + Math.sin(angle) * radius - 5;
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      game.appendChild(ripple);

      setTimeout(() => {
        ripple.classList.add("fade");
      }, 10);

      setTimeout(() => {
        ripple.remove();
      }, 610);
    }
  } else {
    // Droplet effect
    for (let i = 0; i < 5; i++) {
      const droplet = document.createElement("div");
      droplet.className = "droplet";
      droplet.style.color = sparkleColors[currentSkin] || "#00BFFF";
      // Randomize position around the player
      const angle = Math.random() * 2 * Math.PI;
      const radius = 10 * Math.random();
      const x = prevX + 50 + Math.cos(angle) * radius - 4;
      const y = prevY + Math.sin(angle) * radius - 4;
      droplet.style.left = x + "px";
      droplet.style.top = y + "px";
      game.appendChild(droplet);

      setTimeout(() => {
        droplet.classList.add("fade");
      }, 10);

      setTimeout(() => {
        droplet.remove();
      }, 510);
    }
  }
  useRipple = !useRipple;
}

function attachTouchControls() {
  document.getElementById("leftBtn").addEventListener("touchstart", () => movePlayer("left"));
  document.getElementById("rightBtn").addEventListener("touchstart", () => movePlayer("right"));
  document.getElementById("leftBtn").addEventListener("click", () => movePlayer("left"));
  document.getElementById("rightBtn").addEventListener("click", () => movePlayer("right"));
  document.getElementById("pauseBtn").addEventListener("click", togglePause);
  document.getElementById("muteBtn").addEventListener("click", toggleMute);
  document.getElementById("controlsBtn").addEventListener("click", toggleControls);
}

document.addEventListener("keydown", (e) => {
  if (!isPlaying || isPaused) return;
  if (e.key === "ArrowLeft") movePlayer("left");
  else if (e.key === "ArrowRight") movePlayer("right");
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

function togglePause() {
  if (!isPlaying) return;
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused ? "▶️" : "⏸️";
  if (!isPaused) loop();
}

function createObstacle() {
  const obs = document.createElement("div");
  obs.className = "obstacle";
  const isPowerUp = Math.random() < 0.15;
  obs.style.backgroundColor = isPowerUp ? "limegreen" : "red";
  obs.dataset.powerup = isPowerUp;
  obs.style.left = Math.random() * (window.innerWidth - 40) + "px";
  obs.style.top = "0px";
  game.appendChild(obs);
  obstacles.push(obs);
}

function loop() {
  if (!isPlaying || isPaused) return;

  obstacles.forEach((obs, i) => {
    let topPos = parseFloat(obs.style.top);
    topPos += gameSpeed;
    obs.style.top = topPos + "px";

    const obsRect = obs.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    if (
      obsRect.left < playerRect.right &&
      obsRect.right > playerRect.left &&
      obsRect.top < playerRect.bottom &&
      obsRect.bottom > playerRect.top
    ) {
      if (obs.dataset.powerup === "true") {
        score += 10;
        obs.remove();
        obstacles.splice(i, 1);
        return;
      } else {
        gameOver();
        return;
      }
    }

    if (topPos > window.innerHeight) {
      obs.remove();
      obstacles.splice(i, 1);
      score++;
      scoreDisplay.innerText = "Score: " + score;
      if (score % 10 === 0) gameSpeed += 0.5;
    }
  });

  animationFrameId = requestAnimationFrame(loop);
}

// On page load, set skin
updatePlayerSkin();

// Initialize mute state
document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
if (isMuted) bgm.pause();

// Prevent scrolling and double-tap zoom during gameplay
function preventScroll(e) {
  if (isPlaying) e.preventDefault();
}
document.addEventListener('touchmove', preventScroll, { passive: false });
document.addEventListener('gesturestart', preventScroll, { passive: false });

// Allow tap/click on left or right half of game area to move player

game.addEventListener("click", function(e) {
  if (!isPlaying || isPaused) return;
  const rect = game.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 2) {
    movePlayer("left");
  } else {
    movePlayer("right");
  }
});

game.addEventListener("touchstart", function(e) {
  if (!isPlaying || isPaused) return;
  if (e.touches.length > 0) {
    const rect = game.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    if (x < rect.width / 2) {
      movePlayer("left");
    } else {
      movePlayer("right");
    }
  }
});
