let controlVideo = document.getElementById('controlVideo');
let disruptVideo = document.getElementById('introVideo');
let interventionVideo = document.getElementById('interventionVideo');
let reflectionVideo = document.getElementById('reflectionVideo');
let lossVideo = document.getElementById('lossVideo');
let currentVideo = controlVideo; // Start with control
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let model, webcam, indexTipX, indexTipY;
let handOpacity = 0.5; // Start a bit visible
let currentScene = '';
let controlInteractionType = 'breathe';
// let controlInteractionType = 'levitate';
const alphabet = ['D', 'I', 'S', 'R', 'U', 'P', 'T', 'B', 'L', 'U', 'R', 'C', 'O', 'V', 'A', 'E'];
const disruptAlphabet = ['G', 'L', 'I', 'T', 'C', 'H', 'B', 'R', 'S', 'W', 'V'];
let letters = []; 
let controlLetters = [];
// Global smoother breathing progress
let smoothedBreath = 1;
let palmX, palmY;
let handLandmarks = [];

let hasPromptFaded = false;
let handDetected = false;
let promptFadeTimer = null;

let sphereFadeIn = 0;
let sphereScaleProgress = 0;
let sphereStartAnimating = false;

let breathingStartTime = null;
let breathingFadeProgress = 0;

let loadingProgress = 0; // 0 to 100
let isInteractingWithSphere = false;
let isTransitioning = false;
let interactionHoldFrames = 0;
const framesToHold = 60;
let displayedLoadingProgress = 0;

let interactionDisabled = false;
let isInExitPrompt = false;

let earthFadeOut = false;
let earthFadeAlpha = 1.0;
let disruptLetters = [];

let disruptSphereFadeIn = 0;
let disruptSphereScaleProgress = 0;
let disruptSphereStartAnimating = false;

let disruptTouchedLetters = new Set(); // Tracks touched letters
let disruptProgress = 0;
let disruptDisplayedProgress = 0;
let disruptTransitionStarted = false;
let disruptBarHidden = false;

let activeBg = null; 
let disruptSceneInitialized = false;
let disruptEnteredFromButton = false;

// let interventionLetters = [];

let interventionTouched = new Set();
let interventionSphereComplete = false;
let interventionSceneInitialized = false;

let interventionEarthAssembled = false;



let interventionInteractionComplete = false;

const promiseSentences = [
  "Refuse single-use plastic",
  "Reduce energy at home",
  "Choose local produce.",
  "Walk or cycle more",
  "Plant trees in your community",
  "Support clean energy",
  "Speak for the silent skies"
];

let interventionSentencesEmitted = [];
let interventionProgress = 0;
let interventionProgressVisual = 0;
let interventionGlowColor = 'rgba(201,123,73,1)'; 

// ========== NEW GLOBALS FOR INTERVENTION ==========
let interventionSphereLetters = [];
let interventionSentences = [];
let glowingPoints = new Set(); // To track which parts of the sphere have glowed
let maxGlowPoints = 15; // Adjust this based on desired sensitivity
let sentencePool = [
  "Refusing single-use plastic",
  "Reducing energy at home",
  "Choosing local produce.",
  "Walking more",
  "Cycling more",
  "Planting trees in my community",
  "Supporting clean energy",
  "Speaking for the silent skies",
  "Using less plastic",
  "Choosing public transport",
  "Avoiding fast fashion",
  "Spreading awareness"
];
const MAX_GLOW_POINTS = 12; // Or 15–20 depending on how long you want interaction

let lastGlowTime = 0;
let glowCooldown = 800; // in ms

let autoGlowing = false;
let autoGlowProgress = 0; // 0 to 1
const estimatedMaxGlowKeys = 80;


//Reflection Variables
let selectedPromise = null;
let selectedPromiseLetters = null;
let promiseHoldTimer = null;
let holdStartTime = null;
const holdDuration = 1300; // 1.5 seconds

let hoveredBox = null;
let promiseHoldStart = null;
let holdAnimationFrame;

let drawnLetters = [];
//to increase number of letters in the sphere
// let maxLetters = 200;
let maxLetters = 190;
let drawProgress = 0;
let isDrawingPhase = false;

let lastLetterPlacedAt = 0;
//20 faster >>> 120 slower
const drawDelay = 95; 

let smoothedX = null;
let smoothedY = null;
const smoothingFactor = 0.3;

let isFinalInteractionPhase = false;
let finalBreathingStarted = false; 

let finalProgress = 0;
let finalProgressTarget = 100;

let shouldShowGlowingFinger = true;
let isDrawingPhaseDone = false;

let isFinalEarthReady = false;

let finalEarthLetters = [];
let earthCentroid = null;

let reflectionLoadingInitialized = false;

let showDrawHint = false; // toggled after promise selection
let drawHintFading = false;
let drawHintOpacity = 0.3; // initial opacity


//home screen global flags
let homeSceneActive = true;
let palmHoldStartTime = null;
let palmHeldLongEnough = false;
let playIconVisible = false;
let homePalmDetected = false;
let playHoverProgress = 0;
let playHoverThreshold = 80;


//New home screen globals
let onHomeScreen = true;
let palmHoldFrames = 0;
let showPlayIcon = false;
let playProgress = 0;
let playHovering = false;
let playIconFilled = false;

let palmLostFrames = 0;

let inactivityTimeout = null;

let homeResetTimer = null;


async function setup() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();

  // Request webcam access early
  webcam = document.createElement('video');
  webcam.setAttribute('autoplay', true);
  webcam.setAttribute('playsinline', true);
  webcam.style.display = 'none';
  document.body.appendChild(webcam);

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcam.srcObject = stream;

  model = await handpose.load();
  console.log("Handpose model loaded");

  createLetters();

  // Start with CONTROL video
  currentVideo = controlVideo;
  controlVideo.style.display = 'none';
  disruptVideo.style.display = 'none';
  lossVideo.style.display = 'none';
  interventionVideo.style.display = 'none';
  reflectionVideo.style.display = 'none';

  canvas.style.display = 'none';

  //ADD CONDITIONAL CHECK TO START THE EXPERIENCE AFTER ENTERED
  if (onHomeScreen) {
    canvas.style.display = 'block'; 
    requestAnimationFrame(detectHands);
  }

  disruptVideo.addEventListener('ended', () => {
    controlVideo.pause();
      controlVideo.currentTime = 0;
      controlVideo.style.display = 'none';

      currentScene = 'disrupt';
      // if (!disruptSceneInitialized) { // Initialize sphere letters
        disruptSceneInitialized = true;
        createDisruptLetters();
        showDisruptInteractionPrompt();
      // }
      disruptVideo.pause();
      disruptVideo.style.display = 'none';
      canvas.style.display = 'block';
      document.getElementById('skipButton').style.display = 'none';
  });

  document.getElementById('skipButton').addEventListener('click', () => {
    currentVideo.pause();
    currentVideo.style.display = 'none';
    document.getElementById('skipButton').style.display = 'none';
    canvas.style.display = 'block';

    createControlLetters(); // make sure sphere letters are created
    currentScene = 'control'; // set the correct scene
    showInteractionPrompt();
    // requestAnimationFrame(detectHands);
  });

document.getElementById('devSkipLoss').addEventListener('click', () => {
    // Stop any currently playing videos
    controlVideo.pause();
    disruptVideo.pause();
    controlVideo.currentTime = 0;
    disruptVideo.currentTime = 0;
    controlVideo.style.display = 'none';
    disruptVideo.style.display = 'none';

    // Hide canvas until ready
    canvas.style.display = 'none';

    // Clear existing letters and flags
    controlLetters = [];
    disruptLetters = [];
    letters = [];
    hasPromptFaded = false;
    isInExitPrompt = false;
    isTransitioning = false;
    interactionDisabled = true;

    // Set the correct scene
    currentScene = 'loss';

    // Hide previous prompt and messages
    document.getElementById('interactionPrompt').style.display = 'none';
    document.getElementById('controlMessage').style.display = 'none';
    document.getElementById('disruptMessage').style.display = 'none';

    // Trigger poetic transition
    showLossInteractionPrompt();
  });

  document.getElementById('devSkipDisrupt').addEventListener('click', () => {

      // disruptEnteredFromButton = true; // ✅ prevent video ended logic from running
      // 💥 Stop control video too
      controlVideo.pause();
      controlVideo.currentTime = 0;
      controlVideo.style.display = 'none';
      controlVideo.pause();
      disruptVideo.pause();
      controlVideo.currentTime = 0;
      disruptVideo.currentTime = 0;
      controlVideo.style.display = 'none';
      disruptVideo.style.display = 'none';

      currentScene = 'disrupt';
      // if (!disruptSceneInitialized) { // Initialize sphere letters
        disruptSceneInitialized = true;
        createDisruptLetters();
        showDisruptInteractionPrompt();
      // }
      disruptVideo.pause();
      disruptVideo.style.display = 'none';
      canvas.style.display = 'block';
      document.getElementById('skipButton').style.display = 'none';
    });

  document.getElementById('devSkipIntervention').addEventListener('click', () => {
      // Stop previous video if still running

      [lossVideo, controlVideo, disruptVideo, interventionVideo, reflectionVideo].forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
      });

      // Set scene and initialize
      // currentScene = 'intervention';
      // interventionSceneInitialized = true;

      glowingPoints.clear();
      interventionSentences = [];
      autoCompleteStarted = false;
      interventionProgressVisual = 0;

      canvas.style.display = 'block'; // Hide canvas initially
      document.getElementById('devSkipIntervention').style.display = 'none';

      playReflectionVideo(); 


      // setTimeout(() => {
      //   showFinalInterventionPrompt();
      // }, 500); // Let things render first
      
    });

  window.addEventListener('resize', resizeCanvas);
}

function resetHomeScreen() {
  console.log("Resetting to initial home state due to inactivity");

  showPlayIcon = false;
  palmHoldFrames = 0;
  playProgress = 0;
  playIconFilled = false;

  const logo = document.getElementById('logoContainer');
  logo.style.transition = 'transform 1s ease';
  logo.style.transform = 'translateY(0px) scale(1)';

  const play = document.getElementById('playIconHome');
  play.style.display = 'none';
  play.style.opacity = 0;
  play.style.transform = 'scale(0.8)';

  const progressCircle = document.getElementById('progressCircleHome');
  if (progressCircle) progressCircle.setAttribute('stroke-dashoffset', 251.2); // reset loading

  const hint = document.getElementById('handHintHome');
  hint.classList.remove('glow');

  const hintText = document.getElementById('hintTextHome');
  if (hintText) hintText.innerHTML = "Lift your palm to begin";
}

function startExperience() {
  onHomeScreen = false;
  document.getElementById('homeScreen').style.display = 'none';
  currentVideo = controlVideo;
  controlVideo.style.display = 'block';
  controlVideo.play();

  controlVideo.addEventListener('ended', () => {
    controlVideo.style.display = 'none';
    canvas.style.display = 'block';

    createControlLetters();
    currentScene = 'control';
    showInteractionPrompt();
  });
}

function getRandomPromise() {
  return sentencePool[Math.floor(Math.random() * sentencePool.length)];
}

function createInterventionSphereLetters() {
  interventionSphereLetters = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 220;

  for (let i = 0; i < 350; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = radius * Math.sqrt(Math.random());
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    const char = alphabet[Math.floor(Math.random() * alphabet.length)];

    interventionSphereLetters.push({
      text: char,
      baseX: x,
      baseY: y,
      glow: 0
    });
  }
}

//this Interv New
function drawNewInterventionScene() {
  if (interventionInteractionComplete) return;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const t = (Date.now() % 6000) / 6000;
  const scale = 1 + 0.015 * Math.sin(t * 2 * Math.PI);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);

  ctx.font = '18px Helvetica Neue';

  let glowProgressSum = 0;
  let glowableCount = 0;
  let newGlowKeys = [];

  // 🟠 Start auto glow if 70% glow reached and not already running
  const glowRatio = glowingPoints.size / estimatedMaxGlowKeys; // define estimatedMaxGlowKeys globally (~80)
  if (!autoGlowing && glowRatio >= 0.7) {
    autoGlowing = true;
    autoGlowProgress = 0;
  }

  for (let letter of interventionSphereLetters) {
    const dx = indexTipX - letter.baseX;
    const dy = indexTipY - letter.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const glowKey = `${Math.round(letter.baseX / 20)}-${Math.round(letter.baseY / 20)}`;
    const hasBeenTouched = glowingPoints.has(glowKey);
    const isNewTouch = dist < 90 && !hasBeenTouched;

    if (isNewTouch) {
      newGlowKeys.push(glowKey);
    }

    const isManualGlow = hasBeenTouched || newGlowKeys.includes(glowKey);

    // 🌟 Handle glowing logic
    if (isManualGlow) {
      letter.glow += (1 - letter.glow) * 0.02;
    } else if (autoGlowing) {
      // Auto-glow untouched letters smoothly
      letter.glow += (1 - letter.glow) * 0.02 * autoGlowProgress;
    }

    const glowStrength = letter.glow;
    glowProgressSum += glowStrength;
    glowableCount++;

    // Base to tint transition
    const baseRGB = { r: 201, g: 123, b: 73 };
    const tintRGB = { r: 255, g: 230, b: 190 };
    const r = baseRGB.r + (tintRGB.r - baseRGB.r) * glowStrength;
    const g = baseRGB.g + (tintRGB.g - baseRGB.g) * glowStrength;
    const b = baseRGB.b + (tintRGB.b - baseRGB.b) * glowStrength;

    const fillOpacity = 0.5 + 0.5 * glowStrength;
    ctx.fillStyle = `rgba(${r},${g},${b},${fillOpacity})`;

    if (glowStrength > 0.05) {
      // Single glow layer with mixed warm + white haze
      const blur = 40 + 40 * glowStrength;

      // Mix white into the glow color to simulate outer haze
      const mixedR = Math.round(r + (255 - r) * 0.4 * glowStrength);
      const mixedG = Math.round(g + (255 - g) * 0.4 * glowStrength);
      const mixedB = Math.round(b + (255 - b) * 0.4 * glowStrength);
      const mixedAlpha = Math.min(0.25 + 0.2 * glowStrength, 0.5);

      ctx.shadowColor = `rgba(${mixedR},${mixedG},${mixedB},${mixedAlpha})`;
      ctx.shadowBlur = blur;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.fillText(letter.text, letter.baseX, letter.baseY);
  }

  // Only emit if new untouched glow area is touched
  if (newGlowKeys.length > 0 && Date.now() - lastGlowTime > glowCooldown) {
    const firstKey = newGlowKeys[0];
    glowingPoints.add(firstKey);

    const howMany = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < howMany; i++) {
      emitSmoothSentenceTowards(indexTipX, indexTipY);
    }

    lastGlowTime = Date.now();
  }

  if (autoGlowing) {
    autoGlowProgress += 0.01; // tweak this for faster/slower auto-glow
    autoGlowProgress = Math.min(autoGlowProgress, 1);
  }

  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  drawAnimatedSentences();
  updateInterventionLoadingBar(glowProgressSum, glowableCount);
}


