// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI elements
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const upgradeEl = document.getElementById("upgrade");
const bgm = document.getElementById("bgm");

// Game state
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
highScoreEl.textContent = highScore;

// Sprites
const shipImg = new Image(), enemyImg = new Image(), bossImg = new Image();
shipImg.src = "https://i.imgur.com/Q9ZVpSv.png";
enemyImg.src = "https://i.imgur.com/6XzSqa4.png";
bossImg.src = "https://i.imgur.com/V5saLo7.png";

// Player
const ship = { x: 185, y: 540, width: 30, height: 30, speed: 5, shield: false };

// Entities
const bullets = [], enemies = [], explosions = [], powerups = [];

// Control and upgrades
let keys = {}, upgrade = "normal", wave = 1, fireCooldown = 0;
let bossWaveIntervals = new Set();

// Input
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);
canvas.addEventListener("mousedown", () => shoot());

// Helpers
function shoot() {
  if (fireCooldown > 0) return;
  fireCooldown = upgrade === "rapid" ? 5 : 20;
  ["normal","double"].includes(upgrade) || fireCooldown;
  const shots = upgrade === "double" ? 2 : 1;
  for (let i = 0; i < shots; i++) {
    bullets.push({ x: ship.x + 10 + i*10 - (shots===2?5:0), y: ship.y, speed: 7 });
  }
}
function explode(x,y) { explosions.push({ x,y,r:5,alpha:1 }); }

// Spawning
function spawnWave() {
  for (let i=0;i<wave*5;i++) {
    enemies.push({ x:20+(i%10)*36, y:-30 - Math.floor(i/10)*40, w:30, h:30, speed:1+wave*0.1, hp:1 });
  }
  if (wave % 3 === 0) {
    enemies.push({ x:185, y:-60, w:60, h:60, speed:0.5+(wave)*0.1, hp:10, boss:true });
  }
}
function spawnPowerup(x, y) {
  powerups.push({ x,y,w:20,h:20,type:Math.random()<0.5?"shield":"bomb"});
}

// Update & render
function update() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Movement & shooting
  if (keys["ArrowLeft"]) ship.x = Math.max(0, ship.x - ship.speed);
  if (keys["ArrowRight"]) ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed);
  if (keys[" "]) shoot();
  fireCooldown = Math.max(0, fireCooldown - 1);

  // Draw ship
  if (ship.shield) ctx.globalAlpha = 0.6;
  ctx.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
  ctx.globalAlpha = 1;

  // Bullets
  bullets.forEach((b,i) => {
    b.y -= b.speed;
    if (b.y < 0) bullets.splice(i,1);
    else ctx.fillRect(b.x,b.y,6,10);
  });

  // Enemies
  enemies.forEach((e,ei) => {
    e.y += e.speed;
    ctx.drawImage(e.boss?bossImg:enemyImg,e.x,e.y,e.w,e.h);
    bullets.forEach((b,bi) => {
      if (b.x < e.x+e.w && b.x+6>e.x && b.y<e.y+e.h && b.y+10>e.y) {
        bullets.splice(bi,1);
        e.hp--;
        if (e.hp<=0) {
          enemies.splice(ei,1);
          score += e.boss?50:10;
          if (e.boss) spawnPowerup(e.x+e.w/2,e.y+e.h/2);
          explode(e.x+e.w/2,e.y+e.h/2);
        }
      }
    });
  });

  // Power-ups
  powerups.forEach((p,pi) => {
    p.y += 2;
    ctx.fillStyle = p.type==="shield"?'cyan':'yellow';
    ctx.fillRect(p.x,p.y,p.w,p.h);
    if (p.y > canvas.height) return powerups.splice(pi,1);
    if (ship.x < p.x+p.w && ship.x+ship.width>p.x && ship.y< p.y+p.h && ship.y+ship.height>p.y) {
      if (p.type==="shield") ship.shield=true;
      else upgrade="double";
      powerups.splice(pi,1);
      upgradeEl.textContent = upgrade;
      setTimeout(()=>upgrade="normal",10000);
    }
  });

  // Explosions
  explosions.forEach((ex,i)=>{
    ctx.beginPath();
    ctx.arc(ex.x,ex.y,ex.r,0,2*Math.PI);
    ctx.fillStyle = `rgba(255,165,0,${ex.alpha})`;
    ctx.fill();
    ex.r+=0.7; ex.alpha-=0.03;
    if (ex.alpha<=0) explosions.splice(i,1);
  });

  // New waves
  if (enemies.length === 0) {
    wave++;
    spawnWave();
    if (wave %3 ===0) updateUpgrade();
  }

  requestAnimationFrame(update);
}

// Upgrade logic
function updateUpgrade() {
  if (upgrade==="normal") upgrade="double";
  else if (upgrade==="double") upgrade="rapid";
  else upgrade="normal";
  upgradeEl.textContent = upgrade;
}

// Start
spawnWave();
update();
bgm.volume = 0.2;
bgm.play();
