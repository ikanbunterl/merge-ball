// script.js - BALL MERGE CLICKER - v2.0.0 - IMPROVED GRAPHICS, UI, & FEATURES
// =================================================================
// 1. POOLING SETUP (IMPROVED)
// =================================================================
const coinPopPool = [];
const sparklePool = [];
let maxPoolSize = 100; // Default
function updateMaxPoolSize() {
    if (graphicQuality === 'low') maxPoolSize = 50;
    else if (graphicQuality === 'medium') maxPoolSize = 75;
    else maxPoolSize = 100; // high, ultra_low
}
function prunePools() {
    while (coinPopPool.length > maxPoolSize) {
        const el = coinPopPool.pop();
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    while (sparklePool.length > maxPoolSize) {
        const el = sparklePool.pop();
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
}
function getFromPool(pool, className, container) {
    prunePools();
    let element = pool.find(el => el.classList.contains('pooled'));
    if (!element) {
        if (pool.length < maxPoolSize) {
            element = document.createElement('div');
            element.className = className;
            element.classList.add('pooled');
            container.appendChild(element);
            pool.push(element);
        } else {
            return null;
        }
    }
    element.classList.remove('pooled');
    element.style.display = 'block';
    return element;
}
function returnToPool(element, pool) {
    if (element && pool.includes(element)) {
        element.style.display = 'none';
        element.classList.add('pooled');
    }
}
// =================================================================
// 2. GAME STATE
// =================================================================
let money = 10000000;
let level = 7;
let ballProfit = 1;
let availableBalls = 5;
let pins = [];
let balls = [];
let autoSpawnActive = false;
let autoSpawnInterval = null;
let autoSpawnRate = 1000;
let achievements = {
  first_merge: { unlocked: false, name: "First Merge", desc: "Merge 2 balls", reward: 1000, difficulty: 'easy' },
  money_100k: { unlocked: false, name: "100K Club", desc: "Earn 100K $", reward: 5000, difficulty: 'easy' },
  ball_level_64: { unlocked: false, name: "Level 64", desc: "Get a ball with value 64", reward: 10000, difficulty: 'medium' },
  merge_100: { unlocked: false, name: "100 Merges", desc: "Merge 100 times", reward: 50000, difficulty: 'medium' },
  bounce_1000: { unlocked: false, name: "1000 Bounces", desc: "Bounce balls 1000 times", reward: 100000, difficulty: 'hard' },
  click_100: { unlocked: false, name: "Click Master I", desc: "Click 100 times", reward: 2000, difficulty: 'easy', counter: 0 },
  click_1000: { unlocked: false, name: "Click Master II", desc: "Click 1000 times", reward: 10000, difficulty: 'medium', counter: 0 },
  strategy_ball_128: { unlocked: false, name: "Strategic Growth", desc: "Get a ball level 128 without adding new balls for 5 minutes", reward: 25000, difficulty: 'hard', timerActive: false, timerStart: 0 },
};
let totalMerges = 0;
let totalBounces = 0;
let totalClicks = 0;
let lastBallAddTime = Date.now();
let currentBallColor = '';
let currentBallName = '';
let colorOptions = [];
let currentStreak = 0;
let isHardMode = false;
const baseReward = 500;
const streakBonus = 100;
const hardModeMultiplier = 2;
let graphicQuality = 'high';
let effectSettings = {
    glow: true,
    pulse: true,
    shine: true,
    sparkle: true,
    trail: true
};
let theme = 'dark_purple';
const updateLog = [
  {
    version: "v2.0.0",
    changes: [
      { type: "update", text: "Added more detailed graphic quality presets (Low, Medium, High, Ultra Low)." },
      { type: "update", text: "Added individual toggles for visual effects (Glow, Pulse, Shine, Sparkle, Trail)." },
      { type: "update", text: "Added dynamic effect pooling based on graphic settings." },
      { type: "update", text: "Added tiered achievements (e.g., 100/1000 clicks)." },
      { type: "update", text: "Added compact, toggleable update log entries." },
      { type: "update", text: "Added smooth modal transitions." },
      { type: "update", text: "Added theme selector (Dark Purple, Dark Blue, Dark Green)." },
      { type: "tweak", text: "Refined ball glow using drop-shadow filter." },
      { type: "tweak", text: "Improved update log tag styles." },
      { type: "tweak", text: "Optimized sparkle frequency calculation." },
      { type: "fix", text: "Fixed minor UI alignment issues." }
    ]
  },
  {
    version: "v1.8.0",
    changes: [
      { type: "update", text: "Added graphic quality settings (Low, Medium, High)." },
      { type: "tweak", text: "Adjusted visual effects based on selected graphic quality." },
      { type: "tweak", text: "Improved performance on lower graphic settings." }
    ]
  },
  {
    version: "v1.7.0",
    changes: [
      { type: "update", text: "Added settings for visual effects intensity." },
      { type: "tweak", text: "Optimized ball glow using drop-shadow filter." },
      { type: "tweak", text: "Refined update log tag styles for better readability." },
      { type: "fix", text: "Fixed minor UI alignment issues." }
    ]
  },
  {
    version: "v1.6.0",
    changes: [
      { type: "update", text: "Added 'MAX' and 'x3' buttons to sidebar." },
      { type: "update", text: "MAX spawns all available balls at once." },
      { type: "update", text: "x3 instantly triples the speed of all balls." },
      { type: "fix", text: "Fixed crash when spawning too many balls simultaneously." },
      { type: "fix", text: "Resolved potential memory leak from excessive DOM elements." },
      { type: "fix", text: "Corrected achievement unlock condition for '100 Merges'." },
      { type: "tweak", text: "Reduced sparkle effect spawn rate for better performance." },
      { type: "tweak", text: "Adjusted glow intensity for higher-level balls." },
      { type: "revamp", text: "Optimized ball rendering using DOM pooling for effects." },
      { type: "revamp", text: "Simplified ball element creation to reduce overhead." },
      { type: "revamp", text: "Redesigned update log UI for clarity with inline tags." }
    ]
  },
  {
    version: "v1.5.0",
    changes: [
      { type: "update", text: "Added 'MAX' and 'x3' buttons to sidebar." },
      { type: "update", text: "MAX spawns all available balls at once." },
      { type: "update", text: "x3 instantly triples the speed of all balls." },
      { type: "fix", text: "Fixed crash when spawning too many balls simultaneously." },
      { type: "fix", text: "Resolved potential memory leak from excessive DOM elements." },
      { type: "fix", text: "Corrected achievement unlock condition for '100 Merges'." },
      { type: "tweak", text: "Reduced sparkle effect spawn rate for better performance." },
      { type: "tweak", text: "Adjusted glow intensity for higher-level balls." },
      { type: "revamp", text: "Optimized ball rendering using DOM pooling for effects." },
      { type: "revamp", text: "Simplified ball element creation to reduce overhead." },
      { type: "revamp", text: "Redesigned update log UI for clarity." }
    ]
  },
  {
    version: "v1.4.0",
    changes: [
      { type: "revamp", text: "Optimized ball rendering using direct DOM manipulation." },
      { type: "revamp", text: "Introduced ball element references for faster updates." },
      { type: "revamp", text: "Removed redundant renderPins call from main game loop." },
      { type: "fix", text: "Fixed UI modal rendering issues." },
      { type: "fix", text: "Fixed save/load game logic." }
    ]
  },
  {
    version: "v1.3.1",
    changes: [
      { type: "update", text: "Implemented 'MAX' and 'x3' buttons on the left sidebar." },
      { type: "update", text: "MAX spawns all available balls instantly." },
      { type: "update", text: "x3 triples the speed of all balls immediately." }
    ]
  },
  {
    version: "v1.3.0",
    changes: [
      { type: "update", text: "Added streak bonus system to the mini game." },
      { type: "update", text: "Added a hard mode toggle to the mini game." },
      { type: "update", text: "Implemented an update notification system." },
      { type: "update", text: "Added a progress reset feature with confirmation." },
      { type: "fix", text: "Fixed minor UI modal display bugs." }
    ]
  },
  {
    version: "v1.2.0",
    changes: [
      { type: "update", text: "Added an achievement system." },
      { type: "update", text: "Implemented achievement notification stack." },
      { type: "update", text: "Added a mini game: Guess the Ball Color." }
    ]
  },
  {
    version: "v1.1.0",
    changes: [
      { type: "update", text: "Added glow, bloom, halo, shine, pulsing, and sparkle effects." },
      { type: "update", text: "Improved ball UI and animations." },
      { type: "update", text: "Implemented save/load game functionality." }
    ]
  },
  {
    version: "v1.0.0",
    changes: [
      { type: "update", text: "Initial game release." },
      { type: "update", text: "Basic ball merge and spawn mechanics." },
      { type: "update", text: "Simple money and upgrade system." }
    ]
  }
];
const currentVersion = "v2.0.0";
// =================================================================
// 3. DOM ELEMENTS & CONSTANTS
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
const graphicQualitySelect = document.getElementById('graphicQualitySelect');
const glowToggle = document.getElementById('glowToggle');
const pulseToggle = document.getElementById('pulseToggle');
const shineToggle = document.getElementById('shineToggle');
const sparkleToggle = document.getElementById('sparkleToggle');
const trailToggle = document.getElementById('trailToggle');
const glowIntensitySlider = document.getElementById('glowIntensitySlider');
const sparkleRateSlider = document.getElementById('sparkleRateSlider');
const themeSelect = document.getElementById('themeSelect');
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
// 4. UTILITY FUNCTIONS
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
    return 'Acak';
  }
}
function getShineSpeed(value) {
  return Math.max(1, 3 - Math.log2(value) * 0.2);
}
function getGlowIntensity(value) {
    if (graphicQuality === 'low' || graphicQuality === 'ultra_low' || !effectSettings.glow) {
        return 0;
    }
    const baseIntensity = Math.min(10 + Math.log2(value) * 2, 30);
    return baseIntensity * (glowIntensitySlider ? glowIntensitySlider.value / 100 : 1);
}
function getBallPulseSpeed(value) {
    if (graphicQuality === 'low' || graphicQuality === 'ultra_low' || !effectSettings.pulse) {
        return 0;
    }
    return Math.max(0.5, 2 - Math.log2(value) * 0.1);
}
function getBallSparkleCount(value) {
    if (graphicQuality === 'low' || graphicQuality === 'ultra_low' || !effectSettings.sparkle) {
        return 0;
    }
    const baseCount = Math.min(5, Math.floor(Math.log2(value) / 2));
    const ballFactor = Math.max(0.1, 1 - (balls.length / 50));
    const rateFactor = sparkleRateSlider ? sparkleRateSlider.value / 100 : 0.5;
    return Math.floor(baseCount * ballFactor * rateFactor);
}
function getBallTrailCount() {
    if (graphicQuality === 'low' || graphicQuality === 'ultra_low' || !effectSettings.trail) {
        return 0;
    }
    if (graphicQuality === 'medium') return 5;
    return 10; // high
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
function applyGraphicSettingsToBall(ballElement, value, isMerged = false) {
    if (graphicQuality === 'ultra_low') {
        ballElement.style.filter = 'none';
        ballElement.style.animation = 'none';
        const shineEl = ballElement.querySelector('.shine');
        if (shineEl) shineEl.style.display = 'none';
        const valueLabel = ballElement.querySelector('.ball-value');
        if (valueLabel) valueLabel.style.top = isMerged ? '-25px' : '-20px';
        return;
    }
    const intensity = getGlowIntensity(value);
    if (intensity > 0 && effectSettings.glow) {
        ballElement.style.filter = `drop-shadow(0 0 ${intensity}px ${getBallColorFromGradient(value)}) drop-shadow(0 0 ${intensity * 2}px ${getBallColorFromGradient(value)})`;
    } else {
        ballElement.style.filter = 'none';
    }
    const pulseSpeed = getBallPulseSpeed(value);
    if (pulseSpeed > 0 && effectSettings.pulse) {
        ballElement.style.animation = `pulse ${pulseSpeed}s infinite ease-in-out`;
    } else {
        ballElement.style.animation = 'none';
    }
    const shineEl = ballElement.querySelector('.shine');
    if (shineEl) {
        if (graphicQuality === 'high' && effectSettings.shine) {
            shineEl.style.display = 'block';
            const speedClass = `shine-speed-${value}` || 'shine-speed-default';
            shineEl.className = 'shine';
            shineEl.classList.add(speedClass);
        } else {
            shineEl.style.display = 'none';
        }
    }
    const valueLabel = ballElement.querySelector('.ball-value');
    if (valueLabel) {
        valueLabel.style.top = isMerged ? '-25px' : '-20px';
    }
}
function createSparkle(x, y, color) {
    if (graphicQuality === 'low' || graphicQuality === 'ultra_low' || !effectSettings.sparkle) {
        return;
    }
    if (Math.random() > (sparkleRateSlider ? sparkleRateSlider.value / 100 : 0.01)) {
        return;
    }
    const sparkle = getFromPool(sparklePool, 'sparkle', gameArea);
    if (!sparkle) return;
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.background = color;
    sparkle.style.animation = 'none';
    sparkle.offsetHeight;
    sparkle.style.animation = 'sparkle-fade 1s forwards';
    setTimeout(() => {
        returnToPool(sparkle, sparklePool);
    }, 1000);
}
function createTrailDot(x, y, color, opacity) {
    if (graphicQuality === 'ultra_low' || !effectSettings.trail) {
        return;
    }
    const trailDot = getFromPool(sparklePool, 'trail-dot', gameArea);
    if (!trailDot) return;
    trailDot.style.left = `${x}px`;
    trailDot.style.top = `${y}px`;
    trailDot.style.background = color;
    trailDot.style.opacity = opacity;
    trailDot.style.animation = 'none';
    trailDot.offsetHeight;
    trailDot.style.animation = 'fadeTrail 0.4s forwards';
    setTimeout(() => {
        returnToPool(trailDot, sparklePool);
    }, 400);
}
function applyTheme() {
    document.body.style.background = getThemeBackground();
}
function getThemeBackground() {
    switch(theme) {
        case 'dark_blue': return '#112233';
        case 'dark_green': return '#113322';
        case 'dark_purple': default: return '#221133';
    }
}
function updateGraphicSettings() {
    updateMaxPoolSize();
    balls.forEach(ball => {
        if (ball.element) {
            applyGraphicSettingsToBall(ball.element, ball.value);
        }
    });
    if (minigameModal.style.display === 'flex' && ballDisplay && ballDisplay.style.background) {
        if (graphicQuality !== 'ultra_low' && effectSettings.glow) {
            ballDisplay.style.filter = `drop-shadow(0 0 15px ${currentBallColor || '#FFFFFF'})`;
        } else {
            ballDisplay.style.filter = 'none';
        }
    }
}
function checkAchievements(type, value = null) {
    totalClicks++;
    if (type === 'merge' && !achievements.first_merge.unlocked) {
        achievements.first_merge.unlocked = true;
        money += achievements.first_merge.reward;
        showAchievementNotification(achievements.first_merge.name, achievements.first_merge.reward, achievements.first_merge.difficulty);
    }
    if (type === 'money' && money >= 100000 && !achievements.money_100k.unlocked) {
        achievements.money_100k.unlocked = true;
        money += achievements.money_100k.reward;
        showAchievementNotification(achievements.money_100k.name, achievements.money_100k.reward, achievements.money_100k.difficulty);
    }
    if (type === 'merge' && value >= 64 && !achievements.ball_level_64.unlocked) {
        achievements.ball_level_64.unlocked = true;
        money += achievements.ball_level_64.reward;
        showAchievementNotification(achievements.ball_level_64.name, achievements.ball_level_64.reward, achievements.ball_level_64.difficulty);
    }
    if (type === 'merge' && totalMerges >= 100 && !achievements.merge_100.unlocked) {
        achievements.merge_100.unlocked = true;
        money += achievements.merge_100.reward;
        showAchievementNotification(achievements.merge_100.name, achievements.merge_100.reward, achievements.merge_100.difficulty);
    }
    if (type === 'bounce' && totalBounces >= 1000 && !achievements.bounce_1000.unlocked) {
        achievements.bounce_1000.unlocked = true;
        money += achievements.bounce_1000.reward;
        showAchievementNotification(achievements.bounce_1000.name, achievements.bounce_1000.reward, achievements.bounce_1000.difficulty);
    }
    if (totalClicks >= 100 && !achievements.click_100.unlocked) {
        achievements.click_100.unlocked = true;
        money += achievements.click_100.reward;
        showAchievementNotification(achievements.click_100.name, achievements.click_100.reward, achievements.click_100.difficulty);
    }
    if (totalClicks >= 1000 && !achievements.click_1000.unlocked) {
        achievements.click_1000.unlocked = true;
        money += achievements.click_1000.reward;
        showAchievementNotification(achievements.click_1000.name, achievements.click_1000.reward, achievements.click_1000.difficulty);
    }
    if (type === 'addBall') {
        lastBallAddTime = Date.now();
        if (achievements.strategy_ball_128.timerActive) {
            achievements.strategy_ball_128.timerActive = false;
        }
    }
    updateUI();
}
function showAchievementNotification(name, reward, difficulty = 'easy') {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  let flair = '🏆';
  if (difficulty === 'hard') flair = '👑';
  else if (difficulty === 'medium') flair = '🥈';
  notification.innerHTML = `
    <div class="achievement-content">
      <span class="achievement-icon">${flair}</span>
      <div class="achievement-text">
        <div class="achievement-title">${name}</div>
        <div class="achievement-desc">You earned +${formatMoney(reward)}$</div>
      </div>
    </div>
  `;
  notificationContainer.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}
// =================================================================
// 5. GAME LOGIC
// =================================================================
function spawnBall() {
  if (availableBalls <= 0) return;
  if (achievements.strategy_ball_128.unlocked === false && !achievements.strategy_ball_128.timerActive) {
      achievements.strategy_ball_128.timerActive = true;
      achievements.strategy_ball_128.timerStart = Date.now();
  }
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
    element: null,
    valueLabel: null
  };
  const ballEl = document.createElement('div');
  ballEl.className = 'ball';
  ballEl.style.left = `${ball.x}px`;
  ballEl.style.top = `${ball.y}px`;
  ballEl.style.width = `${getBallSize(ball.value)}px`;
  ballEl.style.height = `${getBallSize(ball.value)}px`;
  ballEl.style.background = getBallGradient(ball.value);
  const shineEl = document.createElement('div');
  shineEl.className = 'shine';
  const speedClass = `shine-speed-${ball.value}` || 'shine-speed-default';
  shineEl.classList.add(speedClass);
  ballEl.appendChild(shineEl);
  const valueLabel = document.createElement('div');
  valueLabel.className = 'ball-value';
  valueLabel.textContent = ball.value;
  ballEl.appendChild(valueLabel);
  applyGraphicSettingsToBall(ballEl, ball.value);
  gameArea.appendChild(ballEl);
  ball.element = ballEl;
  ball.valueLabel = valueLabel;
  balls.push(ball);
  availableBalls--;
  updateUI();
}
function showCoinPop(x, y, amount) {
  const coin = getFromPool(coinPopPool, 'coin-pop', gameArea);
  if (!coin) return;
  coin.textContent = `+${amount}`;
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;
  coin.style.animation = 'none';
  coin.offsetHeight;
  coin.style.animation = 'floatUp 1s forwards';
  setTimeout(() => {
    returnToPool(coin, coinPopPool);
  }, 1000);
}
function checkMerges() {
  for (let i = balls.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      const ball1 = balls[i];
      const ball2 = balls[j];
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (getBallSize(ball1.value) / 2) + (getBallSize(ball2.value) / 2);
      if (ball1.value === ball2.value && distance < minDistance) {
        const newValue = ball1.value * 2;
        const newX = (ball1.x + ball2.x) / 2;
        const newY = (ball1.y + ball2.y) / 2;
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
          element: null,
          valueLabel: null
        };
        const newBallEl = document.createElement('div');
        newBallEl.className = 'ball merge-effect';
        newBallEl.style.left = `${newX}px`;
        newBallEl.style.top = `${newY}px`;
        newBallEl.style.width = `${getBallSize(newValue)}px`;
        newBallEl.style.height = `${getBallSize(newValue)}px`;
        newBallEl.style.background = getBallGradient(newValue);
        const shineEl = document.createElement('div');
        shineEl.className = 'shine';
        const speedClass = `shine-speed-${newValue}` || 'shine-speed-default';
        shineEl.classList.add(speedClass);
        newBallEl.appendChild(shineEl);
        const valueLabel = document.createElement('div');
        valueLabel.className = 'ball-value';
        valueLabel.textContent = newValue;
        newBallEl.appendChild(valueLabel);
        applyGraphicSettingsToBall(newBallEl, newValue, true);
        gameArea.appendChild(newBallEl);
        newBall.element = newBallEl;
        newBall.valueLabel = valueLabel;
        const ballToRemove = balls.splice(Math.max(i, j), 1)[0];
        if (ballToRemove.element) ballToRemove.element.remove();
        const ballToRemove2 = balls.splice(Math.min(i, j), 1)[0];
        if (ballToRemove2.element) ballToRemove2.element.remove();
        balls.push(newBall);
        setTimeout(() => {
          if (newBallEl) newBallEl.remove();
        }, 500);
        money += newValue * ballProfit;
        showCoinPop(newX, newY, formatShortMoney(newValue * ballProfit));
        updateUI();
        totalMerges++;
        checkAchievements('merge', newValue);
      }
    }
  }
}
function startGameLoop() {
  function gameLoop() {
    balls.forEach((ball, i) => {
      const maxTrailLength = getBallTrailCount();
      ball.trail.push({ x: ball.x + ball.radius, y: ball.y + ball.radius, opacity: 0.8 });
      if (ball.trail.length > maxTrailLength) {
          ball.trail.shift();
      }
      if (maxTrailLength > 0) {
          ball.trail.forEach((point, idx) => {
              const opacity = (idx / ball.trail.length) * 0.8;
              if (Math.random() < 0.3) {
                  createTrailDot(point.x, point.y, getBallColorFromGradient(ball.value), opacity);
              }
          });
      }
      const speedMult = getBallSpeedMultiplier(ball.value);
      ball.x += ball.vx / speedMult;
      ball.y += ball.vy / speedMult;
      if (ball.element) {
        ball.element.style.left = `${ball.x}px`;
        ball.element.style.top = `${ball.y}px`;
        if (ball.valueLabel) {
            ball.valueLabel.textContent = ball.value;
        }
      }
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
      const sparkleCount = getBallSparkleCount(ball.value);
      for (let s = 0; s < sparkleCount; s++) {
          const offsetX = (Math.random() - 0.5) * ballSize;
          const offsetY = (Math.random() - 0.5) * ballSize;
          createSparkle(ball.x + ball.radius + offsetX, ball.y + ball.radius + offsetY, getBallColorFromGradient(ball.value));
      }
    });
    if (achievements.strategy_ball_128.timerActive && Date.now() - achievements.strategy_ball_128.timerStart >= 5 * 60 * 1000) {
        const hasLevel128 = balls.some(b => b.value >= 128);
        if (hasLevel128) {
            achievements.strategy_ball_128.unlocked = true;
            money += achievements.strategy_ball_128.reward;
            showAchievementNotification(achievements.strategy_ball_128.name, achievements.strategy_ball_128.reward, achievements.strategy_ball_128.difficulty);
        }
        achievements.strategy_ball_128.timerActive = false;
    }
    checkMerges();
    requestAnimationFrame(gameLoop);
  }
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
// 6. UPGRADES & ACTIONS
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
      checkAchievements('addBall');
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
// 7. MINI GAME
// =================================================================
function startMiniGame() {
  minigameResult.textContent = '';
  colorOptionsEl.innerHTML = '';
  if (balls.length === 0) {
    minigameResult.textContent = 'No balls to guess! Merge some first.';
    return;
  }
  const randomBall = balls[Math.floor(Math.random() * balls.length)];
  currentBallColor = getBallColorFromGradient(randomBall.value);
  currentBallName = getBallColorName(randomBall.value);
  ballDisplay.style.background = getBallGradient(randomBall.value);
  if (graphicQuality !== 'ultra_low' && effectSettings.glow) {
      ballDisplay.style.filter = `drop-shadow(0 0 15px ${currentBallColor})`;
  } else {
      ballDisplay.style.filter = 'none';
  }
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
        currentStreak = 0;
        updateUI();
      }
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
// 8. UI RENDERING
// =================================================================
function updateUI() {
  moneyEl.textContent = formatMoney(money);
  levelEl.textContent = `Level ${level}`;
  document.getElementById('addBallPrice').textContent = formatMoney(calculateUpgradeCost('addBall'));
  document.getElementById('ballProfitPrice').textContent = formatMoney(calculateUpgradeCost('ballProfit'));
  document.getElementById('addPinPrice').textContent = formatMoney(calculateUpgradeCost('addPin'));
  document.getElementById('mergePinsPrice').textContent = formatMoney(calculateUpgradeCost('mergePins'));
  document.querySelectorAll('.upgrade').forEach(btn => {
    const upgrade = btn.dataset.upgrade;
    const cost = calculateUpgradeCost(upgrade);
    btn.disabled = money < cost;
  });
  autoSpawnBtn.disabled = !canAffordAutoSpawn();
  autoSpawnBtn.textContent = autoSpawnActive ? '🔄 AUTO SPAWN (ON)' : '🔄 AUTO SPAWN';
  streakDisplay.textContent = currentStreak;
  hardModeToggle.checked = isHardMode;
  if (achievementModal.style.display === 'flex') {
    renderAchievements();
  }
}
function renderPins() {
  const pinGrid = document.querySelector('.pin-grid');
  pinGrid.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const dot = document.createElement('div');
    dot.className = 'pin-dot';
    pinGrid.appendChild(dot);
  }
  balls.forEach(ball => {
    if (!ball.element) {
        const ballEl = document.createElement('div');
        ballEl.className = 'ball';
        ballEl.style.left = `${ball.x}px`;
        ballEl.style.top = `${ball.y}px`;
        ballEl.style.width = `${getBallSize(ball.value)}px`;
        ballEl.style.height = `${getBallSize(ball.value)}px`;
        ballEl.style.background = getBallGradient(ball.value);
        const shineEl = document.createElement('div');
        shineEl.className = 'shine';
        const speedClass = `shine-speed-${ball.value}` || 'shine-speed-default';
        shineEl.classList.add(speedClass);
        ballEl.appendChild(shineEl);
        const valueLabel = document.createElement('div');
        valueLabel.className = 'ball-value';
        valueLabel.textContent = ball.value;
        ballEl.appendChild(valueLabel);
        applyGraphicSettingsToBall(ballEl, ball.value);
        gameArea.appendChild(ballEl);
        ball.element = ballEl;
        ball.valueLabel = valueLabel;
    } else {
        applyGraphicSettingsToBall(ball.element, ball.value);
    }
  });
}
function renderAchievements() {
  const list = document.getElementById('achievementList');
  list.innerHTML = '';
  for (const key in achievements) {
    const ach = achievements[key];
    if (ach.counter !== undefined) continue;
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
function renderUpdateLog() {
  updateLogContent.innerHTML = '';
  updateLog.forEach(log => {
    const entry = document.createElement('div');
    entry.className = 'update-log-entry-compact';
    const header = document.createElement('div');
    header.className = 'update-log-header';
    header.innerHTML = `<span class="update-log-version">${log.version}</span>`;
    header.style.cursor = 'pointer';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    const changesContainer = document.createElement('div');
    changesContainer.className = 'update-log-changes-compact';
    changesContainer.style.display = 'none';
    changesContainer.style.marginTop = '5px';
    changesContainer.style.paddingLeft = '10px';
    log.changes.forEach(change => {
      const changeDiv = document.createElement('div');
      changeDiv.style.display = 'flex';
      changeDiv.style.alignItems = 'flex-start';
      changeDiv.style.marginBottom = '4px';
      const tag = document.createElement('span');
      tag.textContent = change.type.toUpperCase();
      tag.style.display = 'inline-block';
      tag.style.padding = '1px 5px';
      tag.style.borderRadius = '4px';
      tag.style.fontSize = '0.65rem';
      tag.style.fontWeight = 'bold';
      tag.style.marginRight = '6px';
      tag.style.flexShrink = 0;
      tag.style.textAlign = 'center';
      tag.style.minWidth = '40px';
      tag.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
      switch (change.type) {
        case 'update': tag.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)'; tag.style.color = 'white'; break;
        case 'fix': tag.style.background = 'linear-gradient(135deg, #2196F3, #0D47A1)'; tag.style.color = 'white'; break;
        case 'tweak': tag.style.background = 'linear-gradient(135deg, #FFC107, #FF8F00)'; tag.style.color = 'black'; break;
        case 'revamp': tag.style.background = 'linear-gradient(135deg, #9C27B0, #6A1B9A)'; tag.style.color = 'white'; break;
        default: tag.style.background = 'linear-gradient(135deg, #9E9E9E, #616161)'; tag.style.color = 'white';
      }
      const text = document.createElement('span');
      text.textContent = change.text;
      text.style.fontSize = '0.8rem';
      text.style.color = '#ddd';
      changeDiv.appendChild(tag);
      changeDiv.appendChild(text);
      changesContainer.appendChild(changeDiv);
    });
    header.addEventListener('click', () => {
        const isHidden = changesContainer.style.display === 'none';
        changesContainer.style.display = isHidden ? 'block' : 'none';
    });
    entry.appendChild(header);
    entry.appendChild(changesContainer);
    updateLogContent.appendChild(entry);
  });
}
function showUpdateNotification() {
  updateNotification.classList.add('show');
  updateNotification.onclick = () => {
    updateLogModal.style.display = 'flex';
    renderUpdateLog();
    updateNotification.classList.remove('show');
  };
  setTimeout(() => {
    updateNotification.classList.remove('show');
  }, 10000);
}
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
document.querySelector('[data-upgrade="addPin"]').addEventListener('click', () => {
  const cost = calculateUpgradeCost('addPin');
  if (money >= cost) {
    money -= cost;
    addPin();
    updateUI();
  }
});
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
updateLogBtn.addEventListener('click', () => {
  updateLogModal.style.display = 'flex';
  renderUpdateLog();
});
closeUpdateLogModal.addEventListener('click', () => {
  updateLogModal.style.display = 'none';
});
achievementBtn.addEventListener('click', () => {
  achievementModal.style.display = 'flex';
  renderAchievements();
});
closeAchievementModal.addEventListener('click', () => {
  achievementModal.style.display = 'none';
});
resetProgressBtn.addEventListener('click', () => {
  resetProgress();
});
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
  if (glowIntensitySlider) glowIntensitySlider.value = localStorage.getItem('glowIntensity') || 100;
  if (sparkleRateSlider) sparkleRateSlider.value = localStorage.getItem('sparkleRate') || 50;
  if (graphicQualitySelect) graphicQualitySelect.value = graphicQuality;
  if (glowToggle) glowToggle.checked = effectSettings.glow;
  if (pulseToggle) pulseToggle.checked = effectSettings.pulse;
  if (shineToggle) shineToggle.checked = effectSettings.shine;
  if (sparkleToggle) sparkleToggle.checked = effectSettings.sparkle;
  if (trailToggle) trailToggle.checked = effectSettings.trail;
  if (themeSelect) themeSelect.value = theme;
});
closeModal.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
});
if (graphicQualitySelect) {
    graphicQualitySelect.addEventListener('change', () => {
        graphicQuality = graphicQualitySelect.value;
        localStorage.setItem('graphicQuality', graphicQuality);
        updateGraphicSettings();
    });
}
if (glowToggle) glowToggle.addEventListener('change', () => { effectSettings.glow = glowToggle.checked; localStorage.setItem('effectGlow', effectSettings.glow); updateGraphicSettings(); });
if (pulseToggle) pulseToggle.addEventListener('change', () => { effectSettings.pulse = pulseToggle.checked; localStorage.setItem('effectPulse', effectSettings.pulse); updateGraphicSettings(); });
if (shineToggle) shineToggle.addEventListener('change', () => { effectSettings.shine = shineToggle.checked; localStorage.setItem('effectShine', effectSettings.shine); updateGraphicSettings(); });
if (sparkleToggle) sparkleToggle.addEventListener('change', () => { effectSettings.sparkle = sparkleToggle.checked; localStorage.setItem('effectSparkle', effectSettings.sparkle); updateGraphicSettings(); });
if (trailToggle) trailToggle.addEventListener('change', () => { effectSettings.trail = trailToggle.checked; localStorage.setItem('effectTrail', effectSettings.trail); updateGraphicSettings(); });
if (glowIntensitySlider) {
    glowIntensitySlider.addEventListener('input', () => {
        localStorage.setItem('glowIntensity', glowIntensitySlider.value);
        if (graphicQuality !== 'ultra_low' && effectSettings.glow) {
            balls.forEach(ball => {
                if (ball.element) {
                    applyGraphicSettingsToBall(ball.element, ball.value);
                }
            });
        }
    });
}
if (sparkleRateSlider) {
    sparkleRateSlider.addEventListener('input', () => {
        localStorage.setItem('sparkleRate', sparkleRateSlider.value);
    });
}
if (themeSelect) {
    themeSelect.addEventListener('change', () => {
        theme = themeSelect.value;
        localStorage.setItem('theme', theme);
        applyTheme();
    });
}
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
maxBtn.addEventListener('click', () => {
  while (availableBalls > 0) {
    spawnBall();
  }
  updateUI();
});
x3Btn.addEventListener('click', () => {
  balls.forEach(ball => {
    const newVx = ball.vx * 3;
    const newVy = ball.vy * 3;
    const maxSpeed = 30;
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
});
function resetProgress() {
  showConfirmationModal("Are you sure you want to reset ALL progress? This cannot be undone.", () => {
    money = 0;
    level = 1;
    ballProfit = 1;
    availableBalls = 1;
    pins = [];
    balls = [];
    autoSpawnActive = false;
    totalMerges = 0;
    totalBounces = 0;
    currentStreak = 0;
    isHardMode = false;
    for (const key in achievements) {
      achievements[key].unlocked = false;
      if (achievements[key].counter !== undefined) achievements[key].counter = 0;
      if (achievements[key].timerActive !== undefined) achievements[key].timerActive = false;
      if (achievements[key].timerStart !== undefined) achievements[key].timerStart = 0;
    }
    totalClicks = 0;
    lastBallAddTime = Date.now();
    if (autoSpawnInterval) {
      clearInterval(autoSpawnInterval);
      autoSpawnInterval = null;
    }
    document.querySelectorAll('.ball').forEach(b => b.remove());
    updateUI();
    renderPins();
    saveGame();
    settingsModal.style.display = 'none';
    alert("Progress has been reset! Start fresh and have fun!");
  });
}
window.addEventListener('load', () => {
  const saved = localStorage.getItem('bounceGameState');
  if (saved) {
    const state = JSON.parse(saved);
    money = state.money || 100000;
    level = state.level || 7;
    ballProfit = state.ballProfit || 1;
    availableBalls = state.availableBalls || 5;
    pins = state.pins || [];
    balls = state.balls || [];
    autoSpawnActive = state.autoSpawnActive || false;
    totalMerges = state.totalMerges || 0;
    totalBounces = state.totalBounces || 0;
    currentStreak = state.currentStreak || 0;
    isHardMode = state.isHardMode || false;
    totalClicks = state.totalClicks || 0;
    lastBallAddTime = state.lastBallAddTime || Date.now();
    if (autoSpawnActive) {
      startAutoSpawn();
    }
  }
  const savedAchievements = localStorage.getItem('achievements');
  if (savedAchievements) {
    const savedAch = JSON.parse(savedAchievements);
    for (const key in savedAch) {
        if (achievements[key]) {
            achievements[key].unlocked = savedAch[key].unlocked;
            if (savedAch[key].counter !== undefined) achievements[key].counter = savedAch[key].counter;
            if (savedAch[key].timerActive !== undefined) achievements[key].timerActive = savedAch[key].timerActive;
            if (savedAch[key].timerStart !== undefined) achievements[key].timerStart = savedAch[key].timerStart;
        }
    }
  }
  const savedGraphicQuality = localStorage.getItem('graphicQuality');
  if (savedGraphicQuality && ['low', 'medium', 'high', 'ultra_low'].includes(savedGraphicQuality)) {
      graphicQuality = savedGraphicQuality;
  } else {
      graphicQuality = 'high';
  }
  const savedGlowIntensity = localStorage.getItem('glowIntensity');
  const savedSparkleRate = localStorage.getItem('sparkleRate');
  if (savedGlowIntensity) glowIntensitySlider.value = savedGlowIntensity;
  if (savedSparkleRate) sparkleRateSlider.value = savedSparkleRate;
  const savedEffectGlow = localStorage.getItem('effectGlow');
  const savedEffectPulse = localStorage.getItem('effectPulse');
  const savedEffectShine = localStorage.getItem('effectShine');
  const savedEffectSparkle = localStorage.getItem('effectSparkle');
  const savedEffectTrail = localStorage.getItem('effectTrail');
  effectSettings.glow = savedEffectGlow === 'true';
  effectSettings.pulse = savedEffectPulse === 'true';
  effectSettings.shine = savedEffectShine === 'true';
  effectSettings.sparkle = savedEffectSparkle === 'true';
  effectSettings.trail = savedEffectTrail === 'true';
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && ['dark_purple', 'dark_blue', 'dark_green'].includes(savedTheme)) {
      theme = savedTheme;
  } else {
      theme = 'dark_purple';
  }
  applyTheme();
  const lastVersion = localStorage.getItem('lastVersion') || 'Beta 1.0.0';
  if (lastVersion !== currentVersion) {
    showUpdateNotification();
  }
  updateUI();
  renderPins();
  startGameLoop();
});
window.addEventListener('beforeunload', () => {
  saveGame();
});
function saveGame() {
  const ballsToSave = balls.map(ball => {
    const { element, valueLabel, ...ballData } = ball;
    return ballData;
  });
  localStorage.setItem(
    'bounceGameState',
    JSON.stringify({
      money,
      level,
      ballProfit,
      pins,
      balls: ballsToSave,
      availableBalls,
      autoSpawnActive,
      totalMerges,
      totalBounces,
      currentStreak,
      isHardMode,
      totalClicks,
      lastBallAddTime
    })
  );
  localStorage.setItem('achievements', JSON.stringify(achievements));
  localStorage.setItem('lastVersion', currentVersion);
  if (glowIntensitySlider) localStorage.setItem('glowIntensity', glowIntensitySlider.value);
  if (sparkleRateSlider) localStorage.setItem('sparkleRate', sparkleRateSlider.value);
  localStorage.setItem('graphicQuality', graphicQuality);
  localStorage.setItem('effectGlow', effectSettings.glow);
  localStorage.setItem('effectPulse', effectSettings.pulse);
  localStorage.setItem('effectShine', effectSettings.shine);
  localStorage.setItem('effectSparkle', effectSettings.sparkle);
  localStorage.setItem('effectTrail', effectSettings.trail);
  localStorage.setItem('theme', theme);
}