//this Interv New
let autoCompleteStarted = false;

function updateInterventionLoadingBar(totalGlow, letterCount) {
  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');
  overlay.style.display = 'block';

  // 🔁 Primary glow-based progress
  let progressTarget = Math.min((totalGlow / letterCount) * 100, 100);

  // ✅ Start auto-complete mode after 60%
  if (!autoCompleteStarted && interventionProgressVisual >= 70) {
    autoCompleteStarted = true;
  }

  // ✅ Smooth auto-completion to 100%
  if (autoCompleteStarted) {
    progressTarget = 100;
  }

  // 🔁 Ease progress visually
  interventionProgressVisual += (progressTarget - interventionProgressVisual) * 0.05;

  // ✨ Apply to loading bar
  loadingBar.style.width = `${interventionProgressVisual}%`;
  loadingBar.style.background = 'linear-gradient(to right, #c97b49, #e6dace)';

  if (interventionProgressVisual > 99 && !isInExitPrompt) {
    interventionInteractionComplete = true;
    setTimeout(() => {
      showFinalInterventionPrompt();
    }, 1200);
  }
}

//this Interv New
function emitSmoothSentenceTowards(targetX, targetY) {
  const directions = [
    { x: Math.random() * canvas.width, y: -50 },
    { x: Math.random() * canvas.width, y: canvas.height + 50 },
    { x: -50, y: Math.random() * canvas.height },
    { x: canvas.width + 50, y: Math.random() * canvas.height }
  ];
  const start = directions[Math.floor(Math.random() * directions.length)];

  // Use a larger radial offset to keep sentences off the Earth
  const angle = Math.random() * 2 * Math.PI;
  const radius = 150 + Math.random() * 50; // Offset from sphere edge
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  const sentence = {
    text: getRandomPromise(),
    pos: { x: start.x, y: start.y },
    target: {
      x: targetX + offsetX,
      y: targetY + offsetY
    },
    progress: 0,
    arrived: false,
    fadeIn: 0 // new: fade in starts at 0
  };

  interventionSentences.push(sentence);
}


