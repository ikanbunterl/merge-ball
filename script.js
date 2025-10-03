// script.js - BALL MERGE CLICKER - FINAL FIX VERSION - OPTIMIZED RENDER

// =================================================================
// 1. GAME STATE
// =================================================================
let money = 100000;
let level = 7;
let ballProfit = 1;
let availableBalls = 5;
let pins = [];
let balls = []; // Array bola, setiap bola sekarang memiliki properti .element
let autoSpawnActive = false;
let autoSpawnInterval = null;
let autoSpawnRate = 1000;

// Achievement State
let achievements = {
  first_merge: { unlocked: false, name: "First Merge", desc: "Merge 2 balls", reward: 1000 },
  money_100k: { unlocked: false, name: "100K Club", desc: "Earn 100K $", reward: 5000 },
  ball_level_64: { unlocked: false, name: "Level 64", desc: "Get a ball with value 64", reward: 10000 },
  merge_100: { unlocked: false, name: "100 Merges", desc: "Merge 100 times", reward: 50000 },
  bounce_1000: { unlocked: false, name: "1000 Bounces", desc: "Bounce balls 1000 times", reward: 100000 }
};

let totalMerges = 0;
let totalBounces = 0;

// Mini Game State
let currentBallColor = '';
let currentBallName = '';
let colorOptions = [];
let currentStreak = 0;
let isHardMode = false;
const baseReward = 500;
const streakBonus = 100;
const hardModeMultiplier = 2;

// Update Log
const updateLog = [
  {
    version: "Beta 1.0.0",
    changes: [
      "Game pertama kali dirilis.",
      "Fitur dasar merge & spawn bola.",
      "Sistem uang & upgrade dasar."
    ]
  },
  {
    version: "Beta 1.1.0",
    changes: [
      "Tambah efek glow, bloom, halo, shine, pulsing, sparkle.",
      "Perbaikan UI & animasi bola.",
      "Fitur save/load game."
    ]
  },
  {
    version: "Beta 1.2.0",
    changes: [
      "Tambah sistem achievement.",
      "Notifikasi achievement stack.",
      "Fitur mini game tebak warna bola."
    ]
  },
  {
    version: "Beta 1.3.0",
    changes: [
      "Tambah sistem streak bonus di mini game.",
      "Tambah mode hard di mini game.",
      "Perbaikan bug UI modal.",
      "Tambah notifikasi update saat ada versi baru.",
      "Tambah fitur reset progress."
    ]
  },
  {
    version: "Beta 1.3.1",
    changes: [
      "Implementasi tombol MAX dan x3 di sidebar kiri.",
      "MAX men-spawn semua bola yang tersedia.",
      "x3 menggandakan kecepatan semua bola secara instan."
    ]
  },
  {
    version: "Beta 1.4.0",
    changes: [
      "Optimasi performa render bola.",
      "Gunakan referensi elemen bola untuk update cepat.",
      "Hapus renderPins() dari game loop utama."
    ]
  }
];

// Current version
const currentVersion = "Beta 1.4.0";

// =================================================================
// 2. DOM ELEMENTS & CONSTANTS
// =================================================================
const moneyEl = document.querySelector('.money');
const levelEl = document.querySelector('.level');
const gameArea = document.getElementById('gameArea');
const autoSpawnBtn = document.getElementById('autoSpawnBtn');
const settingsBtn = document.getElementById('settingsBtn');
const paintBtn = document.getElementById('paintBtn');
const achievementBtn = document.getElementById('achievementBtn');
const minigameBtn = document.getElementById('minigameBtn');
const updateLogBtn = document.getElementById('updateLogBtn');
const settingsModal = document.getElementById('settingsModal');
const achievementModal = document.getElementById('achievementModal');
const minigameModal = document.getElementById('minigameModal');
const updateLogModal = document.getElementById('updateLogModal');
const closeModal = document.querySelector('.close');
const closeAchievementModal = document.querySelector('.close-achievement');
const closeMinigameModal = document.querySelector('.close-minigame');
const closeUpdateLogModal = document.querySelector('.close-update-log');
const notificationContainer = document.getElementById('achievementNotificationContainer');
const ballDisplay = document.getElementById('ballDisplay');
const colorOptionsEl = document.getElementById('colorOptions');
const minigameResult = document.getElementById('minigameResult');
const minigamePlayBtn = document.getElementById('minigamePlayBtn');
const hardModeToggle = document.getElementById('hardModeToggle');
const streakDisplay = document.querySelector('.streak-display span');
const updateLogContent = document.getElementById('updateLogContent');
const resetProgressBtn = document.getElementById('resetProgressBtn');
const maxBtn = document.querySelector('.sidebar-left .max');
const x3Btn = document.querySelector('.sidebar-left .x3');

// Update Notification Element
const updateNotification = document.createElement('div');
updateNotification.id = 'updateNotification';
updateNotification.innerHTML = `
  <div class="update-notification-content">
    <div class="update-notification-title">🎉 New Update Available!</div>
    <div class="update-notification-desc">Click to see what's new</div>
  </div>
`;
document.body.appendChild(updateNotification);

