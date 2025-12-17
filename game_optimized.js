const UN_CONTAINER = document.getElementById('unsorted-container');
const SORTED_CONTAINER = document.getElementById('sorted-container');
const CHECK_BUTTON = document.getElementById('checkButton');
const FEEDBACK_AREA = document.getElementById('feedback-area');
const TIMER_DISPLAY = document.getElementById('time-left');
const bgMusic = document.getElementById('bgMusic');

let originalArray = [], currentSorted = [], placeholderElements = [];
let gameTimer, timeLeft, isMusicPlaying = false;

// --- ÂM THANH ---
function playPopSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    window.speechSynthesis.speak(msg);
}

function toggleMusic() {
    if (!isMusicPlaying) {
        bgMusic.play();
        document.getElementById('muteButton').innerText = "🎶 Nhạc: Bật";
    } else {
        bgMusic.pause();
        document.getElementById('muteButton').innerText = "🎵 Nhạc: Tắt";
    }
    isMusicPlaying = !isMusicPlaying;
}

// --- LOGIC CHÍNH ---
function generateNumbers(size) {
    const nums = new Set();
    while (nums.size < size) nums.add(Math.floor(Math.random() * 99) + 1);
    return Array.from(nums);
}

function startGame() {
    const size = parseInt(document.getElementById('sizeSelect').value);
    originalArray = generateNumbers(size);
    currentSorted = new Array(size).fill(null);
    
    UN_CONTAINER.classList.remove('hidden-container');
    UN_CONTAINER.innerHTML = '';
    SORTED_CONTAINER.innerHTML = '';
    FEEDBACK_AREA.innerHTML = '';
    FEEDBACK_AREA.className = '';
    CHECK_BUTTON.disabled = true;
    CHECK_BUTTON.style.display = 'inline-block';

    originalArray.forEach((number, index) => {
        const block = document.createElement('div');
        block.className = `number-block color-${index % 10}`;
        block.id = `block-un-${index}`;
        block.innerText = number;
        block.dataset.value = number;
        block.dataset.index = index;
        block.onclick = () => handleBlockClick(block);
        UN_CONTAINER.appendChild(block);
    });

    placeholderElements = [];
    for (let i = 0; i < size; i++) {
        const p = document.createElement('div');
        p.className = 'placeholder';
        p.dataset.index = i;
        p.onclick = () => handlePlaceholderClick(p);
        SORTED_CONTAINER.appendChild(p);
        placeholderElements.push(p);
    }

    timeLeft = (size == 5) ? 15 : (size == 8) ? 20 : 25;
    TIMER_DISPLAY.innerText = timeLeft;
    clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        TIMER_DISPLAY.innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(gameTimer); checkResult(true); }
    }, 1000);
}

function handleBlockClick(block) {
    if (block.classList.contains('invisible-ghost')) return;
    playPopSound();
    const targetIdx = currentSorted.findIndex(v => v === null);
    if (targetIdx !== -1) {
        currentSorted[targetIdx] = parseInt(block.dataset.value);
        block.classList.add('invisible-ghost');
        const moving = block.cloneNode(true);
        moving.classList.remove('invisible-ghost');
        moveElement(moving, placeholderElements[targetIdx], true, block);
        CHECK_BUTTON.disabled = !currentSorted.every(v => v !== null);
    }
}

function handlePlaceholderClick(p) {
    const block = p.querySelector('.number-block');
    if (!block) return;
    playPopSound();
    const idx = parseInt(p.dataset.index);
    const originalBlock = document.getElementById(`block-un-${block.dataset.index}`);
    currentSorted[idx] = null;
    moveElement(block, originalBlock, false, originalBlock);
    CHECK_BUTTON.disabled = true;
}

function moveElement(moving, target, isSorting, original) {
    const start = moving.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    moving.style.position = 'fixed';
    moving.style.top = start.top + 'px';
    moving.style.left = start.left + 'px';
    moving.style.zIndex = '1000';
    document.body.appendChild(moving);

    requestAnimationFrame(() => {
        moving.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        moving.style.transform = `translate(${end.left - start.left}px, ${end.top - start.top}px) rotate(${isSorting?360:-360}deg)`;
    });

    setTimeout(() => {
        moving.remove();
        if (isSorting) {
            const final = moving.cloneNode(true);
            final.style = '';
            target.appendChild(final);
            final.onclick = () => handlePlaceholderClick(target);
        } else {
            original.classList.remove('invisible-ghost');
        }
    }, 600);
}

function checkResult(expired = false) {
    clearInterval(gameTimer);
    UN_CONTAINER.classList.add('hidden-container');
    CHECK_BUTTON.style.display = 'none';
    
    const order = document.getElementById('orderSelect').value;
    const correctArr = [...originalArray].sort((a,b) => order==='asc' ? a-b : b-a);
    let isCorrect = true;
    let illustration = '';

    placeholderElements.forEach((p, i) => {
        const val = currentSorted[i];
        const match = val === correctArr[i];
        if (!match) isCorrect = false;
        illustration += `<div class="number-block color-${correctArr[i]%10} ${match?'':'error-block'}">${correctArr[i]}</div>`;
    });

    if (isCorrect) {
        FEEDBACK_AREA.className = 'feedback-correct';
        FEEDBACK_AREA.innerHTML = `<h2>🎉 TUYỆT VỜI! 🎉</h2><p>Bé thật là giỏi!</p>`;
        speak("Tuyệt vời, bé giỏi quá");
    } else {
        FEEDBACK_AREA.className = 'feedback-wrong';
        FEEDBACK_AREA.innerHTML = `<h2>${expired?'⏰ HẾT GIỜ':'❌ SAI RỒI'}</h2><p>Hãy xem kết quả đúng nhé:</p>
        <div class="number-container sorted-illustration">${illustration}</div>`;
        speak("Tiếc quá, bé hãy cố gắng lần sau nhé");
    }
    FEEDBACK_AREA.innerHTML += `<button onclick="startGame()" style="margin-top:20px; background:#ff69b4; color:white; border:none; padding:12px 25px; border-radius:12px; box-shadow: 0 4px 0 #d81b60;">CHƠI LẠI</button>`;
}

window.onload = () => { TIMER_DISPLAY.innerText = "--"; };
