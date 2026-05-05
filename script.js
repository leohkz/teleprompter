/* ===== DOM ===== */
const video             = document.getElementById('cameraPreview');
const textInput         = document.getElementById('textInput');
const scrollingText     = document.getElementById('scrollingText');
const fontSizeInput     = document.getElementById('fontSize');
const fontSizeDisplay   = document.getElementById('fontSizeDisplay');
const fontColorInput    = document.getElementById('fontColor');
const scrollSpeedInput  = document.getElementById('scrollSpeed');
const speedDisplay      = document.getElementById('speedDisplay');
const wpmDisplay        = document.getElementById('wpmDisplay');
const fsDisplay         = document.getElementById('fsDisplay');
const estimatedTimeEl   = document.getElementById('estimatedTime');
const textWrapper       = document.getElementById('textWrapper');
const prompterContainer = document.getElementById('prompterContainer');
const prompterWindow    = document.getElementById('prompterWindow');
const dragHandle        = document.getElementById('dragHandle');
const resizeHandle      = document.getElementById('resizeHandle');
const countdownOverlay  = document.getElementById('countdownOverlay');
const countdownNumber   = document.getElementById('countdownNumber');
const countdownTimeInput= document.getElementById('countdownTime');
const downloadContainer = document.getElementById('downloadContainer');
const downloadLink      = document.getElementById('downloadLink');
const settingsDrawer    = document.getElementById('settingsDrawer');
const btnOpenSettings   = document.getElementById('btnOpenSettings');
const btnCloseSettings  = document.getElementById('btnCloseSettings');
const btnRecord         = document.getElementById('btnRecord');
const btnFlip           = document.getElementById('btnFlip');
const btnMirror         = document.getElementById('btnMirror');
const btnRotLeft        = document.getElementById('btnRotLeft');
const btnRotRight       = document.getElementById('btnRotRight');
const btnPortrait       = document.getElementById('btnPortrait');
const wpmDown           = document.getElementById('wpmDown');
const wpmUp             = document.getElementById('wpmUp');
const fsDown            = document.getElementById('fsDown');
const fsUp              = document.getElementById('fsUp');

/* ===== 相機 ===== */
let mediaStream = null;
let facingMode  = 'user';
let isMirror    = true; // 預設反鏡像

async function initCamera(facing) {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        video.srcObject = mediaStream;
    } catch (err) {
        alert('無法啟動相機，請確認授權並在 HTTPS 下運行。\n' + err);
    }
}
initCamera(facingMode);

// 初始鏡像狀態（CSS 已預設 scaleX(-1)）
video.classList.toggle('mirror-off', !isMirror);

btnFlip.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    initCamera(facingMode);
});

btnMirror.addEventListener('click', () => {
    isMirror = !isMirror;
    video.classList.toggle('mirror-off', !isMirror);
    btnMirror.classList.toggle('mirror-active', isMirror);
});

/* ===== 設定抽屜 ===== */
const openSettings  = () => settingsDrawer.classList.add('open');
const closeSettings = () => settingsDrawer.classList.remove('open');

btnOpenSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click', closeSettings);
window.addEventListener('pointerdown', (e) => {
    if (settingsDrawer.classList.contains('open') &&
        !settingsDrawer.contains(e.target) &&
        e.target !== btnOpenSettings) {
        closeSettings();
    }
});

/* ===== 同步 WPM 滑桿與底部顯示 ===== */
function syncWPM(val) {
    val = Math.max(30, Math.min(400, val));
    scrollSpeedInput.value = val;
    speedDisplay.innerText = val;
    wpmDisplay.innerText   = val;
    calcEstimate();
}

scrollSpeedInput.addEventListener('input', (e) => syncWPM(parseInt(e.target.value)));
wpmDown.addEventListener('click', () => syncWPM(parseInt(scrollSpeedInput.value) - 10));
wpmUp.addEventListener('click',   () => syncWPM(parseInt(scrollSpeedInput.value) + 10));