// =================================================================
// 3. UTILITY FUNCTIONS
// =================================================================
function formatMoney(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T $';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B $';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M $';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K $';
  return num.toFixed(0) + ' $';
}

function formatShortMoney(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(0);
}

function calculateUpgradeCost(type) {
  switch (type) {
    case 'addBall':
      return 1800 * Math.pow(1.5, availableBalls - 5);
    case 'ballProfit':
      return 66700 * Math.pow(2, ballProfit - 1);
    case 'addPin':
      return 47600 * Math.pow(2, pins.length);
    case 'mergePins':
      return 119200 * Math.pow(2, pins.filter(p => p.active).length);
    default:
      return Infinity;
  }
}

function getBallSize(value) {
  return 28 + (value / 2);
}

function getBallGradient(value) {
  const gradients = {
    2: 'linear-gradient(45deg, #FF5722, #FF9800)',
    4: 'linear-gradient(45deg, #FF9800, #FFC107)',
    8: 'linear-gradient(45deg, #FFC107, #4CAF50)',
    16: 'linear-gradient(45deg, #4CAF50, #2196F3)',
    32: 'linear-gradient(45deg, #2196F3, #9C27B0)',
    64: 'linear-gradient(45deg, #9C27B0, #E91E63)',
    128: 'linear-gradient(45deg, #E91E63, #00BCD4)',
    256: 'linear-gradient(45deg, #00BCD4, #607D8B)',
    512: 'linear-gradient(45deg, #607D8B, #FF5722)',
    1024: 'linear-gradient(45deg, #FF5722, #607D8B)'
  };

  if (gradients[value]) {
    return gradients[value];
  } else {
    const hue1 = (Math.log2(value) * 30) % 360;
    const hue2 = (hue1 + 90) % 360;
    return `linear-gradient(45deg, hsl(${hue1}, 80%, 50%), hsl(${hue2}, 80%, 50%))`;
  }
}

function getBallColorName(value) {
  const colors = {
    2: 'Merah',
    4: 'Oranye',
    8: 'Kuning',
    16: 'Hijau',
    32: 'Biru',
    64: 'Ungu',
    128: 'Pink',
    256: 'Cyan',
    512: 'Abu',
    1024: 'Emas'
  };

  if (colors[value]) {
    return colors[value];
  } else {
    // For dynamic values, return a generic name
    return 'Acak';
  }
}

function getBloomSize(value) {
  return Math.min(50, 15 + Math.log2(value) * 5);
}

function getHaloSize(value) {
  return Math.min(80, 30 + Math.log2(value) * 8);
}

function getShineSpeed(value) {
  return Math.max(1, 3 - Math.log2(value) * 0.2);
}

function getGlowIntensity(value) {
  return Math.min(10 + Math.log2(value) * 2, 30);
}

function getBallPulseSpeed(value) {
  return Math.max(0.5, 2 - Math.log2(value) * 0.1);
}

function getBallSparkleCount(value) {
  return Math.min(5, Math.floor(Math.log2(value) / 2));
}

function getBallSpeedMultiplier(value) {
  return 1 + Math.log2(value) * 0.1;
}

function getBallColorFromGradient(value) {
  const gradients = {
    2: '#FF5722',
    4: '#FF9800',
    8: '#FFC107',
    16: '#4CAF50',
    32: '#2196F3',
    64: '#9C27B0',
    128: '#E91E63',
    256: '#00BCD4',
    512: '#607D8B',
    1024: '#FF5722'
  };

  if (gradients[value]) {
    return gradients[value];
  } else {
    const hue1 = (Math.log2(value) * 30) % 360;
    return `hsl(${hue1}, 80%, 50%)`;
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}

// Create sparkle effect
function createSparkle(x, y, color) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  sparkle.style.background = color;

  gameArea.appendChild(sparkle);

  // Remove after animation
  setTimeout(() => {
    sparkle.remove();
  }, 1000);
}

