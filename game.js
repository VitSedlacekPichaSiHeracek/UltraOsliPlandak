const logEl = document.getElementById("log");
const playerStatsEl = document.getElementById("playerStats");
const gameScreen = document.getElementById("gameScreen");
const highScoreEl = document.getElementById("highScore");

let highScore = parseInt(localStorage.getItem("highScore")) || 0;
highScoreEl.textContent = highScore;

const enemiesData = [
  {
    name: "Slime",
    maxHp: 30,
    damage: 5,
    art: `  ___\n ( o )\n/  _  \\\n\\___/`,
    special: null,
  },
  {
    name: "Goblin",
    maxHp: 50,
    damage: 10,
    art: `  ,      ,\n /(.-""-.)\\\n|\\  \\/  /|\n\\ )    ( /\n ||    ||`,
    special: "dodge",
  },
  {
    name: "Orc",
    maxHp: 80,
    damage: 15,
    art: `  .----.\n /   o  \\\n|  o   o |\n\\__\\_/__/`,
    special: "poison",
  },
  {
    name: "Dragon",
    maxHp: 120,
    damage: 25,
    art: `     / \\  //\\\n  /   \\(( . ))\n (     ))   ((\n  \\___//\\_//`,
    special: "firebreath",
  },
];

// Player object
const player = {
  level: 1,
  xp: 0,
  xpToNext: 50,
  maxHp: 100,
  hp: 100,
  baseDamage: 15,
  critChance: 0.1,
  shieldActive: false,
  potions: 3,
};

// Current enemy object
let enemy = null;
let score = 0;
let inFight = false;

function log(message) {
  logEl.innerHTML = message + "<br>" + logEl.innerHTML;
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreEl.textContent = highScore;
  }
}

function renderPlayerStats() {
  playerStatsEl.innerHTML = `
  <div class="stats-bar">
    <div>
      <div class="hp-fill" style="width:${(player.hp / player.maxHp) * 100}%"></div>
      <span>HP: ${player.hp} / ${player.maxHp}</span>
    </div>
    <div>
      <div class="xp-fill" style="width:${(player.xp / player.xpToNext) * 100}%"></div>
      <span>XP: ${player.xp} / ${player.xpToNext}</span>
    </div>
  </div>
  <p>Level: ${player.level} | Potions: ${player.potions}</p>
  `;
}

function getRandomEnemy() {
  const index = Math.floor(Math.random() * enemiesData.length);
  const base = enemiesData[index];
  return {
    ...base,
    hp: base.maxHp + score * 5, // scale enemy hp with score
    damage: base.damage + score * 2,
  };
}

function startFight() {
  if (inFight) return;
  enemy = getRandomEnemy();
  inFight = true;
  log(`⚔️ A wild ${enemy.name} appears!`);
  renderFightScreen();
  renderPlayerStats();
}

function renderFightScreen() {
  gameScreen.innerHTML = `
    <div>
      <pre class="enemy-art">${enemy.art}</pre>
      <h2>${enemy.name}</h2>
      <div class="stats-bar">
        <div>
          <div class="hp-fill" style="width:${(enemy.hp / enemy.maxHp) * 100}%"></div>
          <span>HP: ${enemy.hp} / ${enemy.maxHp}</span>
        </div>
      </div>
      <div>
        <button id="attackBtn">Attack</button>
        <button id="fireballBtn">🔥 Fireball (costs 1 potion)</button>
        <button id="shieldBtn">🛡️ Shield (blocks next attack)</button>
        <button id="healBtn">💊 Heal (costs 1 potion)</button>
      </div>
    </div>
  `;

  document.getElementById("attackBtn").onclick = playerAttack;
  document.getElementById("fireballBtn").onclick = playerFireball;
  document.getElementById("shieldBtn").onclick = playerShield;
  document.getElementById("healBtn").onclick = playerHeal;

  updateButtons();
}

function updateButtons() {
  document.getElementById("fireballBtn").disabled = player.potions < 1;
  document.getElementById("healBtn").disabled = player.potions < 1;
}

function enemyTurn() {
  if (!inFight) return;
  if (enemy.hp <= 0) return;

  let dmg = enemy.damage;

  if (enemy.special === "dodge" && Math.random() < 0.3) {
    log(`👹 ${enemy.name} dodged your attack!`);
    return;
  }

  if (enemy.special === "firebreath" && Math.random() < 0.2) {
    dmg += 10;
    log(`🔥 ${enemy.name} uses firebreath for extra damage!`);
  }

  if (player.shieldActive) {
    log("🛡️ Your shield blocked the enemy's attack!");
    player.shieldActive = false;
  } else {
    if (enemy.special === "poison" && Math.random() < 0.3) {
      dmg += 5;
      player.poisoned = true;
      log(`☠️ ${enemy.name} poisoned you!`);
    }

    player.hp -= dmg;
    log(`💥 ${enemy.name} hits you for ${dmg} damage!`);
  }

  if (player.hp <= 0) {
    log("☠️ You have been defeated! Game over.");
    inFight = false;
    score = 0;
    resetPlayer();
    renderLobby();
  }

  renderPlayerStats();
  renderFightScreen();
}