//this Interv New
function drawAnimatedSentences() {
  for (let s of interventionSentences) {
    // Update progress
    if (!s.arrived) {
      s.progress += 0.0012;
      if (s.progress >= 1) {
        s.progress = 1;
        s.arrived = true;
      }
    }

    // Fade-in progress (independent of s.progress)
    if (s.fadeIn < 1) {
      s.fadeIn += 0.03; // tweak speed if needed
      s.fadeIn = Math.min(s.fadeIn, 1);
    }

    const interpX = s.pos.x + (s.target.x - s.pos.x) * easeInOut(s.progress);
    const interpY = s.pos.y + (s.target.y - s.pos.y) * easeInOut(s.progress);

    // Blend color from orange → tint
    let blendFactor = s.progress < 0.7
      ? s.progress / 0.7
      : 1 - Math.pow(1 - s.progress, 2);

    const base = { r: 201, g: 123, b: 73 };
    const tint = { r: 255, g: 230, b: 190 };

    const r = Math.round(base.r + (tint.r - base.r) * blendFactor);
    const g = Math.round(base.g + (tint.g - base.g) * blendFactor);
    const b = Math.round(base.b + (tint.b - base.b) * blendFactor);

    // Final opacity = fade-out * fade-in
    const fadeOut = 1 - Math.pow(s.progress, 1.5);
    const finalOpacity = s.fadeIn * fadeOut;

    ctx.shadowColor = `rgba(${r},${g},${b},${0.3 * finalOpacity})`;
    ctx.shadowBlur = 40 + 40 * finalOpacity;

    ctx.font = '28px Helvetica Neue';
    ctx.fillStyle = `rgba(${r},${g},${b},${finalOpacity})`;
    ctx.fillText(s.text, interpX, interpY);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}


function emitInterventionSentence(x, y) {
  const text = promiseSentences[Math.floor(Math.random()/2 * promiseSentences.length)];
  const angle = Math.random() * 2 * Math.PI;
  const speed = 0.04 + Math.random() * 0.06; // 🔁 much slower now

  interventionSentencesEmitted.push({
    text,
    x,
    y,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    opacity: 1,
    scale:1,
    life: 740 // doubled lifetime for more floaty feel
  });
}

function drawEmittedSentences() {
  ctx.font = '18px Helvetica Neue';
  for (let sentence of interventionSentencesEmitted) {
    sentence.scale += 0.002;

    ctx.save();
    ctx.translate(sentence.x, sentence.y);
    ctx.scale(sentence.scale, sentence.scale);
    ctx.shadowColor = `rgba(201,123,73,${0.2 * sentence.opacity})`;
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(201,123,73,${sentence.opacity})`;
    ctx.fillText(sentence.text, 0, 0); // now drawn from translated origin
    ctx.restore();

    sentence.x += sentence.dx;
    sentence.y += sentence.dy;
    sentence.opacity -= 0.0015;
    sentence.life--;


    if (sentence.opacity < 0 || sentence.life <= 0) {
      sentence.opacity = 0;
    }
  }

  // Remove faded
  interventionSentencesEmitted = interventionSentencesEmitted.filter(s => s.opacity > 0);
}




function createDisruptLetters() {
  disruptBarHidden = false;
  disruptTouchedLetters = new Set();
  disruptDisplayedProgress = 0;
  disruptTransitionStarted = false;
  disruptLetters = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 220;

  for (let i = 0; i < 300; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = radius * Math.sqrt(Math.random());
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    const char = disruptAlphabet[Math.floor(Math.random() * disruptAlphabet.length)];

    disruptLetters.push({
      text: char,
      baseX: x,
      baseY: y,
      x: x,
      y: y,
      jitter: Math.random() * 1.5 + 0.5,
      glow: 0,
      opacity: 1,
      isScattered: false,
      scatterVX: 0,
      scatterVY: 0,
      fadeProgress: 0
    });
  }
}

//OLD 
//To create disrupt worded earth
function createDisruptLettersOld() {
  disruptLetters = [];
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;
  let radius = 220;

  const disruptWords = [
    "Glitch", "Growl", "Hotter", "Faster", "Louder",
    "Thickens", "Blur", "Slip", "Unnoticed", "Crack", "Ripple",
    "Buzz", "Distort", "Static", "Pressure", "Pulse", "Chaos", "Skew"
  ];

  for (let i = 0; i < 300; i++) {
    let angle = Math.random() * 2 * Math.PI;
    let r = radius * Math.sqrt(Math.random());
    let x = centerX + r * Math.cos(angle);
    let y = centerY + r * Math.sin(angle);

    let word = disruptWords[Math.floor(Math.random() * disruptWords.length)];

    disruptLetters.push({
      text: char,
      baseX: x,
      baseY: y,
      x: x,
      y: y,
      jitter: Math.random() * 1.5 + 0.5,
      glow: Math.random() * 0.5 + 0.4,
      opacity: Math.random() * 0.3 + 0.6,
      lifted: false,
      liftY: 0,
      glowIntensity: 0,
      glowTriggered: false,
      glowTimer: 0
    });
  }
}

function createLetters() {
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;
  let radius = 200; // Radius of the "Earth" made of letters

  for (let i = 0; i < 300; i++) {
    let angle = Math.random() * 2 * Math.PI;
    let r = radius * Math.sqrt(Math.random());
    let x = centerX + r * Math.cos(angle);
    let y = centerY + r * Math.sin(angle);
    let char = alphabet[Math.floor(Math.random() * alphabet.length)];
    //letters.push({ text: char, x: x, y: y, scatterX: 0, scatterY: 0, scattered: false, alpha: 1 });
    letters.push({ text: char, x: x, y: y, offsetY: 0 });
  }
}

// function createInterventionLetters() {
//   interventionLetters = [];
//   interventionEarthAssembled = false;
//   const centerX = canvas.width / 2;
//   const centerY = canvas.height / 2;
//   const radius = 220;

//   const promises = [
//     { text: "Speak up for cleaner air", size: 22, weight: "bold", angle: -Math.PI / 6, distance: 100 },
//     { text: "Refuse single-use plastic", size: 18, weight: "light", angle: -Math.PI / 4, distance: 140 },
//     { text: "Reduce energy at home", size: 20, weight: "normal", angle: 0, distance: 130 },
//     { text: "Choose local produce", size: 18, weight: "light", angle: Math.PI / 3, distance: 100 },
//     { text: "Walk or cycle more", size: 16, weight: "light", angle: Math.PI / 6, distance: 150 },
//     { text: "Plant trees in your community", size: 20, weight: "bold", angle: -Math.PI / 2.2, distance: 160 },
//     { text: "Support clean energy", size: 18, weight: "normal", angle: Math.PI / 1.8, distance: 120 },
//     { text: "Speak for the silent skies", size: 20, weight: "normal", angle: -Math.PI / 1.5, distance: 130 }
//   ];

//   for (let promise of promises) {
//     const angle = promise.angle;
//     const x = centerX + promise.distance * Math.cos(angle);
//     const y = centerY + promise.distance * Math.sin(angle);

//     interventionLetters.push({
//       ...promise,
//       x: x,
//       y: y,
//       opacity: 0.1,
//       arrived: false,
//       vx: (centerX - x) / 80,
//       vy: (centerY - y) / 80,
//       currentX: x,
//       currentY: y
//     });
//   }
// }

// function drawInterventionLetters() {
//   const centerX = canvas.width / 2;
//   const centerY = canvas.height / 2;

//   for (let letter of interventionLetters) {
//       if (!letter.arrived) {
//         const dx = centerX - letter.currentX;
//         const dy = centerY - letter.currentY;
//         const dist = Math.sqrt(dx * dx + dy * dy);

//         if (dist < 2) {
//           letter.arrived = true;
//         } else {
//           letter.currentX += letter.vx;
//           letter.currentY += letter.vy;
//         }

//         // 👇 Add this to update the actual draw position
//         letter.x = letter.currentX;
//         letter.y = letter.currentY;
//       } else {
//         letter.opacity = 1;
//       }

//       ctx.font = `${letter.size}px 'Helvetica Neue', Helvetica, sans-serif`;
//       ctx.fillStyle = `rgba(201, 123, 73, 1)`; // Primary color
//       ctx.shadowColor = `rgba(201, 123, 73, 0.2)`;
//       ctx.shadowBlur = 8;
//       ctx.fillText(letter.text, letter.x, letter.y);
//     }

//   ctx.shadowColor = 'transparent';
//   ctx.shadowBlur = 0;
// }

// function drawInterventionScene() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   ctx.font = '20px Gibson, sans-serif';

//   let touchedCount = 0;

//   for (let letter of interventionBackgroundLetters) {
//     ctx.font = `14px Helvetica`;
//     ctx.fillStyle = `rgba(255, 255, 255, 0.08)`;
//     ctx.shadowColor = 'transparent';
//     ctx.shadowBlur = 0;
//     ctx.fillText(letter.text, letter.x, letter.y);
//   }

//   for (let letter of interventionLetters) {
//     const dx = indexTipX - letter.x;
//     const dy = indexTipY - letter.y;
//     const distToFinger = Math.sqrt(dx * dx + dy * dy);

//     if (distToFinger < 70 && !letter.moved) {
//       letter.moved = true;
//       interventionTouched.add(letter);
//     }

//     if (letter.moved) {
//       // Animate toward target position
//       letter.x += (letter.targetX - letter.x) * 0.05;
//       letter.y += (letter.targetY - letter.y) * 0.05;
//       letter.glow += (1 - letter.glow) * 0.1;
//       touchedCount++;
//     } else {
//       letter.glow += (0 - letter.glow) * 0.1;
//     }

//     ctx.shadowColor = `rgba(201,123,73,${0.4 * letter.glow})`;
//     ctx.shadowBlur = 12 * letter.glow;
//     ctx.font = `${letter.size}px ${letter.font}`;
//     ctx.fillStyle = `rgba(201,123,73,${Math.max(0.3, letter.opacity)})`;
//     ctx.fillText(letter.text, letter.x, letter.y);
//   }

//   if (touchedCount / interventionLetters.length > 0.6 && !interventionSphereComplete) {
//     interventionSphereComplete = true;
//     setTimeout(() => {
//       showFinalInterventionPrompt(); // 👇 this triggers "You gathered them..." message
//     }, 1200);
//   }
// }

function showFinalInterventionPrompt() {
  isInExitPrompt = true;
    // ✨ Fade out the canvas
  canvas.style.transition = 'opacity 2s ease';
  canvas.style.opacity = 0;

  setTimeout(() => {
    canvas.style.display = 'none';
    canvas.style.opacity = 1; // reset for next time
    const overlay = document.getElementById('progressOverlay');
    overlay.style.display = 'none';
    canvas.style.display = 'block';
    glowingPoints.clear();
    interventionSentences = [];
    autoCompleteStarted = false;
    interventionProgressVisual = 0;
  }, 1000); // matches canvas fade-out duration

  const prompt = document.getElementById('exitPrompt');
  const poeticLines = document.querySelector('#exitPrompt #poeticLines');
  const handHint = document.getElementById('exitHandHint');
  const hintText = document.getElementById('exitHintText');
  const exitPromptContainer = document.getElementById('exitHintContainer');

  poeticLines.innerHTML = `
    <p class="line1">You brought them to light.</p>
    <p class="line2">Can you keep them glowing?</p>
  `;
  prompt.style.display = 'flex';
  poeticLines.style.display = 'block';
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.6)';

  exitPromptContainer.style.display = 'flex';
  exitPromptContainer.style.opacity = 1;

  handHint.style.display = 'flex';
  handHint.style.opacity = 1;
  hintText.innerHTML = "Hold your palm to continue";
  hintText.style.display = 'block';
  hintText.style.opacity = 1;

  // Animate poetic lines in
  setTimeout(() => {
    poeticLines.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    poeticLines.style.opacity = 1;
    poeticLines.style.transform = 'scale(1)';
  }, 200);

  isInExitPrompt = true;
  requestAnimationFrame(detectHands);

  // Trigger gesture detection after poetic lines
    setTimeout(() => {
    let palmReady = false;

    function delayedPalmMonitor() {
      if (!palmReady && isPalmDetected(handLandmarks)) {
        palmReady = true;
        monitorExitPalm(() => {
          fadePoeticPrompt(() => {
            playReflectionVideo();
          });
        });
      } else {
        requestAnimationFrame(delayedPalmMonitor);
      }
    }

    requestAnimationFrame(delayedPalmMonitor);
  }, 3200); // wait until text + hint appear
}


function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3); // Cubic easing
}

function createControlLetters() {
  controlLetters = [];
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;
  let radius = 200;



  //number of letters drawn
  for (let i = 0; i < 400; i++) {
    let angle = Math.random() * 2 * Math.PI;
    let r = radius * Math.sqrt(Math.random());
    let x = centerX + r * Math.cos(angle);
    let y = centerY + r * Math.sin(angle);

    let char = alphabet[Math.floor(Math.random() * alphabet.length)];

    // Add green letters more densely in "continent" areas
    let dx = (x - centerX) / radius;
    let dy = (y - centerY) / radius;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let greenZone = (dx > -0.3 && dx < 0.3 && dy > -0.4 && dy < 0.2);

    let color = (greenZone || Math.random() < 0.00) ? '#7B8C7E' : '#7B8C7E'; // faded green or white

    let initialDim = (color === '#7B8C7E') ? 0.2 : 0.1;

    controlLetters.push({
      text: char,
      x, y,
      baseX: x,
      baseY: y,
      offsetY: 0,
      color: color,
      currentPull: 1,
      glow: 0,
      dimOpacity: initialDim // initial dim level
    });
  }
}

// function createControlLetters() {
//   controlLetters = [];
//   let centerX = canvas.width / 2;
//   let centerY = canvas.height / 2;
//   let radius = 200;

//   for (let i = 0; i < 300; i++) {
//     let angle = Math.random() * 2 * Math.PI;
//     let r = radius * Math.sqrt(Math.random());
//     let x = centerX + r * Math.cos(angle);
//     let y = centerY + r * Math.sin(angle);
//     let char = alphabet[Math.floor(Math.random() * alphabet.length)];
//     controlLetters.push({ 
//       text: char,
//       x: x,
//       y: y,
//       baseX: x,
//       baseY: y,
//       offsetY: 0,
//       hovering: false
//     });
//   }
// }

//Not creating words
function createWords() {
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;
  let radius = 150;
  let labels = ["Glitch", "Growl", "Faster", "Hotter", "Louder", "Thickens", "Blur", "Slip", "Unnoticed"];

  for (let i = 0; i < labels.length; i++) {
    let angle = (i / labels.length) * 2 * Math.PI;
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
    words.push({ text: labels[i], x: x, y: y, scatterX: 0, scatterY: 0, scattered: false, alpha: 1 });
  }
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

async function startInteraction() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(detectHands);
}



async function detectHands() {

  //home screen logic start
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (onHomeScreen) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (webcam.readyState === 4) {
    const predictions = await model.estimateHands(webcam);

    const hint = document.getElementById('handHintHome');
    const hintText = document.getElementById('hintTextHome');
    let setHintText = (text) => {
        hintText.classList.add('fade-out');
        setTimeout(() => {
          hintText.innerHTML = text;
          hintText.classList.remove('fade-out');
        }, 250);
    };

    if (predictions.length > 0 && isPalmDetected(predictions[0].landmarks)) {
      drawHand(predictions[0].landmarks); // optional hand rendering

      // ✅ Keep palm glow ON
      // const hint = document.getElementById('palmHintVisualHome');

      const hint = document.getElementById('handHintHome');
      const hintText = document.getElementById('hintTextHome');

      hint.classList.add('glow');

      if (hintText.innerHTML !== "Let your palm guide the beginning") {
        setHintText("Let your palm guide the beginning");
      }

      if (homeResetTimer) {
        clearTimeout(homeResetTimer);
        homeResetTimer = null;
      }

      document.querySelectorAll('.tiltedLine').forEach(el => {
        el.style.transform = 'rotate(0deg)';
        el.style.transition = 'opacity 2.5s ease, transform 0.8s ease';
        el.style.opacity = 1;
      });

      palmHoldFrames++;
    } else {
      
      const hint = document.getElementById('handHintHome');
      const hintText = document.getElementById('hintTextHome');

      hint.classList.remove('glow');

      if (hintText.innerHTML !== "Lift your palm to begin") {
          setHintText("Lift your palm to begin");
      }

      if (!homeResetTimer) {
          homeResetTimer = setTimeout(() => {
            resetHomeScreen();
            homeResetTimer = null;
          }, 2500); // 2.5 sec delay before reset
        }

      document.querySelectorAll('.tiltedLine')[0].style.transform = 'rotate(-2deg)';
      document.querySelectorAll('.tiltedLine')[1].style.transform = 'rotate(0deg)';
      document.querySelectorAll('.tiltedLine')[2].style.transform = 'rotate(2deg)';
      document.querySelectorAll('.tiltedLine').forEach(el => {
        el.style.transition = 'opacity 2.5s ease, transform 0.8s ease';
        el.style.opacity = 0.35;
      });

      if (palmHoldFrames > 0) palmHoldFrames--;
    }

    // ✅ After enough palm hold, animate logo and show play
    if (palmHoldFrames > 60 && !showPlayIcon) {
      showPlayIcon = true;
      const logo = document.getElementById('logoContainer');
      logo.style.transition = 'transform 1.3s ease';
      logo.style.transform = 'translateY(-110px) scale(0.38)';

      const play = document.getElementById('playIconHome');
      play.style.display = 'block';
      play.style.opacity = 0;
      play.style.transform = 'scale(0.8)';

      const bgc = document.getElementById('promptBg1');
      activeBg = null;

      // // Show and breathe background image
        bgc.classList.remove('shrinkAndBrighten');
        bgc.classList.add('dynamic');
        bgc.style.opacity = 0; // to be zero?
        activeBg = bgc;
      

        if (activeBg) {
          activeBg.classList.remove('shrinkAndBrighten');
          activeBg.classList.add('dynamic');
          activeBg.style.opacity = '0'; //to be zero?
          activeBg.style.transform = 'scale(1) rotate(0deg)';
        }

      setTimeout(() => {
        play.style.opacity = 1;
        play.style.transform = 'scale(1)';
        play.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        // Start play icon hover check
        // monitorHomePlayIconHover();
        monitorHomePlayIconHover(() => {
          if (activeBg) {
            if (!activeBg) {
              console.warn('activeBg is not defined. Background sync animation will not run.');
            }
            // activeBg.classList.remove('breathe');
            activeBg.classList.add('shrinkAndBrighten');
            setTimeout(() => {
              activeBg.classList.remove('shrinkAndBrighten');
              activeBg.style.opacity = 0;
              callback();
            }, 2000); // Wait for fadeout to complete before video
          } else {
            callback();
          }
        });
      }, 500);
    }
  }

  requestAnimationFrame(detectHands);
  return;
}

  //home screen logic end

  // if (interactionDisabled) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent fill
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (webcam.readyState === 4) {
    const predictions = await model.estimateHands(webcam);
    drawHand(predictions.length > 0 ? predictions[0].landmarks : []);


    if (!hasPromptFaded) {
      // Just show hand glow and check if it should fade prompt
      updatePromptStateBasedOnHand(predictions);
    } 
    else {  
      // 🔥 Prompt has faded — now start the interactive drawing
      if (currentScene === 'control') {
        if (controlInteractionType === 'breathe') {
          drawBreathingEarth();
        } else if (controlInteractionType === 'levitate') {
          drawLevitationLight();
        } else {
          drawControlSphere();
        }
      } else if (currentScene === 'disrupt') {
        drawDisruptSphere();
      } else if (currentScene === 'loss') {
        drawLossSphere();
      } else if (currentScene === 'intervention') {
        drawNewInterventionScene();
      } else if (currentScene === 'reflection-prompt' && !selectedPromise) {
        monitorHandForPromiseHover(predictions);
      } else if (isDrawingPhase && currentScene === 'reflection-prompt') {
        drawReflectionFrame(predictions); // predictions for drawing logic
      } else if (isDrawingPhaseDone && currentScene === 'reflection-prompt') {
        if (!isFinalEarthReady) {
          drawStaticEarthLetters();
          // Clone letters after they're drawn
          finalEarthLetters = drawnLetters.map(letter => ({
            text: letter.letter,
            baseX: letter.x,
            baseY: letter.y,
            currentPull: 1,
            glow: 0,
            dimOpacity: 0.3
          }));

          isFinalEarthReady = true;
        }
      } if (!isDrawingPhase) {
          if (isFinalEarthReady && isFinalInteractionPhase){
            console.log("always inside final interaction screen");
             // const landmarks = predictions[0].landmarks;
              // Optional: check wrist and base joints to ensure it's not just a fingertip

             if (!reflectionLoadingInitialized) {
                console.log('🔄 Reflection loading bar initialized');
                loadingProgress = 0;
                displayedLoadingProgress = 0;
                interactionHoldFrames = 0;
                reflectionLoadingInitialized = true;              
              }
             if (predictions.length > 0) {
                finalBreathingStarted = true;
                shouldShowGlowingFinger = false;
             }
             if (finalBreathingStarted) {
                drawReflectionBreathingEarth();
             }
         }
            // Start interaction
            // startFinalBreathingInteraction();
      } 
      drawHand(predictions.length > 0 ? predictions[0].landmarks : []);
    }
  }
  // const predictions = await model.estimateHands(webcam);
  // console.log("Hand predictions:", predictions);
  requestAnimationFrame(detectHands);
}

let words = [
  { text: "glitch", x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 },
  { text: "growl", x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 },
  { text: "hotter", x: window.innerWidth / 2 + 150, y: window.innerHeight / 2 }
];

let lastX = 0;
let lastY = 0;
let stillCounter = 0;

function drawHand(landmarks) {

  handLandmarks = landmarks;
  // console.log("Hand landmarks:", handLandmarks.length);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);


  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, canvas.width, canvas.height);



  // 1️⃣ Draw webcam video as background
  // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 1️⃣ Flip video horizontally

  // ctx.save(); // Save the current state
  // ctx.scale(-1, 1); // Flip horizontally

  // ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore(); // Restore to normal

  // 2️⃣ Draw hand landmarks (blurred dots)
  ctx.fillStyle = `rgba(255, 255, 255, ${handOpacity})`; // Soft white with very low opacity
  ctx.shadowColor = 'white';
  ctx.shadowBlur = 20; // Blur glow
  for (let i = 0; i < landmarks.length; i++) {
    let [videoX, videoY, z] = landmarks[i];
    
    // 📐 Scale coordinates relative to canvas
    let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
    let y = videoY * canvas.height / webcam.videoHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  if (!hasPromptFaded && !isInExitPrompt && currentScene !== 'loss') return;

  if (isInExitPrompt) {
    ctx.fillStyle = `rgba(255, 255, 255, ${handOpacity})`;
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 20;
    for (let i = 0; i < landmarks.length; i++) {
      let [videoX, videoY] = landmarks[i];
      let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
      let y = videoY * canvas.height / webcam.videoHeight;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }

// Capture Palm position using hand landmarks for interaction
  let palmPoints = [landmarks[0], landmarks[1], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  let sumX = 0, sumY = 0;
  let validPoints = 0;

  for (let pt of palmPoints) {
    if (pt && pt.length >= 2) {
      let [videoX, videoY] = pt;
      let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
      let y = videoY * canvas.height / webcam.videoHeight;
      sumX += x;
      sumY += y;
      validPoints++;
    }
  }

  if (validPoints > 0) {
    palmX = sumX / validPoints;
    palmY = sumY / validPoints;
  }

  // palmX = sumX / palmPoints.length;
  // palmY = sumY / palmPoints.length;


  // 3️⃣ Capture index finger tip for interaction
  if (landmarks[8] && landmarks[8].length >= 2) {
    let indexTip = landmarks[8];
    indexTipX = canvas.width - (indexTip[0] * canvas.width / webcam.videoWidth);
    indexTipY = indexTip[1] * canvas.height / webcam.videoHeight;
  } else {
    indexTipX = -1000; // move it off-screen so it doesn't affect interactions
    indexTipY = -1000;
  }

    if (currentScene === 'loss') {
      handOpacity = 0.25;
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 25;
    }

  let moveThreshold = 10; // How much movement is "big enough" to count

  if (Math.abs(indexTipX - lastX) < moveThreshold && Math.abs(indexTipY - lastY) < moveThreshold) {
    stillCounter++;
  } else {
    stillCounter = 0;
  }

    if (currentScene === 'control' || currentScene === 'loss') {
      handOpacity = 0.2; // always fully visible
    } else {
      // fade logic for other scenes
      if (stillCounter > 10) {
        handOpacity = Math.max(0.05, handOpacity - 0.001);
      } else {
        handOpacity = Math.min(0.2, handOpacity + 0.01);
      }
    }


  lastX = indexTipX;
  lastY = indexTipY;

  if (currentScene === 'disrupt') {
    drawDisruptSphere();
  } else if (currentScene === 'control') {
    
    // Progressively increase fade and scale
    sphereFadeIn += (1 - sphereFadeIn) * 0.05; // faster fade
    sphereScaleProgress += (1-sphereScaleProgress) * 0.05;
    sphereFadeIn = Math.min(sphereFadeIn, 1);       // fade in
    sphereScaleProgress = Math.min(sphereScaleProgress, 1);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.globalAlpha = sphereFadeIn;

    if (controlInteractionType === 'breathe') {
      drawBreathingEarth();
    } else if (controlInteractionType === 'levitate') {
      drawLevitationLight();
    } else {
      drawControlSphere();
    }
  }

  if (isInExitPrompt) {
  // Force drawing hand even if prompt isn't active
    for (let i = 0; i < landmarks.length; i++) {
      let [videoX, videoY] = landmarks[i];
      let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
      let y = videoY * canvas.height / webcam.videoHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  
}

function drawLetters() {
  ctx.fillStyle = 'white';
  ctx.font = '18px Gibson';
  
  for (let letter of letters) {
    if (!letter.scattered) {
      let d = Math.sqrt((indexTipX - letter.x)**2 + (indexTipY - letter.y)**2);
      if (d < 100) { // if finger close
        letter.scatterX = (Math.random() - 0.5) * 2; // gentle drift
        letter.scatterY = (Math.random() - 0.5) * 2;
        letter.scattered = true;
      }
    }

    if (letter.scattered) {
      letter.x += letter.scatterX;
      letter.y += letter.scatterY;
      letter.alpha -= 0.002;
      letter.alpha = Math.max(letter.alpha, 0);
    }

    ctx.globalAlpha = letter.alpha;
    ctx.fillText(letter.text, letter.x, letter.y);
    ctx.globalAlpha = 1.0;
  }
}

function drawControlLetters() {
  ctx.fillStyle = 'white';
  ctx.font = '18px Helvetica';

  ctx.beginPath();
  ctx.arc(centerX, centerY, 220 * smoothedBreath, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';  // soft dark backdrop
  ctx.fill();

  for (let letter of controlLetters) {
    let d = Math.sqrt((indexTipX - letter.x) ** 2 + (indexTipY - letter.y) ** 2);

    if (d < 100) {
      letter.hovering = true;
    } else {
      letter.hovering = false;
    }

    // Smoothly move up if hovered, else back to base
    if (letter.hovering) {
      letter.offsetY = Math.max(letter.offsetY - 1, -10);
    } else {
      letter.offsetY = Math.min(letter.offsetY + 1, 0);
    }

    ctx.fillText(letter.text, letter.baseX, letter.baseY + letter.offsetY);
  }
}

function drawWords() {
  ctx.fillStyle = 'white';
  ctx.font = '24px Helvetica';

  for (let word of words) {
    if (!word.scattered) {
      let d = Math.sqrt((indexTipX - word.x)**2 + (indexTipY - word.y)**2);
      if (d < 100) {
        word.scatterX = (Math.random() - 0.5) * 10;
        word.scatterY = (Math.random() - 0.5) * 10;
        word.scattered = true;
      }
    }
    
    if (word.scattered) {
      word.x += word.scatterX;
      word.y += word.scatterY;
      word.alpha -= 0.01;
      word.alpha = Math.max(word.alpha, 0);
    }

    ctx.globalAlpha = word.alpha;
    ctx.fillText(word.text, word.x, word.y);
    ctx.globalAlpha = 1.0;
  }
}


function drawScene() {

  ctx.fillStyle = 'white';
  ctx.font = '24px Helvetica';
  
  words.forEach(word => {
    if (typeof indexTipX === 'undefined' || typeof indexTipY === 'undefined') {
      return;
    }
    // Simple distance check
    let d = Math.sqrt((indexTipX - word.x)**2 + (indexTipY - word.y)**2);

    if (d < 50) { 
      // If finger near word, disrupt it!
      ctx.fillStyle = 'red';
      ctx.font = '28px Helvetica italic';
      ctx.fillText(word.text, word.x + random(-5, 5), word.y + random(-5, 5));
    } else {
      // Normal word
      ctx.fillStyle = 'white';
      ctx.font = '24px Helvetica';
      ctx.fillText(word.text, word.x, word.y);
    }
  });
  ctx.restore();

}

function drawDisruptSphere() {
  ctx.save();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (!disruptSphereStartAnimating) return;

  disruptSphereFadeIn += (1 - disruptSphereFadeIn) * 0.0125;
  disruptSphereScaleProgress += (1 - disruptSphereScaleProgress) * 0.007;

  disruptSphereFadeIn = Math.min(disruptSphereFadeIn, 1);
  disruptSphereScaleProgress = Math.min(disruptSphereScaleProgress, 1);

  let fadeAlpha = 1;
    if (earthFadeOut) {
      earthFadeAlpha -= 0.015;
      earthFadeAlpha = Math.max(0.05, earthFadeAlpha);
      fadeAlpha = earthFadeAlpha;
    }


  ctx.globalAlpha = disruptSphereFadeIn * fadeAlpha;
  ctx.globalAlpha = 1;

  ctx.translate(centerX, centerY);
  ctx.scale(disruptSphereScaleProgress, disruptSphereScaleProgress);
  ctx.translate(-centerX, -centerY);

  const time = Date.now() / 150;
  const t = Date.now() / 1000;
  const breathScale = 1 + 0.015 * Math.sin(t * 2); // subtle breathing

  ctx.translate(centerX, centerY);
  ctx.scale(breathScale, breathScale);
  ctx.translate(-centerX, -centerY);

  ctx.font = '18px Gibson';

  for (let letter of disruptLetters) {
    let touched = false;

    if (handLandmarks && handLandmarks.length > 0 && !letter.lifted) {
      for (let idx = 0; idx < handLandmarks.length; idx++) {
        const [videoX, videoY] = handLandmarks[idx];
        const x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
        const y = videoY * canvas.height / webcam.videoHeight;
        const distToPalm = Math.sqrt((x - letter.baseX) ** 2 + (y - letter.baseY) ** 2);
        if (distToPalm < 40) {
          touched = true;
          break;
        }
      }

      if (touched && !letter.lifted) {
        letter.lifted = true;
        disruptTouchedLetters.add(letter); // Track touched letter
        letter.glowPhase = 'blue';
        letter.glowTimer = 0;

        letter.scattered = true;
        letter.scatterStart = Date.now();
        letter.scatterDuration = 3000 + Math.random() * 800;
        letter.scatterX = (Math.random() - 0.5) * 20;
        letter.targetY = 50 + Math.random() * 80;
        letter.keepFloating = Math.random() < 0.4;
      }
    }

    if (letter.glowPhase === 'blue') {
      letter.glowTimer++;
      if (letter.glowTimer >= 15) {
        letter.glowPhase = 'beige';
        letter.glowTimer = 0; // reset timer for beige
      }
    } else if (letter.glowPhase === 'beige') {
      letter.glowTimer++;
      if (letter.glowTimer >= 20) {
        letter.glowPhase = 'fade';
      }
    }

    let drawX = letter.baseX;
    let drawY = letter.baseY;

    if (letter.scattered) {
      const elapsed = Date.now() - letter.scatterStart;
      const t = Math.min(elapsed / letter.scatterDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      drawX += letter.scatterX;
      drawY = letter.baseY - ease * (letter.baseY - letter.targetY);

      // Color logic based on glowPhase
      let fillColor = '';
      if (letter.glowPhase === 'blue') {
        ctx.shadowColor = `rgba(24, 45, 64, 1)`;
        ctx.shadowBlur = 20;
        fillColor = `rgba(24, 45, 64, 1)`;
      } else if (letter.glowPhase === 'beige') {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        fillColor = `rgba(217, 182, 139, 1)`;
      } else if (letter.glowPhase === 'fade') {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        const fadeRatio = Math.min(1, (t - 0.3) / 0.7);
        const grey = 59;
        const alpha = letter.keepFloating ? 0.5 : (1 - fadeRatio * 0.9);
        fillColor = `rgba(${grey}, ${grey}, ${grey}, ${alpha})`;

        if (t >= 1 && letter.keepFloating) {
          letter.baseY -= 0.15;
          letter.baseX += Math.sin(time + letter.baseX) * 0.3;
        }
      } else {
        fillColor = `rgba(217, 182, 139, 1)`; // fallback
      }

      if (!letter.keepFloating && t >= 1) continue;

      ctx.fillStyle = fillColor;
      ctx.fillText(letter.text, drawX, drawY);
    } else {
      // Idle state
      const offsetX = Math.sin(time + letter.baseX * 0.01) * letter.jitter * 3;
      const offsetY = Math.cos(time + letter.baseY * 0.01) * letter.jitter * 3;
      drawX += offsetX;
      drawY += offsetY;

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(217, 182, 139, 1)`;
      ctx.fillText(letter.text, drawX, drawY);
    }
  }

  
  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  updateDisruptLoadingBar();
}