/* ===== 同步字體大小滑桿與底部顯示 ===== */
function syncFS(val) {
    val = Math.max(16, Math.min(100, val));
    fontSizeInput.value         = val;
    fontSizeDisplay.innerText   = val;
    fsDisplay.innerText         = val;
    scrollingText.style.fontSize = val + 'px';
    calcEstimate();
}

fontSizeInput.addEventListener('input', (e) => syncFS(parseInt(e.target.value)));
fsDown.addEventListener('click', () => syncFS(parseInt(fontSizeInput.value) - 2));
fsUp.addEventListener('click',   () => syncFS(parseInt(fontSizeInput.value) + 2));

/* ===== 文字顏色 ===== */
fontColorInput.addEventListener('input', (e) => {
    scrollingText.style.color = e.target.value;
});

/* ===== 提示詞輸入 ===== */
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value || '請先點右上角「設定」輸入提示詞…';
    calcEstimate();
});

/* ===== 預計時長：以 WPM 計算 ===== */
// WPM = 每分鐘字數（中文按字，英文按詞）
function countUnits(text) {
    // 中文字符計為 1 字，英文詞（連續字母/數字）計為 1 詞
    const chinese = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;
    return chinese + englishWords;
}

function calcEstimate() {
    const text = textInput.value.trim();
    if (!text) { estimatedTimeEl.innerText = '0.0 秒'; return; }
    const units  = countUnits(text);
    const wpm    = parseInt(scrollSpeedInput.value) || 120;
    const secs   = (units / wpm) * 60;
    estimatedTimeEl.innerText = secs.toFixed(1) + ' 秒';
}
new ResizeObserver(calcEstimate).observe(prompterContainer);

/* ===== 旋轉 ===== */
let currentRotation = 0;
function applyRotation() {
    textWrapper.style.transform = `rotate(${currentRotation}deg)`;
}
btnRotLeft.addEventListener('click',  () => { currentRotation = -90; applyRotation(); });
btnRotRight.addEventListener('click', () => { currentRotation =  90; applyRotation(); });
btnPortrait.addEventListener('click', () => { currentRotation =   0; applyRotation(); });

/* ===== 提示詞滾動（按 WPM 換算成 px/frame）===== */
// 以 WPM 決定每秒滾動多少像素：
// 一行約能容納 containerWidth / (fontSize * 0.6) 個字
// 每個字需要 60/WPM 秒顯示
// 因此每秒滾動行高 = lineHeight * WPM / charsPerLine

let scrollY    = 0;
let isScrolling = false;
let animId     = null;

function calcPxPerFrame() {
    const wpm      = parseInt(scrollSpeedInput.value) || 120;
    const fontSize = parseInt(fontSizeInput.value)    || 30;
    const lineH    = fontSize * 1.55; // 對應 CSS line-height: 1.55
    const contW    = prompterContainer.clientWidth || 300;
    const charsPerLine = Math.max(1, contW / (fontSize * 0.58));
    // 每行顯示時間（秒）= charsPerLine / (WPM / 60)
    const secPerLine   = (charsPerLine / wpm) * 60;
    const pxPerSec     = lineH / secPerLine;
    return pxPerSec / 60; // 每 frame（60fps）的像素
}

function startScrolling() {
    scrollY = prompterContainer.clientHeight;
    isScrolling = true;
    function tick() {
        if (!isScrolling) return;
        scrollY -= calcPxPerFrame();
        scrollingText.style.top = scrollY + 'px';
        if (scrollY > -scrollingText.scrollHeight) {
            animId = requestAnimationFrame(tick);
        } else {
            stopRecording();
        }
    }
    tick();
}

function stopScrolling() {
    isScrolling = false;
    cancelAnimationFrame(animId);
    scrollingText.style.top = '100%';
}

/* ===== 錄影 ===== */
let mediaRecorder  = null;
let recordedChunks = [];
let isRecording    = false;

btnRecord.addEventListener('click', () => {
    isRecording ? stopRecording() : startCountdown();
});