function playerAttack() {
  if (!inFight) return;

  let damage = player.baseDamage;
  const crit = Math.random() < player.critChance;
  if (crit) {
    damage *= 2;
    log("💥 Critical hit!");
  }

  enemy.hp -= damage;
  log(`🗡️ You attack ${enemy.name} for ${damage} damage.`);

  if (enemy.hp <= 0) {
    log(`✅ You defeated ${enemy.name}!`);
    score++;
    player.xp += 20;
    checkLevelUp();
    updateHighScore();
    inFight = false;
    renderLobby();
  } else {
    enemyTurn();
  }

  renderPlayerStats();
  renderFightScreen();
}

function playerFireball() {
  if (!inFight) return;
  if (player.potions < 1) {
    log("❌ Not enough potions!");
    return;
  }
  player.potions--;
  let damage = player.baseDamage * 1.5;
  enemy.hp -= damage;
  log(`🔥 You cast fireball and deal ${damage.toFixed(0)} damage!`);

  if (enemy.hp <= 0) {
    log(`✅ You defeated ${enemy.name}!`);
    score++;
    player.xp += 30;
    checkLevelUp();
    updateHighScore();
    inFight = false;
    renderLobby();
  } else {
    enemyTurn();
  }

  renderPlayerStats();
  renderFightScreen();
  updateButtons();
}

function playerShield() {
  if (!inFight) return;
  player.shieldActive = true;
  log("🛡️ Shield activated! You will block the next attack.");
  enemyTurn();
  renderPlayerStats();
  renderFightScreen();
}

function playerHeal() {
  if (!inFight) return;
  if (player.potions < 1) {
    log("❌ Not enough potions!");
    return;
  }
  player.potions--;
  const healAmount = 20 + Math.floor(Math.random() * 10);
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
  log(`💊 You healed for ${healAmount} HP.`);
  enemyTurn();
  renderPlayerStats();
  renderFightScreen();
  updateButtons();
}

function checkLevelUp() {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.maxHp += 20;
    player.baseDamage += 5;
    player.hp = player.maxHp;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);
    player.potions++; // reward potion on level up
    log(`🎉 Level up! You are now level ${player.level}. HP and damage increased!`);
  }
}

function resetPlayer() {
  player.hp = player.maxHp;
  player.xp = 0;
  player.level = 1;
  player.xpToNext = 50;
  player.baseDamage = 15;
  player.potions = 3;
  player.shieldActive = false;
  log("🔄 Player reset.");
  renderPlayerStats();
}

function renderLobby() {
  gameScreen.innerHTML = `
    <h2>🏠 Lobby</h2>
    <p>Score: ${score}</p>
    <button id="startFightBtn">⚔️ Fight Next Enemy</button>
    <button id="restBtn">🛌 Rest (Restore HP)</button>
    <button id="shopBtn">🛒 Shop (Buy Potions)</button>
  `;
  document.getElementById("startFightBtn").onclick = () => {
    startFight();
  };
  document.getElementById("restBtn").onclick = () => {
    player.hp = player.maxHp;
    log("🛌 You rested and restored your HP.");
    renderPlayerStats();
  };
  document.getElementById("shopBtn").onclick = () => {
    renderShop();
  };
  renderPlayerStats();
}

function renderShop() {
  gameScreen.innerHTML = `
    <h2>🛒 Shop</h2>
    <p>Potions cost 10 XP each.</p>
    <p>You have ${player.xp} XP.</p>
    <button id="buyPotionBtn">Buy Potion</button>
    <button id="backBtn">Back to Lobby</button>
  `;
  document.getElementById("buyPotionBtn").onclick = () => {
    if (player.xp >= 10) {
      player.xp -= 10;
      player.potions++;
      log("🛍️ You bought a potion.");
      renderShop();
      renderPlayerStats();
    } else {
      log("❌ Not enough XP to buy potion.");
    }
  };
  document.getElementById("backBtn").onclick = () => {
    renderLobby();
  };
  renderPlayerStats();
}

// Initial load
log("👋 Welcome to Epic Turn-Based Combat!");
renderLobby();
renderPlayerStats();