function updateDisruptLoadingBar() {
  const total = disruptLetters.length;
  const current = disruptTouchedLetters.size;
  const percentage = (current / total) * 100;

  // Prevent updating if bar is already hidden
  if (disruptBarHidden) return;

  disruptDisplayedProgress += (percentage - disruptDisplayedProgress) * 0.08;
  // console.log('Progress:', disruptDisplayedProgress);

  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');

  // Show and style the disrupt bar
  overlay.style.display = 'block';
  loadingBar.style.background = 'linear-gradient(to right, #d9b68b, #d9b68b)';
  loadingBar.style.boxShadow = '0 0 8px rgba(217, 182, 139, 0.4)';
  loadingBar.style.width = `${disruptDisplayedProgress}%`;

  if (disruptDisplayedProgress > 99 && !disruptTransitionStarted) {
    disruptTransitionStarted = true;
    loadingBar.classList.add('fade-out-bar');

    setTimeout(() => {
      // ✅ Hide and reset the bar
      document.getElementById('progressOverlay').style.display = 'none';
      loadingBar.classList.remove('fade-out-bar');
      loadingBar.style.width = '0%';
      disruptBarHidden = true; // ✅ Mark as permanently hidden

      interactionDisabled = true;
      earthFadeOut = true;

      setTimeout(() => {
        showPoeticTransitionMessage('loss');
      }, 1600);
    }, 1200);
  }
}


function drawControlSphere() {
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 210, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = '18px Helvetica';

  for (let letter of controlLetters) {
    let d = Math.sqrt((indexTipX - letter.baseX)**2 + (indexTipY - letter.baseY)**2);

    // Target offset based on proximity
    let targetOffset = d < 100 ? -10 : 0;

    // Smooth easing towards target offset
    letter.offsetY += (targetOffset - letter.offsetY) * 0.1;

    // Optional: subtle glow effect based on proximity
    if (d < 100) {
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.fillText(letter.text, letter.baseX, letter.baseY + letter.offsetY);
  }

  ctx.shadowColor = 'transparent'; // Reset shadow
  ctx.shadowBlur = 0;
}




function drawBreathingEarth() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Earth fade-out logic
  if (earthFadeOut) {
    earthFadeAlpha -= 0.015;
    if (earthFadeAlpha < 0) earthFadeAlpha = 0;
    ctx.globalAlpha = earthFadeAlpha;
  } else {
    earthFadeAlpha = 1.0;
    ctx.globalAlpha = 1.0;
  }

  const breathCycleMs = 6000;
  const t = (Date.now() % breathCycleMs) / breathCycleMs;
  const rawBreath = 1 + 0.02 * Math.sin(t * 2 * Math.PI);
  smoothedBreath += (rawBreath - smoothedBreath) * 0.02;

  if (breathingStartTime !== null && Date.now() >= breathingStartTime) {
    let elapsed = Date.now() - breathingStartTime;
    breathingFadeProgress = Math.min(1, elapsed / 800);
  }

  let fadeOpacity = breathingFadeProgress;
  let scale = 0.7 + 0.3 * breathingFadeProgress;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);

  ctx.beginPath();
  // ctx.arc(centerX, centerY, 100 * smoothedBreath, 0, 2 * Math.PI);
  ctx.fillStyle = 'transparent';
  ctx.fill();

  ctx.font = '20px Gibson, sans-serif';

  let anyLetterIsInteracting = false;

  for (let letter of controlLetters) {
    let dx = letter.baseX - centerX;
    let dy = letter.baseY - centerY;

    let distToFinger = Infinity;
    if (handLandmarks && handLandmarks.length > 0) {
      let pointsToCheck = [0, 4, 8, 12, 16, 20];
      for (let idx of pointsToCheck) {
        let [videoX, videoY] = handLandmarks[idx];
        let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
        let y = videoY * canvas.height / webcam.videoHeight;
        let d = Math.sqrt((x - letter.baseX) ** 2 + (y - letter.baseY) ** 2);
        if (d < distToFinger) distToFinger = d;
      }
    }

    const interactionThreshold = 70;
    const isLetterInteracting = distToFinger < interactionThreshold;
    if (isLetterInteracting) anyLetterIsInteracting = true;

    let targetPull = isLetterInteracting ? 1 - Math.min(distToFinger / interactionThreshold, 1) * 0.5 : 1;
    letter.currentPull = letter.currentPull || 1;
    letter.currentPull += (targetPull - letter.currentPull) * 0.04;

    const finalX = centerX + dx * smoothedBreath * letter.currentPull;
    const finalY = centerY + dy * smoothedBreath * letter.currentPull;

    const targetGlow = Math.max(0, Math.min(1, (1.0 - letter.currentPull) / 0.3));
    letter.glow = letter.glow || 0;
    letter.glow += (targetGlow - letter.glow) * 0.35;

    if (isLetterInteracting) {
      ctx.shadowColor = `rgba(123,140,126,${0.5 * letter.glow})`; // green glow
      ctx.shadowBlur = 20 * letter.glow;
      ctx.fillStyle = `rgba(123,140,126,${(0.25 + 0.65 * letter.glow) * fadeOpacity})`;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Target dim value
      let targetDim = anyLetterIsInteracting ? 0.20 : 0.30;
      letter.dimOpacity += (targetDim - letter.dimOpacity) * 0.07;

      // Use the letter’s actual assigned color (green or white)
      if (letter.color === 'white') {
        ctx.fillStyle = `rgba(255,255,255,${letter.dimOpacity * fadeOpacity})`;
      } else {
        ctx.fillStyle = `rgba(123,140,126,${letter.dimOpacity * fadeOpacity})`;
      } // dim white when idle
    }

    ctx.fillText(letter.text, finalX, finalY);
  }

  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  updateLoadingBar(anyLetterIsInteracting);
}



// function drawBreathingEarth() {
//   const centerX = canvas.width / 2;
//   const centerY = canvas.height / 2;

//     // Fade-out logic
//     if (earthFadeOut) {
//       earthFadeAlpha -= 0.015; // Fade speed
//       if (earthFadeAlpha < 0) earthFadeAlpha = 0;
//       ctx.globalAlpha = earthFadeAlpha;
//     } else {
//       earthFadeAlpha = 1.0;
//       ctx.globalAlpha = 1.0;
//     }

//   const breathCycleMs = 6000;
//   const t = (Date.now() % breathCycleMs) / breathCycleMs;
//   const rawBreath = 1 + 0.02 * Math.sin(t * 2 * Math.PI);
//   smoothedBreath += (rawBreath - smoothedBreath) * 0.02;

//   if (breathingStartTime !== null && Date.now() >= breathingStartTime) {
//     let elapsed = Date.now() - breathingStartTime;
//     breathingFadeProgress = Math.min(1, elapsed / 800);
//   }

//   let fadeOpacity = breathingFadeProgress;
//   let scale = 0.7 + 0.3 * breathingFadeProgress;

//   ctx.save();
//   ctx.translate(centerX, centerY);
//   ctx.scale(scale, scale);
//   ctx.translate(-centerX, -centerY);

//   ctx.beginPath();
//   ctx.arc(centerX, centerY, 210 * smoothedBreath, 0, 2 * Math.PI);
//   ctx.fillStyle = 'transparent';
//   ctx.fill();

//   ctx.font = '18px Helvetica';

//   let anyLetterIsInteracting = false; // Used for loading bar

//   for (let letter of controlLetters) {
//     let dx = letter.baseX - centerX;
//     let dy = letter.baseY - centerY;

//     // Per-letter distance to nearest hand point
//     let distToFinger = Infinity;
//     if (handLandmarks && handLandmarks.length > 0) {
//       let pointsToCheck = [0, 4, 8, 12, 16, 20];
//       for (let idx of pointsToCheck) {
//         let [videoX, videoY] = handLandmarks[idx];
//         let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
//         let y = videoY * canvas.height / webcam.videoHeight;
//         let d = Math.sqrt((x - letter.baseX) ** 2 + (y - letter.baseY) ** 2);
//         if (d < distToFinger) distToFinger = d;
//       }
//     }

//     // Pull in letters near hand
//     let interactionThreshold = 120;
//     let isLetterInteracting = distToFinger < interactionThreshold;
//     if (isLetterInteracting) anyLetterIsInteracting = true;