// =================================================================
// 4. GAME LOGIC
// =================================================================
// Spawn Ball - Sekarang membuat elemen bola dan menyimpannya
function spawnBall() {
  if (availableBalls <= 0) return;

  const x = Math.random() * (gameArea.clientWidth - 30);
  const y = Math.random() * (gameArea.clientHeight - 30);

  const speedMult = getBallSpeedMultiplier(2);
  const vx = (Math.random() - 0.5) * 5 * speedMult;
  const vy = (Math.random() - 0.5) * 5 * speedMult;

  const ball = {
    x,
    y,
    vx,
    vy,
    value: 2,
    radius: getBallSize(2) / 2,
    trail: [],
    element: null, // Akan diisi nanti
    valueLabel: null // Akan diisi nanti
  };

  // Buat elemen bola
  const ballEl = document.createElement('div');
  ballEl.className = 'ball';
  ballEl.style.left = `${ball.x}px`;
  ballEl.style.top = `${ball.y}px`;
  ballEl.style.width = `${getBallSize(ball.value)}px`;
  ballEl.style.height = `${getBallSize(ball.value)}px`;
  ballEl.style.borderRadius = '50%';
  ballEl.style.background = getBallGradient(ball.value);
  // Set glow
  const intensity = getGlowIntensity(ball.value);
  ballEl.style.boxShadow = `0 0 ${intensity}px ${getBallColorFromGradient(ball.value)}, 0 0 ${intensity * 2}px ${getBallColorFromGradient(ball.value)}`;
  // Set pulsing animation
  const pulseSpeed = getBallPulseSpeed(ball.value);
  ballEl.style.animation = `pulse ${pulseSpeed}s infinite`;
  ballEl.textContent = ball.value;

  // Add bloom effect
  const bloomSize = getBloomSize(ball.value);
  const bloomEl = document.createElement('div');
  bloomEl.style.position = 'absolute';
  bloomEl.style.top = '50%';
  bloomEl.style.left = '50%';
  bloomEl.style.transform = 'translate(-50%, -50%)';
  bloomEl.style.width = `${getBallSize(ball.value) + bloomSize}px`;
  bloomEl.style.height = `${getBallSize(ball.value) + bloomSize}px`;
  bloomEl.style.borderRadius = '50%';
  bloomEl.style.background = getBallGradient(ball.value);
  bloomEl.style.filter = `blur(${bloomSize / 3}px)`;
  bloomEl.style.zIndex = '-1';
  ballEl.appendChild(bloomEl);

  // Add halo effect
  const haloSize = getHaloSize(ball.value);
  const haloEl = document.createElement('div');
  haloEl.style.position = 'absolute';
  haloEl.style.top = '50%';
  haloEl.style.left = '50%';
  haloEl.style.transform = 'translate(-50%, -50%)';
  haloEl.style.width = `${getBallSize(ball.value) + haloSize}px`;
  haloEl.style.height = `${getBallSize(ball.value) + haloSize}px`;
  haloEl.style.borderRadius = '50%';
  haloEl.style.background = getBallGradient(ball.value);
  haloEl.style.filter = `blur(${haloSize / 4}px)`;
  haloEl.style.zIndex = '-2';
  ballEl.appendChild(haloEl);

  // Add shine effect
  const shineSpeed = getShineSpeed(ball.value);
  const shineEl = document.createElement('div');
  shineEl.className = 'shine';
  const style = document.createElement('style');
  style.textContent = `
    .shine-${ball.value} {
      animation: rotate ${shineSpeed}s linear infinite;
    }
  `;
  document.head.appendChild(style);
  shineEl.classList.add(`shine-${ball.value}`);
  ballEl.appendChild(shineEl);

  // Add value label above
  const valueLabel = document.createElement('div');
  valueLabel.className = 'ball-value';
  valueLabel.textContent = ball.value;
  ballEl.appendChild(valueLabel);

  gameArea.appendChild(ballEl);

  // Simpan referensi elemen ke objek bola
  ball.element = ballEl;
  ball.valueLabel = valueLabel;

  balls.push(ball);
  availableBalls--;
  updateUI();
}

// Show coin pop animation
function showCoinPop(x, y, amount) {
  const coin = document.createElement('div');
  coin.className = 'coin-pop';
  coin.textContent = `+${amount}`;
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;

  gameArea.appendChild(coin);

  // Remove after animation
  setTimeout(() => {
    coin.remove();
  }, 1000);
}