function startCountdown() {
    let n = parseInt(countdownTimeInput.value) || 0;
    if (n <= 0) { startRecording(); return; }
    countdownNumber.innerText = n;
    countdownOverlay.classList.add('active');
    const t = setInterval(() => {
        n--;
        if (n > 0) {
            countdownNumber.innerText = n;
        } else {
            clearInterval(t);
            countdownOverlay.classList.remove('active');
            startRecording();
        }
    }, 1000);
}

function startRecording() {
    if (!mediaStream) { alert('相機未就緒'); return; }
    recordedChunks = [];
    try {
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : MediaRecorder.isTypeSupported('video/webm')            ? 'video/webm'
                   : '';
        mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime })
                             : new MediaRecorder(mediaStream);
    } catch(e) { alert('此設備不支援錄影功能'); return; }

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadContainer.style.display = 'block';
        openSettings();
    };
    mediaRecorder.start();
    isRecording = true;
    btnRecord.classList.add('recording');
    downloadContainer.style.display = 'none';
    closeSettings();
    startScrolling();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    isRecording = false;
    btnRecord.classList.remove('recording');
    stopScrolling();
}

/* ===== 拖拽浮窗（Pointer Events）===== */
let drag = false, dragSX, dragSY, dragL0, dragT0;

dragHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragHandle.setPointerCapture(e.pointerId);
    const rect = prompterWindow.getBoundingClientRect();
    drag = true;
    dragSX = e.clientX; dragSY = e.clientY;
    dragL0 = rect.left; dragT0 = rect.top;
    prompterWindow.style.transform = 'none';
});
dragHandle.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();
    const bh  = 110;
    const pw  = prompterWindow;
    let newL  = dragL0 + (e.clientX - dragSX);
    let newT  = dragT0 + (e.clientY - dragSY);
    newL = Math.max(0, Math.min(newL, window.innerWidth  - pw.offsetWidth));
    newT = Math.max(0, Math.min(newT, window.innerHeight - pw.offsetHeight - bh));
    pw.style.left = newL + 'px';
    pw.style.top  = newT + 'px';
});
dragHandle.addEventListener('pointerup',     () => { drag = false; });
dragHandle.addEventListener('pointercancel', () => { drag = false; });

/* ===== 縮放浮窗（Pointer Events）===== */
let resize = false, resSX, resSY, resW0, resH0;

resizeHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    resizeHandle.setPointerCapture(e.pointerId);
    resize = true;
    resSX = e.clientX; resSY = e.clientY;
    resW0 = prompterWindow.offsetWidth;
    resH0 = prompterWindow.offsetHeight;
    prompterWindow.style.transform = 'none';
});
resizeHandle.addEventListener('pointermove', (e) => {
    if (!resize) return;
    e.preventDefault();
    const bh   = 110;
    const rect = prompterWindow.getBoundingClientRect();
    const newW = Math.max(160, Math.min(resW0 + (e.clientX - resSX), window.innerWidth  - rect.left));
    const newH = Math.max(120, Math.min(resH0 + (e.clientY - resSY), window.innerHeight - rect.top - bh));
    prompterWindow.style.width  = newW + 'px';
    prompterWindow.style.height = newH + 'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => { resize = false; });
resizeHandle.addEventListener('pointercancel', () => { resize = false; });

/* ===== 初始位置置中並防超出 ===== */
function clampWindow() {
    const pw  = prompterWindow;
    const bh  = 110;
    const rect = pw.getBoundingClientRect();
    const l   = Math.max(0, Math.min(rect.left, window.innerWidth  - pw.offsetWidth));
    const t   = Math.max(0, Math.min(rect.top,  window.innerHeight - pw.offsetHeight - bh));
    pw.style.left      = l + 'px';
    pw.style.top       = t + 'px';
    pw.style.transform = 'none';
}
window.addEventListener('load',   clampWindow);
window.addEventListener('resize', clampWindow);
