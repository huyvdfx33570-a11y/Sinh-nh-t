const scenes = {
  gift: document.querySelector(".scene-gift"),
  cake: document.querySelector(".scene-cake"),
  letter: document.querySelector(".scene-letter"),
  envelope: document.querySelector(".scene-envelope"),
};

const cakeWorld = document.querySelector("#cakeWorld");
const cake3d = document.querySelector("#cake3d");
const confettiLayers = document.querySelectorAll(".confetti-layer");
const countdownEl = document.querySelector(".cake-countdown");
const typedLetter = document.querySelector(".typed-letter");
const letterSource = [...document.querySelectorAll(".letter-source p")].map((item) => item.textContent.trim());
const photoDialog = document.querySelector(".photo-dialog");
const photoDialogImage = document.querySelector(".photo-dialog img");

let rotationY = -24;
let rotationX = -13;
let dragStartX = 0;
let dragStartY = 0;
let startRotationY = rotationY;
let startRotationX = rotationX;
let dragging = false;
let cakeTimer;
let cakeCountdownTimer;
let letterEndTimer;
let typingAbort = false;

function switchScene(name) {
  if (photoDialog.open) photoDialog.close();
  Object.values(scenes).forEach((scene) => scene.classList.remove("active"));
  scenes[name].classList.add("active");
}

function clearSceneTimers() {
  clearTimeout(cakeTimer);
  clearInterval(cakeCountdownTimer);
  clearTimeout(letterEndTimer);
}

function updateCakeTransform() {
  cake3d.style.setProperty("--rot-y", `${rotationY}deg`);
  cake3d.style.setProperty("--rot-x", `${rotationX}deg`);
}

function animateCake() {
  if (scenes.cake.classList.contains("active") && !dragging) {
    rotationY += 0.08;
    updateCakeTransform();
  }

  requestAnimationFrame(animateCake);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function markMissingImages() {
  document.querySelectorAll(".panel, .top-disc img, .inside-photos img, .polaroid img, .balloon-photo img").forEach((item) => {
    const image = item.matches("img") ? item : item.querySelector("img");
    if (!image) return;

    image.addEventListener("error", () => {
      item.classList.add("missing");
    });

    image.addEventListener("load", () => {
      item.classList.remove("missing");
    });

    if (image.complete && image.naturalWidth === 0) {
      item.classList.add("missing");
    }
  });
}

function createConfetti() {
  const colors = ["#ec3f91", "#ff9fc8", "#ffffff", "#ffd166", "#7bdff2"];

  confettiLayers.forEach((layer) => {
    for (let i = 0; i < 32; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 5}s`;
      piece.style.animationDuration = `${5 + Math.random() * 4}s`;
      piece.style.setProperty("--drift", `${Math.random() * 120 - 60}px`);
      layer.append(piece);
    }
  });
}

function startCakeScene() {
  clearSceneTimers();
  typingAbort = true;
  switchScene("cake");

  let secondsLeft = 10;
  countdownEl.textContent = secondsLeft;

  cakeCountdownTimer = setInterval(() => {
    secondsLeft -= 1;
    countdownEl.textContent = Math.max(secondsLeft, 0);
  }, 1000);

  cakeTimer = setTimeout(() => {
    startLetterScene();
  }, 10000);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function typeTextInto(paragraph, text) {
  paragraph.classList.add("typing-caret");

  for (const char of text) {
    if (typingAbort) return;
    paragraph.textContent += char;
    typedLetter.scrollTop = typedLetter.scrollHeight;
    await delay(char === " " ? 12 : 24);
  }

  paragraph.classList.remove("typing-caret");
}

async function startLetterScene() {
  clearSceneTimers();
  typingAbort = false;
  switchScene("letter");
  typedLetter.replaceChildren();

  for (const text of letterSource) {
    if (typingAbort) return;
    const paragraph = document.createElement("p");
    typedLetter.append(paragraph);
    await typeTextInto(paragraph, text);
    await delay(260);
  }

  if (typingAbort) return;
  letterEndTimer = setTimeout(() => {
    switchScene("envelope");
  }, 20000);
}

cakeWorld.addEventListener("pointerdown", (event) => {
  dragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  startRotationY = rotationY;
  startRotationX = rotationX;
  cakeWorld.setPointerCapture(event.pointerId);
});

cakeWorld.addEventListener("pointermove", (event) => {
  if (!dragging) return;

  rotationY = startRotationY + (event.clientX - dragStartX) * 0.45;
  rotationX = clamp(startRotationX - (event.clientY - dragStartY) * 0.18, -28, 12);
  updateCakeTransform();
});

cakeWorld.addEventListener("pointerup", (event) => {
  dragging = false;
  cakeWorld.releasePointerCapture(event.pointerId);
});

document.querySelectorAll("[data-rotate]").forEach((button) => {
  button.addEventListener("click", () => {
    rotationY += Number(button.dataset.rotate);
    updateCakeTransform();
  });
});

document.querySelectorAll("[data-tilt]").forEach((button) => {
  button.addEventListener("click", () => {
    rotationX = clamp(rotationX + Number(button.dataset.tilt), -28, 12);
    updateCakeTransform();
  });
});

document.querySelector("[data-reset]").addEventListener("click", () => {
  rotationY = -24;
  rotationX = -13;
  updateCakeTransform();
});

document.querySelector(".gift-button").addEventListener("click", startCakeScene);
document.querySelector(".envelope-button").addEventListener("click", startLetterScene);
document.querySelector(".close-card").addEventListener("click", () => {
  typingAbort = true;
  clearSceneTimers();
  switchScene("envelope");
});

document.querySelectorAll(".polaroid").forEach((button) => {
  button.addEventListener("click", () => {
    const image = button.querySelector("img");
    photoDialogImage.src = button.dataset.full || image.src;
    photoDialog.showModal();
  });
});

document.querySelector(".close-photo").addEventListener("click", () => {
  photoDialog.close();
});

markMissingImages();
createConfetti();
updateCakeTransform();
animateCake();