// Check for mergeable balls - Perbarui logika merge untuk menghapus elemen DOM juga
function checkMerges() {
  for (let i = balls.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      const ball1 = balls[i];
      const ball2 = balls[j];

      // Calculate distance
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If same value and close enough (adjust distance based on ball size)
      const minDistance = (getBallSize(ball1.value) / 2) + (getBallSize(ball2.value) / 2);
      if (ball1.value === ball2.value && distance < minDistance) {
        // Create new merged ball
        const newValue = ball1.value * 2;
        const newX = (ball1.x + ball2.x) / 2;
        const newY = (ball1.y + ball2.y) / 2;

        // Use new speed multiplier for merged ball
        const speedMult = getBallSpeedMultiplier(newValue);
        const newVx = (ball1.vx + ball2.vx) / 2 * speedMult;
        const newVy = (ball1.vy + ball2.vy) / 2 * speedMult;

        const newBall = {
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          value: newValue,
          radius: getBallSize(newValue) / 2,
          trail: [],
          element: null, // Akan diisi nanti
          valueLabel: null // Akan diisi nanti
        };

        // Buat elemen bola baru untuk merged ball (mirip spawnBall)
        const newBallEl = document.createElement('div');
        newBallEl.className = 'ball merge-effect';
        newBallEl.style.left = `${newX}px`;
        newBallEl.style.top = `${newY}px`;
        newBallEl.style.width = `${getBallSize(newValue)}px`;
        newBallEl.style.height = `${getBallSize(newValue)}px`;
        newBallEl.style.borderRadius = '50%';
        newBallEl.style.background = getBallGradient(newValue);
        // Set glow for merged ball
        const intensity = getGlowIntensity(newValue);
        newBallEl.style.boxShadow = `0 0 ${intensity}px ${getBallColorFromGradient(newValue)}, 0 0 ${intensity * 2}px ${getBallColorFromGradient(newValue)}`;
        // Set pulsing for merged ball
        const pulseSpeed = getBallPulseSpeed(newValue);
        newBallEl.style.animation = `pulse ${pulseSpeed}s infinite`;
        // Set bloom for merged ball
        const bloomSize = getBloomSize(newValue);
        const bloomEl = document.createElement('div');
        bloomEl.style.position = 'absolute';
        bloomEl.style.top = '50%';
        bloomEl.style.left = '50%';
        bloomEl.style.transform = 'translate(-50%, -50%)';
        bloomEl.style.width = `${getBallSize(newValue) + bloomSize}px`;
        bloomEl.style.height = `${getBallSize(newValue) + bloomSize}px`;
        bloomEl.style.borderRadius = '50%';
        bloomEl.style.background = getBallGradient(newValue);
        bloomEl.style.filter = `blur(${bloomSize / 3}px)`;
        bloomEl.style.zIndex = '-1';
        newBallEl.appendChild(bloomEl);
        // Set halo for merged ball
        const haloSize = getHaloSize(newValue);
        const haloEl = document.createElement('div');
        haloEl.style.position = 'absolute';
        haloEl.style.top = '50%';
        haloEl.style.left = '50%';
        haloEl.style.transform = 'translate(-50%, -50%)';
        haloEl.style.width = `${getBallSize(newValue) + haloSize}px`;
        haloEl.style.height = `${getBallSize(newValue) + haloSize}px`;
        haloEl.style.borderRadius = '50%';
        haloEl.style.background = getBallGradient(newValue);
        haloEl.style.filter = `blur(${haloSize / 4}px)`;
        haloEl.style.zIndex = '-2';
        newBallEl.appendChild(haloEl);
        // Set shine for merged ball
        const shineSpeed = getShineSpeed(newValue);
        const shineEl = document.createElement('div');
        shineEl.className = 'shine';
        const style = document.createElement('style');
        style.textContent = `
          .shine-${newValue} {
            animation: rotate ${shineSpeed}s linear infinite;
          }
        `;
        document.head.appendChild(style);
        shineEl.classList.add(`shine-${newValue}`);
        newBallEl.appendChild(shineEl);
        newBallEl.textContent = newValue;

        // Add value label above merged ball
        const valueLabel = document.createElement('div');
        valueLabel.className = 'ball-value';
        valueLabel.textContent = newValue;
        newBallEl.appendChild(valueLabel);

        gameArea.appendChild(newBallEl);

        // Simpan referensi elemen ke objek bola baru
        newBall.element = newBallEl;
        newBall.valueLabel = valueLabel;

        // Remove old balls (hapus dari array dan DOM)
        const ballToRemove = balls.splice(Math.max(i, j), 1)[0];
        if (ballToRemove.element) ballToRemove.element.remove();
        const ballToRemove2 = balls.splice(Math.min(i, j), 1)[0];
        if (ballToRemove2.element) ballToRemove2.element.remove();

        // Add new ball
        balls.push(newBall);

        // Hapus efek merge setelah selesai
        setTimeout(() => {
          if (newBallEl) newBallEl.remove();
          // Tidak perlu renderPins() lagi karena kita update elemen langsung
        }, 500);

        // Earn money from merge
        money += newValue * ballProfit;
        showCoinPop(newX, newY, formatShortMoney(newValue * ballProfit));
        updateUI();

        // Update merge counter
        totalMerges++;
        checkAchievements('merge', newValue);
      }
    }
  }
}

// Game Loop — Update ball positions and check collisions - Sekarang hanya update elemen DOM
function startGameLoop() {
  // Gunakan requestAnimationFrame alih-alih setInterval
  function gameLoop() {
    balls.forEach((ball, i) => {
      // Add current position to trail (opsional, bisa dihapus untuk performa lebih tinggi)
      ball.trail.push({ x: ball.x + ball.radius, y: ball.y + ball.radius, opacity: 0.8 });

      // Keep trail length max 10 (opsional)
      if (ball.trail.length > 10) {
        ball.trail.shift();
      }

      // Move ball with its speed multiplier
      const speedMult = getBallSpeedMultiplier(ball.value);
      ball.x += ball.vx / speedMult;
      ball.y += ball.vy / speedMult;

      // Update posisi elemen bola secara langsung
      if (ball.element) {
        ball.element.style.left = `${ball.x}px`;
        ball.element.style.top = `${ball.y}px`;
        // Update nilai label jika berubah (meskipun seharusnya tidak dalam loop ini)
        if (ball.valueLabel) {
            ball.valueLabel.textContent = ball.value;
        }
      }

      // Check boundaries (adjust for ball size)
      const ballSize = getBallSize(ball.value);
      if (ball.x <= 0 || ball.x >= gameArea.clientWidth - ballSize) {
        ball.vx *= -1;
        earnMoney(ball.x, ball.y, ball.value);
        totalBounces++;
        checkAchievements('bounce');
      }

      if (ball.y <= 0 || ball.y >= gameArea.clientHeight - ballSize) {
        ball.vy *= -1;
        earnMoney(ball.x, ball.y, ball.value);
        totalBounces++;
        checkAchievements('bounce');
      }

      // Sparkle effect
      if (Math.random() < 0.05) {
        const sparkleCount = getBallSparkleCount(ball.value);
        for (let s = 0; s < sparkleCount; s++) {
          const offsetX = (Math.random() - 0.5) * ballSize;
          const offsetY = (Math.random() - 0.5) * ballSize;
          createSparkle(ball.x + ball.radius + offsetX, ball.y + ball.radius + offsetY, getBallColorFromGradient(ball.value));
        }
      }
    });

    // Check for merges
    checkMerges();

    // Panggil lagi frame berikutnya
    requestAnimationFrame(gameLoop);
  }

  // Mulai loop
  requestAnimationFrame(gameLoop);
}

