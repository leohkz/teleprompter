/* ===== DOM ===== */
const video            = document.getElementById('cameraPreview');
const textInput        = document.getElementById('textInput');
const scrollingText    = document.getElementById('scrollingText');
const fontSizeInput    = document.getElementById('fontSize');
const fontSizeDisplay  = document.getElementById('fontSizeDisplay');
const fontColorInput   = document.getElementById('fontColor');
const scrollSpeedInput = document.getElementById('scrollSpeed');
const speedDisplay     = document.getElementById('speedDisplay');
const estimatedTime    = document.getElementById('estimatedTime');
const textWrapper      = document.getElementById('textWrapper');
const prompterContainer= document.getElementById('prompterContainer');
const prompterWindow   = document.getElementById('prompterWindow');
const dragHandle       = document.getElementById('dragHandle');
const resizeHandle     = document.getElementById('resizeHandle');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber  = document.getElementById('countdownNumber');
const countdownTimeInput = document.getElementById('countdownTime');
const downloadContainer  = document.getElementById('downloadContainer');
const downloadLink       = document.getElementById('downloadLink');
const settingsDrawer   = document.getElementById('settingsDrawer');
const btnOpenSettings  = document.getElementById('btnOpenSettings');
const btnBottomSettings= document.getElementById('btnBottomSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnRecord        = document.getElementById('btnRecord');
const btnFlip          = document.getElementById('btnFlip');
const btnRotLeft       = document.getElementById('btnRotLeft');
const btnRotRight      = document.getElementById('btnRotRight');
const btnPortrait      = document.getElementById('btnPortrait');

/* ===== 相機 ===== */
let mediaStream  = null;
let facingMode   = 'user'; // 'user' = 前鏡, 'environment' = 後鏡

async function initCamera(facing = 'user') {
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); }
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        video.srcObject = mediaStream;
    } catch (err) {
        alert('無法啟動相機，請確認已授權權限並在 HTTPS 環境下運行。\n' + err);
    }
}
initCamera(facingMode);

btnFlip.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    initCamera(facingMode);
});

/* ===== 設定抽屜 ===== */
function openSettings()  { settingsDrawer.classList.add('open'); }
function closeSettings() { settingsDrawer.classList.remove('open'); }

btnOpenSettings.addEventListener('click',   openSettings);
btnBottomSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click',  closeSettings);

// 點抽屜以外區域關閉
window.addEventListener('pointerdown', (e) => {
    if (settingsDrawer.classList.contains('open') &&
        !settingsDrawer.contains(e.target) &&
        e.target !== btnOpenSettings &&
        e.target !== btnBottomSettings) {
        closeSettings();
    }
});

/* ===== 設定控制 ===== */
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value || '請先點右上角 ⚙ 輸入提示詞…';
    calcEstimate();
});

fontSizeInput.addEventListener('input', (e) => {
    fontSizeDisplay.innerText = e.target.value;
    scrollingText.style.fontSize = e.target.value + 'px';
    calcEstimate();
});

fontColorInput.addEventListener('input', (e) => {
    scrollingText.style.color = e.target.value;
});

scrollSpeedInput.addEventListener('input', (e) => {
    speedDisplay.innerText = e.target.value;
    calcEstimate();
});

/* ===== 預計時長計算 ===== */
function calcEstimate() {
    if (!textInput.value.trim()) { estimatedTime.innerText = '0.0 秒'; return; }
    const containerH  = prompterContainer.clientHeight;
    const textH       = scrollingText.scrollHeight;
    const totalDist   = containerH + textH;
    const pxPerFrame  = parseFloat(scrollSpeedInput.value) / 20;
    const pxPerSec    = pxPerFrame * 60;
    estimatedTime.innerText = (totalDist / pxPerSec).toFixed(1) + ' 秒';
}
new ResizeObserver(calcEstimate).observe(prompterContainer);

/* ===== 文字旋轉 ===== */
let currentRotation = 0;
function applyRotation() {
    textWrapper.style.transform = `rotate(${currentRotation}deg)`;
    calcEstimate();
}
btnRotLeft.addEventListener('click',  () => { currentRotation = -90; applyRotation(); });
btnRotRight.addEventListener('click', () => { currentRotation =  90; applyRotation(); });
btnPortrait.addEventListener('click', () => { currentRotation =   0; applyRotation(); });

/* ===== 提示詞滾動 ===== */
let scrollY = 0;
let isScrolling = false;
let animId = null;

function startScrolling() {
    scrollY = prompterContainer.clientHeight;
    isScrolling = true;
    function tick() {
        if (!isScrolling) return;
        scrollY -= parseFloat(scrollSpeedInput.value) / 20;
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
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

btnRecord.addEventListener('click', () => {
    if (isRecording) { stopRecording(); return; }
    startCountdown();
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
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
    } catch (e) {
        alert('此設備不支援錄影功能'); return;
    }

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

/* ===== 拖拽浮窗（Touch + Mouse） ===== */
function getClient(e) {
    return e.touches ? e.touches[0] : e;
}

function clampWindow() {
    const W = window.innerWidth,  H = window.innerHeight;
    const pw = prompterWindow;    const bh = 100; // bottomBar 高
    const rect = pw.getBoundingClientRect();
    let l = rect.left, t = rect.top;
    // 不超出邊界
    l = Math.max(0, Math.min(l, W - rect.width));
    t = Math.max(0, Math.min(t, H - rect.height - bh));
    pw.style.left      = l + 'px';
    pw.style.top       = t + 'px';
    pw.style.transform = 'none';
}

// 拖拽
let drag = false, dragSX, dragSY, dragL0, dragT0;
dragHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragHandle.setPointerCapture(e.pointerId);
    const rect = prompterWindow.getBoundingClientRect();
    drag  = true;
    dragSX = e.clientX; dragSY = e.clientY;
    dragL0 = rect.left; dragT0 = rect.top;
    prompterWindow.style.transform = 'none';
});
dragHandle.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();
    const W = window.innerWidth, H = window.innerHeight;
    const pw = prompterWindow;
    const bh = 100;
    let newL = dragL0 + (e.clientX - dragSX);
    let newT = dragT0 + (e.clientY - dragSY);
    newL = Math.max(0, Math.min(newL, W - pw.offsetWidth));
    newT = Math.max(0, Math.min(newT, H - pw.offsetHeight - bh));
    pw.style.left = newL + 'px';
    pw.style.top  = newT + 'px';
});
dragHandle.addEventListener('pointerup',   () => { drag = false; });
dragHandle.addEventListener('pointercancel', () => { drag = false; });

// 縮放
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
    const W  = window.innerWidth, H = window.innerHeight;
    const bh = 100;
    const rect = prompterWindow.getBoundingClientRect();
    const maxW = W - rect.left;
    const maxH = H - rect.top - bh;
    const newW = Math.max(160, Math.min(resW0 + (e.clientX - resSX), maxW));
    const newH = Math.max(120, Math.min(resH0 + (e.clientY - resSY), maxH));
    prompterWindow.style.width  = newW + 'px';
    prompterWindow.style.height = newH + 'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => { resize = false; });
resizeHandle.addEventListener('pointercancel', () => { resize = false; });

// 初始置中並確保不超出
window.addEventListener('load', clampWindow);
window.addEventListener('resize', clampWindow);