//     let targetPull = isLetterInteracting ? 1 - Math.min(distToFinger / interactionThreshold, 1) * 0.5 : 1;
//     letter.currentPull = letter.currentPull || 1;
//     letter.currentPull += (targetPull - letter.currentPull) * 0.04;

//     let finalX = centerX + dx * smoothedBreath * letter.currentPull;
//     let finalY = centerY + dy * smoothedBreath * letter.currentPull;

//     // Glow
//     let targetGlow = Math.max(0, Math.min(1, (1.0 - letter.currentPull) / 0.3));
//     letter.glow = letter.glow || 0;
//     letter.glow += (targetGlow - letter.glow) * 0.25;

//     ctx.shadowColor = `rgba(255,255,255,${0.3 * letter.glow * fadeOpacity})`;
//     ctx.shadowBlur = 12 * letter.glow * fadeOpacity;
//     ctx.fillStyle = `rgba(255,255,255,${(0.25 + 0.65 * letter.glow) * fadeOpacity})`;

//     ctx.fillText(letter.text, finalX, finalY);
//   }

//   ctx.restore();
//   ctx.shadowColor = 'transparent';
//   ctx.shadowBlur = 0;

//   ctx.globalAlpha = 1.0; // reset

//   updateLoadingBar(anyLetterIsInteracting); // ✅ now works as expected
// }

function createInterventionBackgroundLetters() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 220;

  for (let i = 0; i < 250; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = radius * Math.sqrt(Math.random());
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    let char = alphabet[Math.floor(Math.random() * alphabet.length)];
    interventionBackgroundLetters.push({
      text: char,
      x,
      y,
      currentX: x,
      currentY: y,
      size: 14,
      weight: "light",
      opacity: 0.2,
      arrived: true
    });
  }
}

function updateLoadingBar(isInteracting) {
  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');

  overlay.style.display = 'block';
  console.log("control loading barrrrrrrrrr updatinggggg");

  if (!isTransitioning) {
    if (isInteracting) {
      interactionHoldFrames++;
      if (interactionHoldFrames >= framesToHold) {
        loadingProgress += 0.15;
      }
    } else {
      interactionHoldFrames = 0;
      loadingProgress -= 0.08;
    }

    loadingProgress = Math.max(0, Math.min(100, loadingProgress));

    // Eased visual progress
    let t = loadingProgress / 100;
    let eased = t * t * (3 - 2 * t); // smootherstep easing
    displayedLoadingProgress += (eased * 100 - displayedLoadingProgress) * 0.05;
    // if (currentScene === 'intervention' && displayedLoadingProgress > 65 && !interventionEarthAssembled) {
    //   createInterventionLetters();
    //   createInterventionBackgroundLetters();
    //   interventionEarthAssembled = true;
    // }
    loadingBar.style.width = `${displayedLoadingProgress}%`;

    // Transition after bar fills
    if (loadingProgress >= 98) {
      loadingProgress = 100;
    }

    if (loadingProgress >= 100 && !isTransitioning) {
      isTransitioning = true;
      loadingBar.classList.add('fade-out-bar');

      setTimeout(() => {
        overlay.style.display = 'none';
        loadingBar.classList.remove('fade-out-bar');
        loadingBar.style.width = '0%';

        interactionDisabled = true;

        earthFadeOut = true;
        setTimeout(() => {
          showPoeticTransitionMessage('disrupt');
        }, 1600); // ⏳ give some time for the Earth to fade out

      }, 1200);
    }
  }
}

function showPoeticTransitionMessage(nextScene) {

  const prompt = document.getElementById('exitPrompt');
  const poeticLines = document.querySelector('#exitPrompt #poeticLines');
  const exitHintContainer = document.getElementById('exitHintContainer');
  const hintText = document.getElementById('exitHintText');
  const handHint = document.getElementById('exitHandHint');

  handHint.style.display = 'flex';
  handHint.style.opacity = 1;

  hintText.style.display = 'block';
  hintText.style.opacity = 1; // or 1

  if (nextScene === 'loss') {
  poeticLines.innerHTML = `
    <p class="line1">The silence settles.</p>
    <p class="line2">Reach forward to uncover the absence.</p>
  `;
  } else if (nextScene === 'intervention') {
    poeticLines.innerHTML = `
      <p class="line1">Something remains.</p>
      <p class="line2">Reach forward to intervene.</p>
    `;
  } else if (nextScene === 'reflection') {
    poeticLines.innerHTML = `
      <p class="line1">You’ve changed something.</p>
      <p class="line2">Watch what breathes anew.</p>
    `;
  }

  canvas.style.display = 'block';
  prompt.style.display = 'flex';
  poeticLines.style.display = 'block'; // ✅ ← Ensure it's shown
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.6)';

  // 1. Animate the poetic lines in
  setTimeout(() => {
    poeticLines.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    poeticLines.style.opacity = 1;
    poeticLines.style.transform = 'scale(1)';
  }, 200);

  //  2. Show the palm hint (after a short delay)
  setTimeout(() => {
    if (exitHintContainer) {
    exitHintContainer.classList.add('show');
    }

    isInExitPrompt = true;
    requestAnimationFrame(detectHands);

    // 4. Add conditional path for nextScene
    if (nextScene === 'disrupt') {
      monitorExitPalm(() => {
        fadePoeticPrompt(() => {
          playDisruptVideo();
        });
      });
    } else if (nextScene === 'loss') {
      monitorExitPalm(() => {
        fadePoeticPrompt(() => {
          playLossVideo();
        });
      });
    } else if (nextScene === 'intervention') {
      monitorExitPalm(() => {
        fadePoeticPrompt(() => {
          playInterventionVideo();
        });
      });
    } else if (nextScene === 'reflection') {
      monitorExitPalm(() => {
        fadePoeticPrompt(() => {
          playReflectionVideo();
        });
      });
    }

  }, 3800); // show palm hint shortly after poetic text appears

  // setTimeout(() => {
  //   // Play the video after a few seconds
  //   currentVideo = disruptVideo;
  //   disruptVideo.style.display = 'block';
  //   prompt.style.display = 'none';
  //   canvas.style.display = 'none';
  //   // disruptVideo.play();
  // }, 4200); // You can adjust this delay
}

function monitorExitPalm(callback) {
  const hintText = document.getElementById('exitHintText');
  const handHint = document.getElementById('exitHandHint');

  let palmDetected = false;
  let callbackCalled = false;

  function checkPalm() {
    if (handLandmarks && handLandmarks.length > 0) {
      if (!palmDetected) {
        palmDetected = true;

        // ✅ Update hint text and glow
        hintText.style.opacity = 0;
        setTimeout(() => {
          hintText.innerHTML = "Touch to continue";
          hintText.style.opacity = 1;
        }, 200);
        handHint.classList.add('glow');
      }

      if (!callbackCalled) {
        callbackCalled = true;
        callback();
      }
    } else {
      if (palmDetected) {
        palmDetected = false;

        // 🔁 Reset hint text and glow
        hintText.style.opacity = 0;
        setTimeout(() => {
          hintText.innerHTML = "Lift your palm to continue";
          hintText.style.opacity = 1;
        }, 200);
        handHint.classList.remove('glow');
      }
    }

    requestAnimationFrame(checkPalm); // keep checking continuously
  }

  checkPalm();
}

//palm detector helper function
function isPalmDetected(handLandmarks) {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  // Check if palm base and all finger tips exist
  const requiredIndices = [0, 5, 9, 13, 17, 4, 8, 12, 16, 20];
  return requiredIndices.every(i => {
    const point = handLandmarks[i];
    return point && point.length >= 2;
  });
}

function fadePoeticPrompt(callback) {
  const poeticLines = document.querySelector('#exitPrompt #poeticLines');
  const playIcon = document.getElementById('playIcon');

  poeticLines.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.8)';

  // 🌌 Select background image based on next scene
  const bgd = document.getElementById('promptBg2');
  const bgl = document.getElementById('promptBg3');
  const bgi = document.getElementById('promptBg4');
  const bgr = document.getElementById('promptBg5');
  activeBg = null;

  // // Show and breathe background image
  if (currentScene === 'disrupt') {
    bgl.classList.remove('shrinkAndBrighten');
    bgl.classList.add('dynamic');
    bgl.style.opacity = 0; // to be zero?
    activeBg = bgl;
  } else if (currentScene === 'loss') {
    bgi.classList.remove('shrinkAndBrighten');
    bgi.classList.add('dynamic');
    bgi.style.opacity = 0;
    activeBg = bgi;
  } else if (currentScene === 'intervention') {
    bgr.classList.remove('shrinkAndBrighten');
    bgr.classList.add('dynamic');
    bgr.style.opacity = 0;
    activeBg = bgr;
  } else if (currentScene === 'control') {
    bgd.classList.remove('shrinkAndBrighten');
    bgd.classList.add('dynamic');
    bgd.style.opacity = 0;
    activeBg = bgd;
  } 


    if (activeBg) {
      activeBg.classList.remove('shrinkAndBrighten');
      activeBg.classList.add('dynamic');
      activeBg.style.opacity = '0'; //to be zero?
      activeBg.style.transform = 'scale(1) rotate(0deg)';
    }

  setTimeout(() => {
    poeticLines.style.display = 'none';

    //  Reset icon state
    playIcon.classList.remove('glow');
    playIcon.style.display = 'block';
    playIcon.style.opacity = 0;
    playIcon.style.transform = 'translate(-50%, -50%) scale(0.6)';

    setTimeout(() => {
      playIcon.style.opacity = 1;
      playIcon.style.transform = 'translate(-50%, -50%) scale(0.6)';
    }, 10);

    monitorPalmHoldForPlay(() => {
      if (activeBg) {
        if (!activeBg) {
          console.warn('activeBg is not defined. Background sync animation will not run.');
        }
        // activeBg.classList.remove('breathe');
        activeBg.classList.add('shrinkAndBrighten');
        setTimeout(() => {
          activeBg.classList.remove('shrinkAndBrighten');
          activeBg.style.opacity = 0;
          callback();
        }, 2000); // Wait for fadeout to complete before video
      } else {
        callback();
      }
    }); // ⬅ Trigger after glow
  }, 800);
}

function monitorHomePlayIconHover() {
  let holdFrames = 0;
  const threshold = 180;
  const playIcon = document.getElementById('playIconHome');
  const progressCircle = document.getElementById('progressCircleHome');

  function checkHover() {
    if (!onHomeScreen || !showPlayIcon || !handLandmarks || handLandmarks.length === 0) {
      requestAnimationFrame(checkHover);
      return;
    }

    let hovered = false;
    const iconRect = playIcon.getBoundingClientRect();

    for (let i = 0; i < handLandmarks.length; i++) {
      const [videoX, videoY] = handLandmarks[i];

      const x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
      const y = videoY * canvas.height / webcam.videoHeight;

      const canvasRect = canvas.getBoundingClientRect();
      const screenX = canvasRect.left + (x / canvas.width) * canvasRect.width;
      const screenY = canvasRect.top + (y / canvas.height) * canvasRect.height;

      if (
        screenX >= iconRect.left &&
        screenX <= iconRect.right &&
        screenY >= iconRect.top &&
        screenY <= iconRect.bottom
      ) {
        hovered = true;
        break;
      }
    }

    if (hovered) {
      playIcon.classList.add('glow');
      holdFrames++;
      const progress = Math.min(holdFrames / threshold, 1);
      const offset = 251.2 * (1 - progress);
      progressCircle.setAttribute('stroke-dashoffset', offset);

      // Sync background image scale/rotation/opacity
        if (activeBg) {
          const rawProgress = Math.min(holdFrames / threshold, 1);
          let eased;

          if (rawProgress < 0.6) {
            const t = rawProgress / 0.6; // remap to 0–1
            eased = 0.5 * t * t; // light but not frozen
          } else {
            const t = (rawProgress - 0.6) / 0.4;
            eased = 0.5 + 0.5 * (t * t * (3 - 2 * t)); // smootherstep
          }
          const scale = 1 - 0.6 * eased;       // smoothly scale up
          const rotate = 10 * eased;           // rotate slowly
          const fade = 1 * (0 + eased);     // opacity fades out to 0

          activeBg.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
          activeBg.style.opacity = `${fade}`;

        }

      if (holdFrames >= threshold && !playIconFilled) {

        if (activeBg) {
            activeBg.classList.remove('dynamic');
            activeBg.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            activeBg.style.transform = `scale(0.1) rotate(18deg)`;
            activeBg.style.opacity = 0;
          }
        playIconFilled = true;

        // Optional: fade out
        playIcon.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        playIcon.style.opacity = 0;
        playIcon.style.transform = 'scale(1.8)';

        setTimeout(() => {
          startExperience(); // ✅ Trigger start
        }, 800);
        return;
      }
    } else {
      if (activeBg) {
          activeBg.style.transform = `scale(1) rotate(0deg)`;
          activeBg.style.opacity = `0`;
          // activeBg.classList.add('breathe');
        }
      playIcon.classList.remove('glow');
      holdFrames = 0;
      progressCircle.setAttribute('stroke-dashoffset', 251.2);
    }

    requestAnimationFrame(checkHover);
  }

  requestAnimationFrame(checkHover);
}