function earnMoney(x, y, value) {
  const profit = value * ballProfit;
  money += profit;
  showCoinPop(x, y, formatShortMoney(profit));
  updateUI();
  checkAchievements('money');
}

// =================================================================
// 5. UPGRADES & ACTIONS
// =================================================================
function addPin() {
  availableBalls += 1;
  updateUI();
}

function applyUpgrade(type) {
  switch (type) {
    case 'addBall':
      availableBalls += 1;
      spawnBall();
      break;
    case 'ballProfit':
      ballProfit += 1;
      break;
    case 'addPin':
      availableBalls += 1;
      break;
    case 'mergePins':
      if (pins.length >= 2) {
        mergePins();
      } else {
        alert("You need at least 2 pins to merge!");
      }
      break;
  }
}

function mergePins() {
  alert("Merge Pins feature coming soon!");
}

// =================================================================
// 6. ACHIEVEMENTS
// =================================================================
function checkAchievements(type, value = null) {
  if (type === 'merge' && !achievements.first_merge.unlocked) {
    achievements.first_merge.unlocked = true;
    money += achievements.first_merge.reward;
    showAchievementNotification(achievements.first_merge.name, achievements.first_merge.reward);
  }

  if (type === 'money' && money >= 100000 && !achievements.money_100k.unlocked) {
    achievements.money_100k.unlocked = true;
    money += achievements.money_100k.reward;
    showAchievementNotification(achievements.money_100k.name, achievements.money_100k.reward);
  }

  if (type === 'merge' && value >= 64 && !achievements.ball_level_64.unlocked) {
    achievements.ball_level_64.unlocked = true;
    money += achievements.ball_level_64.reward;
    showAchievementNotification(achievements.ball_level_64.name, achievements.ball_level_64.reward);
  }

  if (type === 'merge' && totalMerges >= 100 && !achievements.merge_100.unlocked) {
    achievements.merge_100.unlocked = true;
    money += achievements.merge_100.reward;
    showAchievementNotification(achievements.merge_100.name, achievements.merge_100.reward);
  }

  if (type === 'bounce' && totalBounces >= 1000 && !achievements.bounce_1000.unlocked) {
    achievements.bounce_1000.unlocked = true;
    money += achievements.bounce_1000.reward;
    showAchievementNotification(achievements.bounce_1000.name, achievements.bounce_1000.reward);
  }

  updateUI();
}

