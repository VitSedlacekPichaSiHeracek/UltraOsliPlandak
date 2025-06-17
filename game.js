// ----- Add these globals for the map -----

const MAP_SIZE = 3;
let playerPos = { x: 1, y: 1 };  // start in center
let mapGrid = [];
let clearedRooms = new Set(); // store cleared fight rooms as "x,y"
let currentRoomType = null;  // 'fight', 'shop', 'rest', 'empty'

// Initialize map grid randomly on game start
function generateMap() {
  // Randomly assign room types for each grid cell
  // Ensure center is empty or rest room
  const roomTypes = ["fight", "shop", "rest", "empty"];
  mapGrid = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    let row = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x === 1 && y === 1) {
        row.push("rest"); // start position is rest room
      } else {
        // Randomly pick room type weighted to have more fights
        let rand = Math.random();
        if (rand < 0.5) row.push("fight");
        else if (rand < 0.7) row.push("shop");
        else if (rand < 0.85) row.push("rest");
        else row.push("empty");
      }
    }
    mapGrid.push(row);
  }
}

// Returns string key for room coordinate
function roomKey(x, y) {
  return `${x},${y}`;
}

// Check if player can move in a direction
function canMove(dx, dy) {
  let nx = playerPos.x + dx;
  let ny = playerPos.y + dy;
  return nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE;
}

// Move player and handle entering new room
function movePlayer(dx, dy) {
  if (!canMove(dx, dy)) {
    log("🚫 You can't move outside the map!");
    return;
  }
  playerPos.x += dx;
  playerPos.y += dy;

  enterRoom();
}

// Enter current room and render based on room type
function enterRoom() {
  const x = playerPos.x;
  const y = playerPos.y;
  currentRoomType = mapGrid[y][x];
  const key = roomKey(x, y);

  // If fight room and cleared, treat as empty now
  if (currentRoomType === "fight" && clearedRooms.has(key)) {
    currentRoomType = "empty";
  }

  log(`🏃 You moved to room (${x + 1},${y + 1}) — ${currentRoomType}`);

  switch (currentRoomType) {
    case "fight":
      startFight();
      break;
    case "shop":
      renderShop();
      break;
    case "rest":
      player.hp = player.maxHp;
      log("🛌 You rested and restored your HP.");
      renderPlayerStats();
      renderMapLobby();
      break;
    case "empty":
    default:
      renderMapLobby();
      break;
  }
}

// Render map lobby with minimap and movement controls
function renderMapLobby() {
  let mapHtml = "<table class='map'>";
  for (let y = 0; y < MAP_SIZE; y++) {
    mapHtml += "<tr>";
    for (let x = 0; x < MAP_SIZE; x++) {
      const key = roomKey(x, y);
      let room = mapGrid[y][x];
      if (room === "fight" && clearedRooms.has(key)) room = "cleared";

      let cellClass = "";
      if (playerPos.x === x && playerPos.y === y) cellClass = "player";

      mapHtml += `<td class="${cellClass} room-${room}">${room === "cleared" ? "✓" : room[0].toUpperCase()}</td>`;
    }
    mapHtml += "</tr>";
  }
  mapHtml += "</table>";

  gameScreen.innerHTML = `
    <h2>🗺️ Map Lobby</h2>
    ${mapHtml}
    <p>Use the buttons below to move.</p>
    <div>
      <button id="upBtn" ${!canMove(0,-1) ? "disabled" : ""}>⬆️ Up</button><br>
      <button id="leftBtn" ${!canMove(-1,0) ? "disabled" : ""}>⬅️ Left</button>
      <button id="downBtn" ${!canMove(0,1) ? "disabled" : ""}>⬇️ Down</button>
      <button id="rightBtn" ${!canMove(1,0) ? "disabled" : ""}>➡️ Right</button>
    </div>
    <p>Score: ${score}</p>
  `;

  document.getElementById("upBtn").onclick = () => movePlayer(0, -1);
  document.getElementById("leftBtn").onclick = () => movePlayer(-1, 0);
  document.getElementById("downBtn").onclick = () => movePlayer(0, 1);
  document.getElementById("rightBtn").onclick = () => movePlayer(1, 0);

  renderPlayerStats();
}

// --- Fix fight end bug: mark fight room cleared and go back to map ---

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

    // Mark room cleared
    clearedRooms.add(roomKey(playerPos.x, playerPos.y));

    // Return to map lobby automatically
    enterRoom();

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

    clearedRooms.add(roomKey(playerPos.x, playerPos.y));
    enterRoom();

  } else {
    enemyTurn();
  }

  renderPlayerStats();
  renderFightScreen();
  updateButtons();
}

// -- On game start --

function startGame() {
  score = 0;
  clearedRooms.clear();
  playerPos = { x: 1, y: 1 };
  generateMap();
  resetPlayer();
  enterRoom();
  log("👋 Welcome to Epic Turn-Based Combat with Exploration!");
}

startGame();