function monitorPalmHoldForPlay(callback) {
  let holdFrames = 0;
  const threshold = 50; // Increase if you want slower fill
  const playIcon = document.getElementById('playIcon');
  const progressCircle = document.getElementById('progressCircle');

  function checkHold() {
    if (handLandmarks && handLandmarks.length > 0) {
      let hovered = false;

      // Check proximity of ALL palm points to the icon
      const iconRect = playIcon.getBoundingClientRect();

      for (let i = 0; i < handLandmarks.length; i++) {
        let [videoX, videoY] = handLandmarks[i];
        let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
        let y = videoY * canvas.height / webcam.videoHeight;

        const canvasRect = canvas.getBoundingClientRect();
        const screenX = canvasRect.left + (x / canvas.width) * canvasRect.width;
        const screenY = canvasRect.top + (y / canvas.height) * canvasRect.height;

        if (
          screenX >= iconRect.left &&
          screenX <= iconRect.right &&
          screenY >= iconRect.top &&
          screenY <= iconRect.bottom
        ) {
          hovered = true;
          break;
        }
      }

      if (hovered) {
        playIcon.classList.add('glow');
        holdFrames++;

        // REMOVE CSS animation to avoid conflict
        //  if (activeBg) {
        //   activeBg.classList.remove('breathe');
        // }


        // Update progress ring
        const progress = Math.min(holdFrames / threshold, 1);
        const offset = 251.2 * (1 - progress);
        progressCircle.setAttribute('stroke-dashoffset', offset);

        // Sync background image scale/rotation/opacity
        if (activeBg) {
          const rawProgress = Math.min(holdFrames / threshold, 1);
          let eased;

          if (rawProgress < 0.6) {
            const t = rawProgress / 0.6; // remap to 0–1
            eased = 0.5 * t * t; // light but not frozen
          } else {
            const t = (rawProgress - 0.6) / 0.4;
            eased = 0.5 + 0.5 * (t * t * (3 - 2 * t)); // smootherstep
          }
          const scale = 1 - 0.7 * eased;       // smoothly scale up
          const rotate = 10 * eased;           // rotate slowly
          const fade = 1 * (0 + eased);     // opacity fades out to 0

          activeBg.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
          activeBg.style.opacity = `${fade}`;
        }

        if (holdFrames >= threshold) {
          if (activeBg) {
            activeBg.classList.remove('dynamic');
            activeBg.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            activeBg.style.transform = `scale(0.1) rotate(18deg)`;
            activeBg.style.opacity = 0;
          }

          //  Fade out play icon
          playIcon.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          playIcon.style.opacity = 0;
          playIcon.style.transform = 'scale(1.8)';

          //  Fade out hint text
          const hintIcon = document.getElementById('exitHandHint');
          const hintText = document.getElementById('exitHintText');

          hintIcon.style.transition = 'opacity 0.4s ease';
          hintIcon.style.opacity = 0;

          hintText.style.transition = 'opacity 0.4s ease';
          hintText.style.opacity = 0;

          // ⏱️ Wait a bit then trigger video
          setTimeout(() => {
            hintIcon.style.display = 'none';
            hintText.style.display = 'none';
            callback();
          }, 50); // slight delay to sync with zoom/fade
          return;
        }
      } else {
        if (activeBg) {
          activeBg.style.transform = `scale(1) rotate(0deg)`;
          activeBg.style.opacity = `0`;
          // activeBg.classList.add('breathe');
        }
        playIcon.classList.remove('glow');
        holdFrames = 0;
        progressCircle.setAttribute('stroke-dashoffset', 251.2); // reset
      }
    }

    requestAnimationFrame(checkHold);
  }

  requestAnimationFrame(checkHold);
}

function playInterventionVideo() {
  currentVideo = interventionVideo;
  document.getElementById('exitPrompt').style.display = 'none';
  canvas.style.display = 'none';
  interventionVideo.style.display = 'block';
  interventionVideo.play();

  interventionVideo.addEventListener('ended', () => {
    [lossVideo, controlVideo, disruptVideo, interventionVideo].forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
      });
    interventionVideo.style.display = 'none';   //  Hide the video first
    canvas.style.display = 'block';             //  Show the canvas again
    currentScene = 'intervention';
    // createInterventionLetters();
    glowingPoints.clear();
    interventionProgressVisual = 0;
    autoCompleteStarted = false;
    interventionInteractionComplete = false;
    interventionSentences = [];
    interventionSceneInitialized = true;
      

    showInterventionInteractionPrompt();    //  Now show the interaction prompt
  });
}

function playReflectionVideo() {
  currentVideo = reflectionVideo;
  canvas.style.display = 'none';
  document.getElementById('exitPrompt').style.display = 'none';
  reflectionVideo.style.display = 'block';
  reflectionVideo.play();

    reflectionVideo.addEventListener('ended', () => {
    // Reset all videos
      [lossVideo, controlVideo, disruptVideo, interventionVideo, reflectionVideo].forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
      });

      console.log("Reflection Video Ended");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'block';
      // ✅ 1. Set current scene
      currentScene = 'reflection-prompt';
      console.log("Scene set to:", currentScene);

      // ✅ 2. Show the final reflection UI container
      const container = document.getElementById('reflectionContainer');
      container.style.display = 'flex';

      // ✅ 3. Reset gesture variables (if needed)
      hoveredBox = null;
      selectedPromise = null;
      promiseHoldStart = null;

      // ✅ 4. Start interaction logic (promise selection will now work)
      hasPromptFaded = true;

      startReflectionInteraction();

      // ✅ 5. Resume hand detection loop (if it had stopped)
      startInteraction();
    });
}

function playDisruptVideo() {
  const prompt = document.getElementById('exitPrompt');
  const playIcon = document.getElementById('playIcon');

  prompt.style.display = 'none';
  playIcon.style.display = 'none';
  canvas.style.display = 'none';

  currentVideo = disruptVideo;
  disruptVideo.style.display = 'block';
  disruptVideo.play();
}

function playLossVideo() {
  currentVideo = lossVideo;
  document.getElementById('exitPrompt').style.display = 'none';
  canvas.style.display = 'none';
  lossVideo.style.display = 'block';
  lossVideo.play();

  lossVideo.addEventListener('ended', () => {
    lossVideo.style.display = 'none';
    canvas.style.display = 'block';
    currentScene = 'loss';
    displayedLoadingProgress = 0;
    isTransitioning = false;
    createLossLetters();
    showLossInteractionPrompt(); // reuse same prompt
  });
}