function showAchievementNotification(name, reward) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-content">
      <span class="achievement-icon">🏆</span>
      <div class="achievement-text">
        <div class="achievement-title">${name}</div>
        <div class="achievement-desc">You earned +${formatMoney(reward)}$</div>
      </div>
    </div>
  `;

  notificationContainer.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300); // Wait for animation to finish
  }, 5000);
}

// =================================================================
// 7. MINI GAME
// =================================================================
function startMiniGame() {
  // Reset
  minigameResult.textContent = '';
  colorOptionsEl.innerHTML = '';

  // Pick a random ball from the game
  if (balls.length === 0) {
    minigameResult.textContent = 'No balls to guess! Merge some first.';
    return;
  }

  const randomBall = balls[Math.floor(Math.random() * balls.length)];
  currentBallColor = getBallColorFromGradient(randomBall.value);
  currentBallName = getBallColorName(randomBall.value);

  // Display ball
  ballDisplay.style.background = getBallGradient(randomBall.value);
  ballDisplay.style.boxShadow = `0 0 15px ${currentBallColor}`;

  // Determine number of options based on mode
  const numOptions = isHardMode ? 6 : 4;
  const correctIndex = Math.floor(Math.random() * numOptions);
  const colors = ['Merah', 'Oranye', 'Kuning', 'Hijau', 'Biru', 'Ungu', 'Pink', 'Cyan', 'Abu', 'Emas'];
  const options = [];

  for (let i = 0; i < numOptions; i++) {
    if (i === correctIndex) {
      options.push(currentBallName);
    } else {
      let randomColor;
      do {
        randomColor = colors[Math.floor(Math.random() * colors.length)];
      } while (randomColor === currentBallName || options.includes(randomColor));
      options.push(randomColor);
    }
  }

  // Render options
  options.forEach(color => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.backgroundColor = getColorHexFromName(color);
    option.dataset.name = color;

    option.addEventListener('click', () => {
      if (option.dataset.name === currentBallName) {
        currentStreak++;
        const multiplier = isHardMode ? hardModeMultiplier : 1;
        const reward = (baseReward + (currentStreak * streakBonus)) * multiplier;
        minigameResult.innerHTML = `Benar! +${formatMoney(reward)}$ (Streak: ${currentStreak}) ${isHardMode ? '<span style="color: red;">[HARD MODE]</span>' : ''}`;
        minigameResult.style.color = 'green';
        money += reward;
        updateUI();
      } else {
        minigameResult.innerHTML = `Salah! Jawaban benar: ${currentBallName}. Streak reset. ${isHardMode ? '<span style="color: red;">[HARD MODE]</span>' : ''}`;
        minigameResult.style.color = 'red';
        currentStreak = 0; // Reset streak
        updateUI();
      }

      // Disable all options
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
      });
    });

    colorOptionsEl.appendChild(option);
  });
}

function getColorHexFromName(name) {
  const colorMap = {
    'Merah': '#FF5722',
    'Oranye': '#FF9800',
    'Kuning': '#FFC107',
    'Hijau': '#4CAF50',
    'Biru': '#2196F3',
    'Ungu': '#9C27B0',
    'Pink': '#E91E63',
    'Cyan': '#00BCD4',
    'Abu': '#607D8B',
    'Emas': '#FFD700'
  };

  return colorMap[name] || '#FFFFFF';
}

// =================================================================
// 8. UI RENDERING (Hanya render saat spawn/hapus, bukan setiap frame)
// =================================================================
function updateUI() {
  moneyEl.textContent = formatMoney(money);
  levelEl.textContent = `Level ${level}`;

  // Update prices
  document.getElementById('addBallPrice').textContent = formatMoney(calculateUpgradeCost('addBall'));
  document.getElementById('ballProfitPrice').textContent = formatMoney(calculateUpgradeCost('ballProfit'));
  document.getElementById('addPinPrice').textContent = formatMoney(calculateUpgradeCost('addPin'));
  document.getElementById('mergePinsPrice').textContent = formatMoney(calculateUpgradeCost('mergePins'));

  // Update button states
  document.querySelectorAll('.upgrade').forEach(btn => {
    const upgrade = btn.dataset.upgrade;
    const cost = calculateUpgradeCost(upgrade);
    btn.disabled = money < cost;
  });

  autoSpawnBtn.disabled = !canAffordAutoSpawn();
  autoSpawnBtn.textContent = autoSpawnActive ? '🔄 AUTO SPAWN (ON)' : '🔄 AUTO SPAWN';

  // Update streak display
  streakDisplay.textContent = currentStreak;

  // Update hard mode toggle
  hardModeToggle.checked = isHardMode;

  // Update achievement list if modal is open
  if (achievementModal.style.display === 'flex') {
    renderAchievements();
  }
}

// Render pins (grid of dots) - Sekarang hanya render sekali saat load
function renderPins() {
  const pinGrid = document.querySelector('.pin-grid');
  pinGrid.innerHTML = '';

  for (let i = 0; i < 25; i++) {
    const dot = document.createElement('div');
    dot.className = 'pin-dot';
    pinGrid.appendChild(dot);
  }

  // Render balls - Hanya saat awal, setelah load
  balls.forEach(ball => {
    // Jika elemen bola belum ada (karena spawnBall sudah membuatnya), buat di sini
    // Ini untuk kasus saat load game dari localStorage
    if (!ball.element) {
        const ballEl = document.createElement('div');
        ballEl.className = 'ball';
        ballEl.style.left = `${ball.x}px`;
        ballEl.style.top = `${ball.y}px`;
        ballEl.style.width = `${getBallSize(ball.value)}px`;
        ballEl.style.height = `${getBallSize(ball.value)}px`;
        ballEl.style.borderRadius = '50%';
        ballEl.style.background = getBallGradient(ball.value);
        // Set glow
        const intensity = getGlowIntensity(ball.value);
        ballEl.style.boxShadow = `0 0 ${intensity}px ${getBallColorFromGradient(ball.value)}, 0 0 ${intensity * 2}px ${getBallColorFromGradient(ball.value)}`;
        // Set pulsing animation
        const pulseSpeed = getBallPulseSpeed(ball.value);
        ballEl.style.animation = `pulse ${pulseSpeed}s infinite`;
        ballEl.textContent = ball.value;

        // Add bloom effect
        const bloomSize = getBloomSize(ball.value);
        const bloomEl = document.createElement('div');
        bloomEl.style.position = 'absolute';
        bloomEl.style.top = '50%';
        bloomEl.style.left = '50%';
        bloomEl.style.transform = 'translate(-50%, -50%)';
        bloomEl.style.width = `${getBallSize(ball.value) + bloomSize}px`;
        bloomEl.style.height = `${getBallSize(ball.value) + bloomSize}px`;
        bloomEl.style.borderRadius = '50%';
        bloomEl.style.background = getBallGradient(ball.value);
        bloomEl.style.filter = `blur(${bloomSize / 3}px)`;
        bloomEl.style.zIndex = '-1';
        ballEl.appendChild(bloomEl);

        // Add halo effect
        const haloSize = getHaloSize(ball.value);
        const haloEl = document.createElement('div');
        haloEl.style.position = 'absolute';
        haloEl.style.top = '50%';
        haloEl.style.left = '50%';
        haloEl.style.transform = 'translate(-50%, -50%)';
        haloEl.style.width = `${getBallSize(ball.value) + haloSize}px`;
        haloEl.style.height = `${getBallSize(ball.value) + haloSize}px`;
        haloEl.style.borderRadius = '50%';
        haloEl.style.background = getBallGradient(ball.value);
        haloEl.style.filter = `blur(${haloSize / 4}px)`;
        haloEl.style.zIndex = '-2';
        ballEl.appendChild(haloEl);

        // Add shine effect
        const shineSpeed = getShineSpeed(ball.value);
        const shineEl = document.createElement('div');
        shineEl.className = 'shine';
        const style = document.createElement('style');
        style.textContent = `
          .shine-${ball.value} {
            animation: rotate ${shineSpeed}s linear infinite;
          }
        `;
        document.head.appendChild(style);
        shineEl.classList.add(`shine-${ball.value}`);
        ballEl.appendChild(shineEl);

        // Add value label above
        const valueLabel = document.createElement('div');
        valueLabel.className = 'ball-value';
        valueLabel.textContent = ball.value;
        ballEl.appendChild(valueLabel);

        gameArea.appendChild(ballEl);

        // Simpan referensi elemen ke objek bola
        ball.element = ballEl;
        ball.valueLabel = valueLabel;
    }
  });
}

// Render Achievement List
function renderAchievements() {
  const list = document.getElementById('achievementList');
  list.innerHTML = '';

  for (const key in achievements) {
    const ach = achievements[key];
    const item = document.createElement('div');
    item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;

    const icon = document.createElement('div');
    icon.className = 'achievement-icon';
    icon.textContent = ach.unlocked ? '✅' : '🔒';

    const info = document.createElement('div');
    info.className = 'achievement-info';
    info.innerHTML = `
      <div class="achievement-name">${ach.name}</div>
      <div class="achievement-desc">${ach.desc}</div>
    `;

    const reward = document.createElement('div');
    reward.className = 'achievement-reward';
    reward.textContent = `+${formatMoney(ach.reward)}`;

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(reward);

    list.appendChild(item);
  }
}

// Render Update Log
function renderUpdateLog() {
  updateLogContent.innerHTML = '';

  updateLog.forEach(log => {
    const entry = document.createElement('div');
    entry.className = 'update-log-entry';

    const version = document.createElement('div');
    version.className = 'update-log-version';
    version.textContent = log.version;

    const changes = document.createElement('div');
    changes.className = 'update-log-changes';
    changes.innerHTML = log.changes.map(c => `• ${c}`).join('<br>');

    entry.appendChild(version);
    entry.appendChild(changes);

    updateLogContent.appendChild(entry);
  });
}

// Show Update Notification
function showUpdateNotification() {
  updateNotification.classList.add('show');

  updateNotification.onclick = () => {
    updateLogModal.style.display = 'flex';
    renderUpdateLog();
    updateNotification.classList.remove('show');
  };

  // Auto hide after 10 seconds
  setTimeout(() => {
    updateNotification.classList.remove('show');
  }, 10000);
}

// Show Confirmation Modal
function showConfirmationModal(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'confirmation-modal';

  modal.innerHTML = `
    <div class="confirmation-content">
      <h3>⚠️ CONFIRM</h3>
      <p>${message}</p>
      <div class="confirmation-buttons">
        <button class="confirmation-btn yes">Yes</button>
        <button class="confirmation-btn no">No</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.yes').onclick = () => {
    onConfirm();
    modal.remove();
  };

  modal.querySelector('.no').onclick = () => {
    modal.remove();
  };
}

