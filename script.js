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

let currentSum = null;     // résultat “actuel”
let predicted = null;      // "higher" | "lower" | null
let streak = 0;
let gameState = "idle";    // "idle" | "choose" | "rolling" | "over"

function randDie() {
  // 1 à 6
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

  if (win) {
    showOverlay(ASSETS.win, "Victoire");
  } else {
    showOverlay(ASSETS.gameover, "Game Over");
  }
}

function resetGame() {
  currentSum = null;
  predicted = null;
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

function startOrResolveRoll() {
  if (gameState === "rolling" || gameState === "over") return;

  // 1er lancer : on initialise le "résultat actuel"
  if (currentSum === null) {
    gameState = "rolling";
    el.btnRoll.disabled = true;
    setMessage("Lancement...");
    setTimeout(() => {
      const r = roll2Dice();
      setDice(r.d1, r.d2, r.sum);
      currentSum = r.sum;

      gameState = "choose";
      el.btnRoll.disabled = true;
      enableChoices(true);
      setMessage(`Total actuel: ${currentSum}. Le prochain sera supérieur ou inférieur ?`);
    }, 250);
    return;
  }

  // Si on a déjà un currentSum, on ne lance pas tant que le joueur n'a pas choisi
  if (gameState === "choose") {
    setMessage("Choisis d'abord : supérieur ou inférieur.");
  }
}

function choosePrediction(dir) {
  if (gameState !== "choose") return;

  predicted = dir; // "higher" | "lower"
  enableChoices(false);
  el.btnRoll.disabled = true;

  // On lance ensuite automatiquement (ou tu peux préférer un bouton "Confirmer")
  gameState = "rolling";
  setMessage("Lancement...");

  setTimeout(() => {
    const r = roll2Dice();
    setDice(r.d1, r.d2, r.sum);

    const nextSum = r.sum;

    if (nextSum === currentSum) {
      // Egalité : rien ne se passe
      setMessage(`Égalité (${currentSum}). Rien ne se passe. Re-choisis.`);
      gameState = "choose";
      enableChoices(true);
      predicted = null;
      return;
    }

    const isHigher = nextSum > currentSum;
    const correct =
      (predicted === "higher" && isHigher) ||
      (predicted === "lower" && !isHigher);

    if (!correct) {
      setMessage(`Raté ! (${currentSum} → ${nextSum})`);
      setGameOver(false);
      return;
    }

    // Bon choix
    streak += 1;
    setStreak(streak);

    if (streak >= GOAL_STREAK) {
      setMessage(`Gagné ! 6 d'affilée. (${currentSum} → ${nextSum})`);
      setGameOver(true);
      return;
    }

    // On continue : le next devient le current
    setMessage(`Bien joué ! (${currentSum} → ${nextSum}). Re-choisis.`);
    currentSum = nextSum;
    predicted = null;
    gameState = "choose";
    enableChoices(true);
  }, 350);
}

// Events
el.btnRoll.addEventListener("click", startOrResolveRoll);
el.btnHigher.addEventListener("click", () => choosePrediction("higher"));
el.btnLower.addEventListener("click", () => choosePrediction("lower"));

el.btnRestart.addEventListener("click", resetGame);
el.overlayRestart.addEventListener("click", resetGame);

// Init
resetGame();