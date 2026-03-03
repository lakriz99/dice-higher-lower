const GOAL_STREAK = 6;

const el = {
  die1: document.getElementById("die1"),
  die2: document.getElementById("die2"),
  sum: document.getElementById("sum"),
  streak: document.getElementById("streak"),
  message: document.getElementById("message"),

  btnRoll: document.getElementById("btnRoll"),
  btnHigher: document.getElementById("btnHigher"),
  btnLower: document.getElementById("btnLower"),
  btnRestart: document.getElementById("btnRestart"),

  overlay: document.getElementById("overlay"),
  overlayImg: document.getElementById("overlayImg"),
  overlayRestart: document.getElementById("overlayRestart"),
};

const ASSETS = {
  gameover: "assets/gameover.png",
  win: "assets/win.png",
};

let currentSum = null;      // résultat actuel (référence)
let streak = 0;
let gameState = "idle";     // idle | choose | rolling | over

function randDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function roll2Dice() {
  const d1 = randDie();
  const d2 = randDie();
  return { d1, d2, sum: d1 + d2 };
}

function setDice(d1, d2, sum) {
  el.die1.textContent = String(d1);
  el.die2.textContent = String(d2);
  el.sum.textContent = String(sum);
}

function setMessage(text) {
  el.message.textContent = text;
}

function setStreak(n) {
  el.streak.textContent = String(n);
}

function enableChoices(enabled) {
  el.btnHigher.disabled = !enabled;
  el.btnLower.disabled = !enabled;
}

function showOverlay(imgSrc, alt) {
  el.overlayImg.src = imgSrc;
  el.overlayImg.alt = alt;
  el.overlay.classList.remove("hidden");
}

function hideOverlay() {
  el.overlay.classList.add("hidden");
  el.overlayImg.src = "";
  el.overlayImg.alt = "";
}

function setGameOver(win) {
  gameState = "over";
  el.btnRoll.disabled = true;
  enableChoices(false);
  el.btnRestart.disabled = false;

  showOverlay(win ? ASSETS.win : ASSETS.gameover, win ? "Victoire" : "Game Over");
}

function resetGame() {
  currentSum = null;
  streak = 0;
  gameState = "idle";

  setDice("–", "–", "–");
  setStreak(0);
  setMessage("Clique sur “Lancer” pour commencer.");

  el.btnRoll.disabled = false;
  enableChoices(false);
  el.btnRestart.disabled = true;

  hideOverlay();
}

/**
 * Animation de dés:
 * - pendant ~900ms, on change les faces très vite (effet roulette)
 * - on ajoute une classe CSS rolling pour le "shake"
 */
function animateDice(finalRoll, durationMs = 900) {
  return new Promise((resolve) => {
    const start = performance.now();
    const interval = 65; // vitesse de "défilement"

    el.die1.classList.add("rolling");
    el.die2.classList.add("rolling");

    const timer = setInterval(() => {
      const temp1 = randDie();
      const temp2 = randDie();
      setDice(temp1, temp2, temp1 + temp2);

      const now = performance.now();
      if (now - start >= durationMs) {
        clearInterval(timer);

        // Fin: on affiche le vrai résultat
        setDice(finalRoll.d1, finalRoll.d2, finalRoll.sum);

        el.die1.classList.remove("rolling");
        el.die2.classList.remove("rolling");

        resolve();
      }
    }, interval);
  });
}

async function firstRoll() {
  if (gameState !== "idle") return;
  gameState = "rolling";
  el.btnRoll.disabled = true;
  setMessage("Lancement...");

  const r = roll2Dice();
  await animateDice(r);

  currentSum = r.sum;
  gameState = "choose";
  enableChoices(true);
  setMessage(`Total actuel: ${currentSum}. Le prochain sera supérieur ou inférieur ?`);
}

async function resolveChoice(choice) {
  if (gameState !== "choose") return;

  gameState = "rolling";
  enableChoices(false);
  el.btnRoll.disabled = true;
  setMessage("Lancement...");

  const r = roll2Dice();
  await animateDice(r);

  const nextSum = r.sum;

  // Egalité => rien ne se passe, on re-choisit, la référence reste currentSum
  if (nextSum === currentSum) {
    gameState = "choose";
    enableChoices(true);
    setMessage(`Égalité (${currentSum}). Rien ne se passe. Re-choisis.`);
    return;
  }

  const isHigher = nextSum > currentSum;
  const correct =
    (choice === "higher" && isHigher) ||
    (choice === "lower" && !isHigher);

  if (!correct) {
    setMessage(`Raté ! (${currentSum} → ${nextSum})`);
    setGameOver(false);
    return;
  }

  streak += 1;
  setStreak(streak);

  if (streak >= GOAL_STREAK) {
    setMessage(`Gagné ! 6 d'affilée. (${currentSum} → ${nextSum})`);
    setGameOver(true);
    return;
  }

  // On continue : le nouveau devient la référence
  currentSum = nextSum;
  gameState = "choose";
  enableChoices(true);
  setMessage(`Bien joué ! (${currentSum}). Re-choisis.`);
}

// Bonus UX: fermer overlay au clic dehors + ESC
function setupOverlayUX() {
  el.overlay.addEventListener("click", (e) => {
    if (e.target === el.overlay) resetGame();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.overlay.classList.contains("hidden")) {
      resetGame();
    }
  });
}

// Events
el.btnRoll.addEventListener("click", firstRoll);
el.btnHigher.addEventListener("click", () => resolveChoice("higher"));
el.btnLower.addEventListener("click", () => resolveChoice("lower"));
el.btnRestart.addEventListener("click", resetGame);
el.overlayRestart.addEventListener("click", resetGame);

// Init
setupOverlayUX();
resetGame();