// =================================================================
// 9. EVENT LISTENERS & INITIAL SETUP
// =================================================================
// Add Pin
document.querySelector('[data-upgrade="addPin"]').addEventListener('click', () => {
  const cost = calculateUpgradeCost('addPin');
  if (money >= cost) {
    money -= cost;
    addPin();
    updateUI();
  }
});

// Upgrade handlers
document.querySelectorAll('.upgrade').forEach(btn => {
  btn.addEventListener('click', () => {
    const upgrade = btn.dataset.upgrade;
    const cost = calculateUpgradeCost(upgrade);

    if (money >= cost) {
      money -= cost;
      applyUpgrade(upgrade);
      updateUI();
    }
  });
});

// Add Event Listeners for Mini Game Modal
minigameBtn.addEventListener('click', () => {
  minigameModal.style.display = 'flex';
  startMiniGame();
});

minigamePlayBtn.addEventListener('click', () => {
  startMiniGame();
});

closeMinigameModal.addEventListener('click', () => {
  minigameModal.style.display = 'none';
});

hardModeToggle.addEventListener('change', () => {
  isHardMode = hardModeToggle.checked;
  updateUI();
});

// Add Event Listeners for Update Log Modal
updateLogBtn.addEventListener('click', () => {
  updateLogModal.style.display = 'flex';
  renderUpdateLog();
});

closeUpdateLogModal.addEventListener('click', () => {
  updateLogModal.style.display = 'none';
});

// Add Event Listeners for Achievement Modal
achievementBtn.addEventListener('click', () => {
  achievementModal.style.display = 'flex';
  renderAchievements();
});

closeAchievementModal.addEventListener('click', () => {
  achievementModal.style.display = 'none';
});

// Add Event Listeners for Reset Progress
resetProgressBtn.addEventListener('click', () => {
  resetProgress();
});