function drawLevitationLight() {
  ctx.font = '18px Helvetica';

  for (let letter of controlLetters) {
    let distToHand = Infinity;
    const influenceRadius = 120; // Adjust influence radius clearly here

    if (handLandmarks && handLandmarks.length > 0) {
      // Check wrist + fingertips
      let pointsToCheck = [0, 4, 8, 12, 16, 20]; // Wrist + all fingertips
      for (let idx of pointsToCheck) {
        let [videoX, videoY] = handLandmarks[idx];
        let x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
        let y = videoY * canvas.height / webcam.videoHeight;

        let d = dist(x, y, letter.baseX, letter.baseY);
        if (d < distToHand) distToHand = d;
      }
    }

    // Letters within the influence radius push clearly outward
    if (distToHand < influenceRadius) {
      let angle = Math.atan2(letter.baseY - canvas.height / 2, letter.baseX - canvas.width / 2);
      let pushStrength = (influenceRadius - distToHand) / influenceRadius;

      let offsetTargetX = Math.cos(angle) * pushStrength * 50; // outward radial push
      let offsetTargetY = Math.sin(angle) * pushStrength * 50;

      letter.offsetX = letter.offsetX || 0;
      letter.offsetY = letter.offsetY || 0;
      letter.offsetX += (offsetTargetX - letter.offsetX) * 0.12;
      letter.offsetY += (offsetTargetY - letter.offsetY) * 0.12;

      letter.glow = letter.glow || 0;
      letter.glow += (pushStrength - letter.glow) * 0.1;

    } else {
      // Return letters gently to their initial position when hand moves away
      letter.offsetX = letter.offsetX || 0;
      letter.offsetY = letter.offsetY || 0;
      letter.offsetX += (0 - letter.offsetX) * 0.08;
      letter.offsetY += (0 - letter.offsetY) * 0.08;

      letter.glow = letter.glow || 0;
      letter.glow += (0 - letter.glow) * 0.1;
    }

    // Clearly enhanced visual feedback
    ctx.save();
    ctx.translate(letter.baseX + letter.offsetX, letter.baseY + letter.offsetY);

    ctx.shadowColor = `rgba(255,255,255,${0.3 * letter.glow})`;
    ctx.shadowBlur = 14 * letter.glow;

    ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * letter.glow})`;
    ctx.fillText(letter.text, 0, 0);

    ctx.restore();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

//Intervention Start Prompt Appearing and Fading
function showInterventionInteractionPrompt() {
  const prompt = document.getElementById('interactionPrompt');
  const poeticLines = document.getElementById('poeticLines');
  const controlMessage = document.getElementById('controlMessage');
  const disruptMessage = document.getElementById('disruptMessage');
  const hintText = document.getElementById('hintText');
  const interventionMessage = document.getElementById('interventionMessage');

  currentScene = 'intervention';
  hasPromptFaded = false;

  // Reset message states
  poeticLines.innerHTML = `
    <p class="line1">The fragments wait for you.</p>
    <p class="line2">Lift your breath. Lift your hand.</p>
  `;
  poeticLines.style.display = 'block';
  poeticLines.style.opacity = 1;
  poeticLines.style.transform = 'scale(1)';
  interventionMessage.classList.remove('visible');
  interventionMessage.style.display = 'none';

  controlMessage.style.display = 'none';
  disruptMessage.style.display = 'none';
  controlMessage.classList.remove('visible');
  disruptMessage.classList.remove('visible');

  prompt.style.display = 'flex';
  hintText.innerHTML = "Hold your palm. Let what’s broken return.";
  canvas.style.display = 'block';

  // setTimeout(() => {

  // Variables to track interaction state
  let palmHoldStart = null;
  let fadeOutStarted = false;
  let fadeOutDone = false;
  let messageShownTime = null;
  let interactionStarted = false;

  function monitorPalmAndTransition() {
    const palmDetected = isPalmDetected(handLandmarks);

    if (interactionStarted) return;

    if (palmDetected) {
      if (!palmHoldStart) palmHoldStart = performance.now();
      let heldDuration = performance.now() - palmHoldStart;
      heldDuration = heldDuration/4;
      

      if (heldDuration > 400 && !fadeOutStarted) {
        // Start fading out first prompt
        fadeOutStarted = true;
        poeticLines.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        poeticLines.style.opacity = 0;
        poeticLines.style.transform = 'scale(0.9)';
      }
      

      if (heldDuration > 600 && !fadeOutDone) {
        // Hide first prompt, show second message
        fadeOutDone = true;
        poeticLines.style.display = 'none';

        interventionMessage.style.display = 'block';
        // interventionMessage.offsetHeight; // force reflow
        interventionMessage.classList.add('visible');
        // requestAnimationFrame(() => {
        //   interventionMessage.classList.add('visible');
        // });
        
        messageShownTime = performance.now();
      }



      if (fadeOutDone && palmDetected && !interactionStarted) {
        interactionStarted = true;

        setTimeout(() => {
          prompt.style.display = 'none';
          hasPromptFaded = true;

          createInterventionSphereLetters();
          interventionSentencesEmitted = [];
          interventionProgress = 0;
          interventionProgressVisual = 0;

          isInExitPrompt = false;

          startInteraction();
        }, 2200); // wait to let the message settle
      }

    } else if (!fadeOutDone && !interactionStarted) {
      // Reset if palm removed
      // console.log("Palm not detected");
      palmHoldStart = null;
      fadeOutStarted = false;
      fadeOutDone = false;
      messageShownTime = null;
      poeticLines.style.display = 'block';
      poeticLines.style.opacity = 1;
      poeticLines.style.transform = 'scale(1)';
      interventionMessage.classList.remove('visible');
      interventionMessage.style.display = 'none';
    }

    requestAnimationFrame(monitorPalmAndTransition);
  }

  // }, 3200); 

  detectHands(); // ensure detection model is activated
  requestAnimationFrame(monitorPalmAndTransition);
}


//After Disrupt Scene
function showDisruptInteractionPrompt() {
  const prompt = document.getElementById('interactionPrompt');
  const poeticLines = document.getElementById('poeticLines');
  const controlMessage = document.getElementById('controlMessage');
  const hintText = document.getElementById('hintText');

  currentScene = 'disrupt';
  hasPromptFaded = false;

  // Set custom poetic lines for disrupt
  poeticLines.innerHTML = `
    <p class="line1">The clarity fractures.</p>
    <p class="line2">Move your hand to disturb the silence.</p>
  `;

  // Hide previous message (if visible)
  controlMessage.style.display = 'none';
  controlMessage.classList.remove('visible');

  // Reset styles
  poeticLines.style.display = 'block';
  poeticLines.style.opacity = 1;
  poeticLines.style.transform = 'scale(1)';
  hintText.innerHTML = "Lift and Hold your palm to begin";

  prompt.style.display = 'flex';
  canvas.style.display = 'block';

  // Start tracking hand
  requestAnimationFrame(detectHands);
}

function fadePromptAndStartDisruptInteraction() {
  const prompt = document.getElementById('interactionPrompt');
  const poeticLines = document.getElementById('poeticLines');
  const disruptMessage = document.getElementById('disruptMessage');

  // Fade out poetic lines
  poeticLines.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.6)';

  setTimeout(() => {
    poeticLines.style.display = 'none';

    // Show Disrupt Message
    disruptMessage.style.display = 'block';
    setTimeout(() => {
      disruptMessage.classList.add('visible');
    }, 0);

    // Begin interaction after delay
    setTimeout(() => {
      prompt.style.display = 'none';
      canvas.style.display = 'block';
      hasPromptFaded = true;
      disruptSphereFadeIn = 0;
      disruptSphereScaleProgress = 0;
      disruptSphereStartAnimating = true;
      startInteraction(); // begins drawing Disrupt scene
    }, 1800);
  }, 200);
}

function fadePromptAndStartLossInteraction() {
  console.log("👋 Starting Loss Interaction...");
  const prompt = document.getElementById('interactionPrompt');
  const poeticLines = document.getElementById('poeticLines');

  poeticLines.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.6)';

  setTimeout(() => {
    poeticLines.style.display = 'none';

    prompt.style.display = 'none';
    hasPromptFaded = true;
    isInExitPrompt = false; // ✅ important fix
    createLossLetters();
    startInteraction(); // starts drawLossSphere()
  }, 1200);
}


  //After Control Scene
  function showInteractionPrompt() {
      document.getElementById('canvas').style.display = 'block'; // ✅ Show canvas
      document.getElementById('interactionPrompt').style.display = 'flex';

      setTimeout(() => {
        canvas.style.display = 'block';
        requestAnimationFrame(detectHands); // ✅ Begin hand tracking loop
      }, 1400);
  }

  //After Loss Scene
    function showLossInteractionPrompt() {
    const prompt = document.getElementById('interactionPrompt');
    const poeticLines = document.getElementById('poeticLines');
    const controlMessage = document.getElementById('controlMessage');
    const disruptMessage = document.getElementById('disruptMessage');
    const hintText = document.getElementById('hintText');

    currentScene = 'loss';
    hasPromptFaded = false;

    poeticLines.innerHTML = `
      <p class="line1">We forgot how the sky looked.</p>
      <p class="line2">Reach into the haze. Something still lingers.</p>
    `;

    controlMessage.style.display = 'none';
    controlMessage.classList.remove('visible');
    disruptMessage.style.display = 'none';
    disruptMessage.classList.remove('visible');

    poeticLines.style.display = 'block';
    poeticLines.style.opacity = 1;
    poeticLines.style.transform = 'scale(1)';
    hintText.innerHTML = "Touch gently. The silence is fragile.";

    prompt.style.display = 'flex';
    canvas.style.display = 'block';

    requestAnimationFrame(detectHands);
  }

  function fadePromptAndStartInteraction() {
    breathingStartTime = Date.now();
    breathingFadeProgress = 0;
    const prompt = document.getElementById('interactionPrompt');
    const poeticLines = document.getElementById('poeticLines');
    const controlMessage = document.getElementById('controlMessage');

      // Fade out poetic lines
    poeticLines.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    poeticLines.style.opacity = 0;
    poeticLines.style.transform = 'scale(0.6)';

    setTimeout(() => {
      // prompt.style.display = 'none';

      // Replace the poetic text with "You're in control."
      // Hide old poetic lines
      poeticLines.style.display = 'none';

      // Show new message
      controlMessage.style.display = 'block';

      setTimeout(() => {
        controlMessage.classList.add('visible');
      }, 0); // allow for transition   

      //Begin Interaction After a Delay
      // ⏳ Delay starting interaction to let user *see* the message
      setTimeout(() => {
        prompt.style.display = 'none'; // Hide the entire prompt layer
        hasPromptFaded = true;
        sphereFadeIn = 0;
        sphereScaleProgress = 0;
        sphereStartAnimating = true;
        startInteraction();
      }, 1800); // ⏪ wait ~1.8s so the user sees the message

    }, 0); // Delay matches CSS transition
  }

  function updatePromptStateBasedOnHand(predictions) {
    const prompt = document.getElementById('interactionPrompt');
    const handHint = document.getElementById('handHint');
    const palmIcon = document.getElementById('palmIcon');
    const hintText = document.getElementById('hintText');

   
    const setHintText = (text) => {
    hintText.classList.add('fade-out');
      setTimeout(() => {
        hintText.innerHTML = text;
        hintText.classList.remove('fade-out');
      }, 250); // Wait for fade out before changing
     };


    if (predictions.length > 0 && isPalmDetected(predictions[0].landmarks)) {
      if (!handDetected) {
        handDetected = true;
        prompt.classList.add('scaledDown');

        // Update hint to detected state
        setHintText("Palm detected.");

        // Glow effect on Hand detection
        handHint.classList.add('glow'); // Add glow, remove animation

        // Wait briefly to confirm user presence before fading
        if (!hasPromptFaded) {
          promptFadeTimer = setTimeout(() => {
            if (currentScene === 'control') {
              fadePromptAndStartInteraction();
            } else if (currentScene === 'disrupt') {
              fadePromptAndStartDisruptInteraction();
            } else if (currentScene === 'loss') {
              fadePromptAndStartLossInteraction();
            }
            else if (currentScene === 'intervention') {
              fadePromptAndStartInterventionInteraction(); 
            }
          }, 1000);
        }
      }
    } else {
      if (handDetected) {
        handDetected = false;
        prompt.classList.remove('scaledDown');

        // 👋 Revert back to original hint
        setHintText("Lift and Hold your palm to begin");


        // Glow effect removal on Hand detection
        handHint.classList.remove('glow'); //  Remove glow, back to animation

        clearTimeout(promptFadeTimer); // Cancel pending transition
      }
    }
  }

  function fadePromptAndStartInterventionInteraction() {
  const prompt = document.getElementById('interactionPrompt');
  const poeticLines = document.getElementById('poeticLines');
  const interventionMessage = document.getElementById('interventionMessage');

  // Step 1: Fade out initial poetic lines
  poeticLines.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  poeticLines.style.opacity = 0;
  poeticLines.style.transform = 'scale(0.6)';

  setTimeout(() => {
    // Step 2: Hide initial prompt and show new message
    poeticLines.style.display = 'none';
    interventionMessage.style.display = 'block';

    // Trigger the visible animation
    setTimeout(() => {
      interventionMessage.classList.add('visible');
    }, 0);

    // Step 3: Wait and begin interaction
    setTimeout(() => {
      prompt.style.display = 'none';
      hasPromptFaded = true;

      // Reset and start interaction
      // createInterventionSphereLetters();
      interventionSentencesEmitted = [];
      interventionProgress = 0;
      interventionProgressVisual = 0;
      // startInteraction();
    }, 2200); // Hold the message for 2.2 seconds
  }, 0);
}

  function hideInteractionPrompt() {
    if (!hasPromptFaded) {
      hasPromptFaded = true;
      const prompt = document.getElementById('interactionPrompt');
      prompt.style.opacity = 0;
      setTimeout(() => {
        prompt.style.display = 'none';
        // Begin Earth interaction
        startInteraction(); // your existing setup for control scene
      }, 1000); // match transition
    }
  }

  function createLossLetters() {
    controlLetters = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const r = radius * Math.sqrt(Math.random());
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];

      controlLetters.push({
        text: char,
        baseX: x,
        baseY: y,
        x: x,
        y: y,
        opacity: 0.5 + Math.random() * 0.3,
        fading: false,
        fadeAmount: 0,

        // 🔧 NEW properties for displacement after fade
        shifted: false,
        displaceOffset: { x: 0, y: 0 }
      });
    }
    console.log("Loss letters count:", controlLetters.length);
  }

function drawLossSphere() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '20px Gibson, sans-serif';

  for (let letter of controlLetters) {
    const dx = indexTipX - letter.x;
    const dy = indexTipY - letter.y;
    const distToFinger = Math.sqrt(dx * dx + dy * dy);

    // Trigger fading
    if (distToFinger < 60 && !letter.fading) {
      letter.fading = true;
    }

    // Apply fade and glow
    if (letter.fading) {
      letter.fadeAmount += 0.008; // Smooth, slow fade
      letter.opacity = Math.max(0, 1 - letter.fadeAmount);
      letter.glow += (1 - letter.glow) * 0.1; // ease in glow
      ctx.fillStyle = `rgba(100, 120, 140, ${Math.max(letter.opacity, 0.2)})`;
      ctx.shadowColor = `rgba(100, 120, 140, ${0.3 * letter.glow})`;
    } else {
       // Default pollution color
      ctx.fillStyle = `rgba(58, 63, 74, ${letter.opacity})`;
      ctx.shadowColor = `rgba(58, 63, 74, ${0.1 * letter.glow})`;
      letter.glow += (0 - letter.glow) * 0.1; // ease out glow
    }

    // Draw faded/glowing polluted letters
    ctx.shadowColor = `rgba(90, 110, 130, ${0.25 * letter.glow})`;  // blue-grey tint
    ctx.shadowBlur = 10 * letter.glow;
    ctx.fillStyle = `rgba(58, 63, 74, ${Math.max(letter.opacity, 0.2)})`;
    ctx.fillText(letter.text, letter.x, letter.y);
  }

  updateLossLoadingBar();
}

function updateLossLoadingBar() {

  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');

  if (isTransitioning) {
    overlay.style.display = 'none';
    return;
  }

  const fadingCount = controlLetters.filter(l => l.fading).length;
  const total = controlLetters.length;
  const percentage = (fadingCount / total) * 100;

  overlay.style.display = 'block'; // only if not transitioning

  const triggerThreshold = 70;
  const autoCompleteTriggered = percentage >= triggerThreshold && !isTransitioning;

  if (!autoCompleteTriggered) {
    displayedLoadingProgress += (percentage - displayedLoadingProgress) * 0.08;
  } else {
    displayedLoadingProgress += 0.8; // auto-complete speed
    if (displayedLoadingProgress > 100) displayedLoadingProgress = 100;
  }

  loadingBar.style.width = `${displayedLoadingProgress}%`;
  loadingBar.style.background = 'linear-gradient(to right, #e1dcdc, #e1dcdc)';
  loadingBar.style.boxShadow = '0 0 8px rgba(225,220,220, 0.4)';

  if (displayedLoadingProgress > 99 && !isTransitioning) {
    isTransitioning = true;
    loadingBar.classList.add('fade-out-bar');

    setTimeout(() => {
      overlay.style.display = 'none';
      loadingBar.classList.remove('fade-out-bar');
      loadingBar.style.width = '0%';

      document.getElementById('progressOverlay').style.display = 'none';

      interactionDisabled = true;
      earthFadeOut = true;

      setTimeout(() => {
        showPoeticTransitionMessage('intervention');
      }, 1600);
    }, 1000);
  }
}

// ========== EMIT SENTENCES ==========
function emitInterventionSentences(touchX, touchY) {
  let numSentences = floor(random(1, 4)); // Emit 1-3
  for (let i = 0; i < numSentences; i++) {
    let sentence = random(sentencePool);
    let startSide = random(['left', 'right', 'top', 'bottom']);
    let startPos;
    if (startSide === 'left') startPos = createVector(-100, random(height));
    else if (startSide === 'right') startPos = createVector(width + 100, random(height));
    else if (startSide === 'top') startPos = createVector(random(width), -50);
    else startPos = createVector(random(width), height + 50);
    
    let targetOffset = p5.Vector.sub(createVector(touchX, touchY), startPos);
    targetOffset.setMag(100); // Distance from center
    let targetPos = p5.Vector.add(startPos, targetOffset);
    
    interventionSentences.push({
      text: sentence,
      pos: startPos.copy(),
      target: targetPos.copy(),
      progress: 0,
      arrived: false,
      glowPoint: getClosestPointIndex(touchX, touchY)
    });
  }
}

// ========== GLOW POINT TRACKER ==========
function getClosestPointIndex(x, y) {
  let closestIndex = -1;
  let minDist = 10000;
  for (let i = 0; i < interventionSphereLetters.length; i++) {
    let d = dist(x, y, interventionSphereLetters[i].x, interventionSphereLetters[i].y);
    if (d < minDist) {
      minDist = d;
      closestIndex = i;
    }
  }
  return closestIndex;
}

// ========== DRAW INTERVENTION SCENE ==========
function drawInterventionScene() {
  background(20);
  drawEarthSphere(); // Your existing breathing Earth logic
  
  // Draw glowing effect on touched points
  glowingPoints.forEach(index => {
    let pt = interventionSphereLetters[index];
    fill(255, 140, 80, 180);
    noStroke();
    ellipse(pt.x, pt.y, 25);
  });
  
  // Animate Sentences
  for (let s of interventionSentences) {
    if (!s.arrived) {
      s.progress += 0.02;
      s.progress = constrain(s.progress, 0, 1);
      s.pos = p5.Vector.lerp(s.pos, s.target, easeInOut(s.progress));
      if (s.progress >= 0.99) {
        s.arrived = true;
        glowingPoints.add(s.glowPoint);
      }
    }
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text(s.text, s.pos.x, s.pos.y);
  }

  // Update loading bar based on glow
  interventionProgress = glowingPoints.size / maxGlowPoints;
  updateInterventionLoadingBar();
  if (glowingPoints.size >= maxGlowPoints) {
    showInterventionPrompt = true;
  }
}


//Reflection Logics

function startReflectionInteraction() {
  const promiseBoxes = document.querySelectorAll('.promiseBox');

  // ❌ Remove mouse listeners – not needed with hand tracking
  // ✅ Instead, just reset any visual states if needed
  promiseBoxes.forEach(box => {
    box.style.setProperty('--progress', 0);
    box.classList.remove('blurred', 'selected');
  });

  hoveredBox = null;
  selectedPromise = null;
  promiseHoldStart = null;

  monitorHandForPromiseHover();
}

function animateHold(box) {
  const now = performance.now();
  const progress = Math.min((now - holdStartTime) / holdDuration, 1);

  // Visually update loading ring (pseudo)
  box.style.setProperty('--progress', progress);

  if (progress >= 1) {
    finalizePromiseSelection(box);
    return;
  }

  promiseHoldTimer = requestAnimationFrame(() => animateHold(box));
}

function resetHoldVisual(box) {
  box.style.setProperty('--progress', 0);
}

function finalizePromiseSelection(box) {
  selectedPromise = box.getAttribute('data-promise');
  selectedPromiseLetters = selectedPromise.split('');

  const heading = document.getElementById('reflectionHeading');
  if (heading) fadeInHeading("Draw your promise and let the Earth respond");

  // Blur all others
  document.querySelectorAll('.promiseBox').forEach(b => {
    if (b !== box) {
      b.classList.add('blurred');
    } else {
      b.classList.add('selected');
    }
  });

  //for drawing hint inside the circle
  showDrawHint = true;
  drawHintOpacity = 0.6;
  drawHintFading = false;

  // Proceed to drawing phase after short delay
  setTimeout(() => {
    const wrapper = document.getElementById('drawCanvasWrapper');
    if (wrapper) {
      wrapper.classList.add('animateScale');
    }

    // document.getElementById('drawSection').style.display = 'block';
    // initDrawingCanvas(selectedPromise);
    startDrawingPhase();
  }, 1200);
}

function startDrawingPhase() {
  // document.getElementById('drawSection').style.display = 'block';
  document.getElementById('drawSection').classList.add('visible');
  drawProgress = 0;
  drawnLetters = [];
  isDrawingPhase = true; 

  // Start looping draw
  // requestAnimationFrame(drawReflectionFrame);
}

function drawReflectionFrame(predictions) {
  if (!canvas || !ctx || !webcam || !selectedPromiseLetters) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showDrawHint && !drawHintFading && drawnLetters.length > 5) {
    drawHintFading = true;
  }

  if (predictions && predictions.length > 0) {
    const indexTip = predictions[0].landmarks[8];
    const rawX = canvas.width - (indexTip[0] * canvas.width / webcam.videoWidth);
    const rawY = indexTip[1] * canvas.height / webcam.videoHeight;



    // 🌟 Apply smoothing
    if (smoothedX === null || smoothedY === null) {
      smoothedX = rawX;
      smoothedY = rawY;
    } else {
      smoothedX += (rawX - smoothedX) * smoothingFactor;
      smoothedY += (rawY - smoothedY) * smoothingFactor;
    }

     //Show hint inside circle
    if (showDrawHint && drawHintOpacity > 0) {
      ctx.save();
      ctx.font = 'italic 1.5rem Gibson';
      ctx.fillStyle = `rgba(255, 255, 255, ${drawHintOpacity})`;
      ctx.textAlign = 'center';
      ctx.fillText("your glowing brush", smoothedX, smoothedY - 30);
      ctx.restore();

      if (drawHintFading) {
        drawHintOpacity -= 0.02; // fade out
        if (drawHintOpacity <= 0) {
          drawHintOpacity = 0;
          showDrawHint = false;
        }
      }
    }

    // ✨ Draw glowing finger at smoothed position
    drawGlowingFinger(smoothedX, smoothedY);

    // 🖊️ Add letter if inside area and enough time has passed
    const now = performance.now();
    if (
      isInsideDrawArea(smoothedX, smoothedY) &&
      drawnLetters.length < maxLetters &&
      now - lastLetterPlacedAt > drawDelay
    ) {
      const letter = selectedPromiseLetters[drawnLetters.length % selectedPromiseLetters.length];
      drawnLetters.push({ letter, x: smoothedX, y: smoothedY });
      drawProgress++;
      updateDrawProgressBar();
      lastLetterPlacedAt = now;
    }
  }

  // 🎨 Draw all placed letters
  drawnLetters.forEach(l => {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'normal 2.5rem Gibson';
    ctx.textAlign = 'center';
    ctx.fillText(l.letter, l.x, l.y);
    ctx.restore();
  });

  if (drawProgress >= maxLetters) {
    finalizeDrawingReflection();
  }
}

function updateDrawProgressBar() {
  const circle = document.getElementById('drawProgressCircle');
  const total = 1194;
  const progress = Math.min(drawProgress / maxLetters, 1);
  circle.setAttribute('stroke-dashoffset', total * (1 - progress));
}

function finalizeDrawingReflection() {
  document.getElementById('drawLoadingCircle').style.display = 'none';

  // Animate Earth
  const wrapper = document.getElementById('drawCanvasWrapper');
  wrapper.classList.add('scaleUpCircle');

  // Change message
  // What would you promise the Earth?


  document.getElementById('reflectionHeading').textContent = "The Earth holds your promise. Let it breathe.";


  // Wait, then start interaction (you can fill this later)
  setTimeout(() => {

    const hint = document.getElementById('promptHintArea2');
    if (hint) {
      hint.style.display = 'flex';
      hint.classList.add('visible');
    }

    // Start monitoring palm
    monitorReflectionPalm(() => {
      // You can trigger the progress bar here
      // startFinalBreathingInteraction();
      // console.log("🌬️ Palm held — interaction ready to start");
      finalBreathingStarted = true;
    });

    // Set state for palm interaction
    isFinalInteractionPhase = true;
    // finalBreathingStarted = false; // reset
    // finalBreathingStarted = true;
    // shouldShowGlowingFinger = false;
    isDrawingPhase = false;
    isDrawingPhaseDone = true;
    // startFinalBreathingInteraction(); // to be defined in next phase
  }, 1500);
}

function drawStaticEarthLetters() {
  if (!canvas || !ctx || !drawnLetters) return;

  isTransitioning = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 1;
  ctx.shadowColor = '#A6BFFF'; // Soft glow
  ctx.shadowBlur = 35;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'normal 2.5rem Gibson';
  ctx.textAlign = 'center';

  drawnLetters.forEach(letter => {
    ctx.fillText(letter.letter, letter.x, letter.y);
  });

  // Optional: clone for reflection interaction
  if (!finalEarthLetters || finalEarthLetters.length === 0) {
    finalEarthLetters = drawnLetters.map(l => ({
      text: l.letter,
      baseX: l.x,
      baseY: l.y,
      currentPull: 1,
      glow: 0,
      dimOpacity: 0.3
    }));
  }
}


function isInsideDrawArea(x, y) {
  const wrapper = document.getElementById('drawCanvasWrapper');
  const rect = wrapper.getBoundingClientRect();

  const canvasRect = canvas.getBoundingClientRect();

  // Convert wrapper center to canvas coordinates
  const centerX = ((rect.left + rect.width / 2) - canvasRect.left) * (canvas.width / canvasRect.width);
  const centerY = ((rect.top + rect.height / 2) - canvasRect.top) * (canvas.height / canvasRect.height);

  const radius = 180; // Adjust as needed

  const dx = x - centerX;
  const dy = y - centerY;

  return dx * dx + dy * dy <= radius * radius;
}

// for index glowing
function drawGlowingFinger(x, y, radius = 17, color = '#6A7BE3') {
  if (!shouldShowGlowingFinger) return;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 50;
  ctx.fill();
  ctx.shadowBlur = 0;
}

//only monitor finger logic

function monitorHandForPromiseHover(predictions) {
  if (!predictions || predictions.length === 0 || !canvas || !webcam) return;

  const indexTip = predictions[0].landmarks[8];
  if (!indexTip) return;

  // Map index finger coordinates to screen space
  let x = canvas.width - (indexTip[0] * canvas.width / webcam.videoWidth);
  let y = indexTip[1] * canvas.height / webcam.videoHeight;

  const canvasRect = canvas.getBoundingClientRect();
  const screenX = canvasRect.left + (x / canvas.width) * canvasRect.width;
  const screenY = canvasRect.top + (y / canvas.height) * canvasRect.height;

  // Glow index function
  drawGlowingFinger(x, y);

  // Check if finger is over any .promiseBox
  const elementUnderFinger = document.elementFromPoint(screenX, screenY);
  if (elementUnderFinger) {
    console.log("👆 Finger over:", elementUnderFinger.className || elementUnderFinger.id);
  }

  if (elementUnderFinger && elementUnderFinger.classList.contains('promiseBox') && !selectedPromise) {
    if (elementUnderFinger !== hoveredBox) {
      if (hoveredBox) hoveredBox.style.setProperty('--progress', 0);
      hoveredBox = elementUnderFinger;
      promiseHoldStart = performance.now();
    }

    const progress = Math.min((performance.now() - promiseHoldStart) / holdDuration, 1);
    const svgPath = hoveredBox.querySelector('.promiseProgress .fg');
    // hoveredBox.style.setProperty('--progress', progress);

    if (hoveredBox) {
      const progress = Math.min((performance.now() - promiseHoldStart) / holdDuration, 1);
      const fgPath = hoveredBox.querySelector('.promiseProgress .progress-fg');
      if (fgPath) {
        const totalLength = 680; // total stroke-dasharray length (same as in SVG)
        const offset = totalLength * (1 - progress);
        fgPath.setAttribute('stroke-dashoffset', offset);
      }

      if (progress >= 1 && hoveredBox) {
        finalizePromiseSelection(hoveredBox);
        hoveredBox = null;
      }
    }
  } else {
    if (hoveredBox) {
      const fgPath = hoveredBox.querySelector('.promiseProgress .progress-fg');
      if (fgPath) fgPath.setAttribute('stroke-dashoffset', 680); // reset
    }
    hoveredBox = null;
  }
}

function fadeInHeading(newText) {
  const heading = document.getElementById('reflectionHeading');
  if (!heading) return;

  heading.textContent = newText;

  // Remove previous animation class if any
  heading.classList.remove('fade-glow');

  // Force reflow to restart animation
  void heading.offsetWidth;

  // Add animation class
  heading.classList.add('fade-glow');
}


function animateHeadingChange(newText) {
  const heading = document.getElementById('reflectionHeading');
  if (!heading) return;

  // Clear existing content
  heading.innerHTML = '';

  // Split by words
  const words = newText.split(' ');

  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.classList.add('word-fade');
    span.style.animationDelay = `${i * 0.26}s`; // Delay per word
    heading.appendChild(span);

    if (i !== words.length - 1) {
      heading.appendChild(document.createTextNode(' '));
    }
  });
}

function monitorReflectionPalm(callback) {
  const hintText = document.getElementById('hintText2');
  const handHint = document.getElementById('handHint2');

  let palmVisible = false;
  let callbackTriggered = false;

  function check() {
    if (handLandmarks && handLandmarks.length > 0) {
      if (!palmVisible) {
        palmVisible = true;

        hintText.style.opacity = 0;
        setTimeout(() => {
          hintText.innerHTML = "Feel control return";
          hintText.style.opacity = 1;
        }, 200);
        handHint.classList.add('glow');
      }

      if (!callbackTriggered) {
        callbackTriggered = true;
        callback(); // this can start the breathing interaction later
      }
    } else {
      if (palmVisible) {
        palmVisible = false;

        hintText.style.opacity = 0;
        setTimeout(() => {
          hintText.innerHTML = "Lift your palm to begin";
          hintText.style.opacity = 1;
        }, 200);
        handHint.classList.remove('glow');
      }

      callbackTriggered = false; // Reset callback so it's ready again
    }

    requestAnimationFrame(check);
  }

  check();
}

function drawReflectionBreathingEarth() {
  ctx.globalAlpha = 1.0;

  const breathCycleMs = 6000;
  const t = (Date.now() % breathCycleMs) / breathCycleMs;
  const rawBreath = 1 + 0.02 * Math.sin(t * 2 * Math.PI);
  smoothedBreath += (rawBreath - smoothedBreath) * 0.02;

  ctx.save();

  let anyLetterIsInteracting = false;

  for (let letter of finalEarthLetters) {
    const baseX = letter.baseX;
    const baseY = letter.baseY;

    // Interaction detection using multiple hand points
    let distToFinger = Infinity;
    if (handLandmarks && handLandmarks.length > 0) {
      const pointsToCheck = [0, 4, 8, 12, 16, 20];
      for (let idx of pointsToCheck) {
        const [videoX, videoY] = handLandmarks[idx];
        const x = canvas.width - (videoX * canvas.width / webcam.videoWidth);
        const y = videoY * canvas.height / webcam.videoHeight;
        const d = Math.hypot(x - baseX, y - baseY);
        if (d < distToFinger) distToFinger = d;
      }
    }

    const interactionThreshold = 70;
    const isInteracting = distToFinger < interactionThreshold;
    if (isInteracting) anyLetterIsInteracting = true;

    // Animate contraction if interacting
    let targetPull = isInteracting ? 1 - Math.min(distToFinger / interactionThreshold, 1) * 0.5 : 1;
    letter.currentPull = letter.currentPull || 1;
    letter.currentPull += (targetPull - letter.currentPull) * 0.04;

    // Step 1: Calculate center of the Earth once
    if (!earthCentroid) {
      let sumX = 0, sumY = 0;
      for (let l of finalEarthLetters) {
        sumX += l.baseX;
        sumY += l.baseY;
      }
      earthCentroid = {
        x: sumX / finalEarthLetters.length,
        y: sumY / finalEarthLetters.length
      };
    }

    // Step 2: Move letters toward centroid when interacting
    const dx = baseX - earthCentroid.x;
    const dy = baseY - earthCentroid.y;
    const finalX = baseX - dx * (1 - smoothedBreath * letter.currentPull);
    const finalY = baseY - dy * (1 - smoothedBreath * letter.currentPull);

    const targetGlow = Math.max(0, Math.min(1, (1.0 - letter.currentPull) / 0.3));
    letter.glow = letter.glow || 0;
    letter.glow += (targetGlow - letter.glow) * 0.35;

    // Drawing style
    if (isInteracting) {
      ctx.shadowColor = `rgba(166,191,255,${0.9 * letter.glow})`;
      ctx.shadowBlur = 45 * letter.glow;
      ctx.fillStyle = `rgba(166,191,255,${0.25 + 0.65 * letter.glow})`;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      letter.dimOpacity = letter.dimOpacity || 0.45;
      let targetDim = anyLetterIsInteracting ? 0.35 : 0.45;
      letter.dimOpacity += (targetDim - letter.dimOpacity) * 0.07;
      ctx.fillStyle = `rgba(166,191,255,${letter.dimOpacity})`;
    }

    ctx.fillText(letter.text, finalX, finalY);
  }

  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;


  updateLoadingBarReflection(anyLetterIsInteracting);
}

function updateLoadingBarReflection(isInteracting) {
  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');


  loadingBar.style.background = 'linear-gradient(to right, #A6BFFF, #85A8FF)';

  overlay.style.display = 'block';


  if (!isTransitioning) {
    if (isInteracting) {
      interactionHoldFrames++;
      if (interactionHoldFrames >= framesToHold) {
        loadingProgress += 0.15;
      }
    } else {
      interactionHoldFrames = 0;
      loadingProgress -= 0.08;
    }

    loadingProgress = Math.max(0, Math.min(100, loadingProgress));

    let t = loadingProgress / 100;
    let eased = t * t * (3 - 2 * t);
    displayedLoadingProgress += (eased * 100 - displayedLoadingProgress) * 0.05;

    loadingBar.style.width = `${displayedLoadingProgress}%`;


    if (loadingProgress >= 98) {
      loadingProgress = 100;
    }

    if (loadingProgress >= 100 && !isTransitioning) {
      isTransitioning = true;
      loadingBar.classList.add('fade-out-bar');

      setTimeout(() => {
        overlay.style.display = 'none';
        loadingBar.classList.remove('fade-out-bar');
        loadingBar.style.width = '0%';

        interactionDisabled = true;

        earthFadeOut = true;
        setTimeout(() => {
          showFinalThankYouScreen(); // you can define this next
          resetExperience();
          setTimeout(() => {
            window.location.reload(); // Soft reset, works well on HTTPS
          }, 5000);
        }, 1600);
      }, 1200);
    }
  }
}

function showFinalThankYouScreen() {
  // Stop rendering anything
  // cancelAnimationFrame(animationFrameId); // only if you're using requestAnimationFrame

  // Optionally clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Hide canvas, show centered thank-you
  const reflectionContainer = document.getElementById('reflectionContainer');
  reflectionContainer.style.opacity = '0';
  document.getElementById('canvas').style.display = 'none';

  const thankYouScreen = document.createElement('div');
  thankYouScreen.id = 'thankYouMessage';
  thankYouScreen.innerText = 'Thank you for caring.';
  thankYouScreen.style.position = 'absolute';
  thankYouScreen.style.top = '50%';
  thankYouScreen.style.left = '50%';
  thankYouScreen.style.transform = 'translate(-50%, -50%)';
  thankYouScreen.style.fontSize = '2.8rem';
  thankYouScreen.style.fontFamily = 'Gibson, sans-serif';
  thankYouScreen.style.color = '#A6BFFF';
  thankYouScreen.style.textAlign = 'center';
  thankYouScreen.style.opacity = '0';
  thankYouScreen.style.transition = 'opacity 1s ease';

  document.body.appendChild(thankYouScreen);

  setTimeout(() => {
    reflectionContainer.style.display = 'none';
    thankYouScreen.style.opacity = '1';
  }, 1100);
}

function normalizeToScreen(landmark) {
  return [
    landmark[0] * window.innerWidth,
    landmark[1] * window.innerHeight
  ];
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}



function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resetExperience() {

  // General state
  currentScene = 'home';
  interactionDisabled = false;
  isTransitioning = false;

  // Loading progress
  loadingProgress = 0;
  displayedLoadingProgress = 0;
  interactionHoldFrames = 0;

  // Control scene
  controlLetters = [];
  controlSceneInitialized = false;

  // Disrupt scene
  disruptSceneInitialized = false;
  disruptLetters = [];
  pollutionOpacity = 0;

  // Loss scene
  lossLetters = [];
  fadingLetters = [];
  fadingProgress = 0;

  // Intervention scene
  sentenceLetters = [];
  backgroundLetters = [];
  promiseTouchCount = 0;

  // Final reflection
  finalEarthLetters = [];
  finalBreathingStarted = false;
  isFinalEarthReady = false;
  isFinalInteractionPhase = false;
  earthFadeOut = false;

  // Drawing phase
  isDrawingPhase = false;
  isDrawingPhaseDone = false;
  chosenPromise = "";
  drawingPath = [];
  userCreatedEarth = [];
  reflectionLoadingInitialized = false;

  // Reset visuals
  const loadingBar = document.getElementById('loadingBar');
  const overlay = document.getElementById('progressOverlay');
  loadingBar.style.width = '0%';
  overlay.style.display = 'none';

  //HomeScreen Setup
  onHomeScreen = true;
  palmHoldFrames = 0;
  showPlayIcon = false;
  playProgress = 0;
  playHovering = false;
  playIconFilled = false;

  palmLostFrames = 0;

  inactivityTimeout = null;

  homeResetTimer = null;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Optional: reset hand landmarks
  handLandmarks = [];

  console.log('resetted everything 🥳');

}

setup();