// Settings Modal
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
});

// Auto Spawn Button
autoSpawnBtn.addEventListener('click', () => {
  if (autoSpawnActive) {
    stopAutoSpawn();
  } else {
    startAutoSpawn();
  }
});

function startAutoSpawn() {
  autoSpawnActive = true;
  autoSpawnInterval = setInterval(() => {
    if (availableBalls > 0) {
      spawnBall();
    }
  }, autoSpawnRate);
  updateUI();
}

function stopAutoSpawn() {
  autoSpawnActive = false;
  if (autoSpawnInterval) {
    clearInterval(autoSpawnInterval);
    autoSpawnInterval = null;
  }
  updateUI();
}

function canAffordAutoSpawn() {
  return money >= 10000;
}

// --- IMPLEMENTASI TOMBOL MAX & x3 ---
// MAX Button
maxBtn.addEventListener('click', () => {
  // Spawn semua bola yang tersedia sekaligus
  while (availableBalls > 0) {
    spawnBall();
  }
  updateUI(); // Pastikan UI diperbarui setelah spawn
});

// x3 Button
x3Btn.addEventListener('click', () => {
  // Gandakan kecepatan semua bola yang aktif sebesar 3x
  balls.forEach(ball => {
    // Kalikan kecepatan dengan 3
    // Kita kalikan vx dan vy langsung agar efek terlihat langsung
    // Pastikan tidak melebihi batas maksimum yang wajar
    const newVx = ball.vx * 3;
    const newVy = ball.vy * 3;
    // Batasi kecepatan maksimum untuk mencegah bola terlalu cepat
    const maxSpeed = 30; // Atur kecepatan maksimum yang wajar
    const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      ball.vx = newVx * scale;
      ball.vy = newVy * scale;
    } else {
       ball.vx = newVx;
       ball.vy = newVy;
    }
  });
  // Tidak perlu updateUI() untuk perubahan kecepatan
});
// --- AKHIR IMPLEMENTASI ---

function resetProgress() {
  showConfirmationModal("Are you sure you want to reset ALL progress? This cannot be undone.", () => {
    // Reset all game state
    money = 0;
    level = 1;
    ballProfit = 1;
    availableBalls = 1; // Start with 1 ball
    pins = [];
    balls = [];
    autoSpawnActive = false;
    totalMerges = 0;
    totalBounces = 0;
    currentStreak = 0;
    isHardMode = false;

    // Reset achievements
    for (const key in achievements) {
      achievements[key].unlocked = false;
    }

    // Stop auto spawn if active
    if (autoSpawnInterval) {
      clearInterval(autoSpawnInterval);
      autoSpawnInterval = null;
    }

    // Hapus semua elemen bola dari DOM
    document.querySelectorAll('.ball').forEach(b => b.remove());

    updateUI();
    renderPins(); // Render ulang grid dan bola kosong (atau hanya grid)
    saveGame();

    // Close modal and show notification
    settingsModal.style.display = 'none';
    alert("Progress has been reset! Start fresh and have fun!");
  });
}

// Load game
window.addEventListener('load', () => {
  const saved = localStorage.getItem('bounceGameState');
  if (saved) {
    const state = JSON.parse(saved);
    money = state.money || 100000;
    level = state.level || 7;
    ballProfit = state.ballProfit || 1;
    availableBalls = state.availableBalls || 5;
    pins = state.pins || [];
    balls = state.balls || []; // Array bola dari localStorage
    autoSpawnActive = state.autoSpawnActive || false;
    totalMerges = state.totalMerges || 0;
    totalBounces = state.totalBounces || 0;
    currentStreak = state.currentStreak || 0;
    isHardMode = state.isHardMode || false;

    if (autoSpawnActive) {
      startAutoSpawn();
    }
  }

  const savedAchievements = localStorage.getItem('achievements');
  if (savedAchievements) {
    achievements = { ...achievements, ...JSON.parse(savedAchievements) };
  }

  // Check for update
  const lastVersion = localStorage.getItem('lastVersion') || 'Beta 1.0.0';
  if (lastVersion !== currentVersion) {
    showUpdateNotification();
  }

  updateUI();
  renderPins(); // Render grid dan bola dari state
  startGameLoop(); // Mulai game loop

  // Setup event listeners are defined above
});

// Save game
window.addEventListener('beforeunload', () => {
  saveGame();
});

function saveGame() {
  // Hapus referensi elemen DOM dari objek bola sebelum disimpan
  const ballsToSave = balls.map(ball => {
    const { element, valueLabel, ...ballData } = ball; // Hanya ambil data, bukan elemen DOM
    return ballData;
  });

  localStorage.setItem(
    'bounceGameState',
    JSON.stringify({
      money,
      level,
      ballProfit,
      pins,
      balls: ballsToSave, // Simpan data bola tanpa elemen
      availableBalls,
      autoSpawnActive,
      totalMerges,
      totalBounces,
      currentStreak,
      isHardMode
    })
  );
  localStorage.setItem('achievements', JSON.stringify(achievements));
  localStorage.setItem('lastVersion', currentVersion);
}

// updateUI(); // Panggil updateUI setelah semua event listener dan fungsi lainnya didefinisikan
