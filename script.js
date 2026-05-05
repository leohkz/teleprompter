/* ===== i18n ===== */
const I18N = {
    'zh-TW': {
        settings: '設  定', language: '語言',
        scriptLabel: '提示詞內容', scriptPlaceholder: '請在此輸入您的提示詞...',
        estDuration: '預計影片時長', wpmLabel: '語速 (WPM)',
        fontSizeLabel: '字體大小', fontColorLabel: '文字顏色',
        countdownLabel: '錄影倒計時', rotationLabel: '旋轉方向',
        downloadBtn: '下載影片', fontShort: '字',
        camErr: '無法啟動相機，請確認授權並在 HTTPS 下運行。',
        noCamera: '相機未就緒', noRecord: '此設備不支援錄影功能',
        prompterHint: '點右上角 ⚙ 輸入提示詞',
    },
    'zh-CN': {
        settings: '设  置', language: '语言',
        scriptLabel: '提示词内容', scriptPlaceholder: '请在此输入您的提示词...',
        estDuration: '预计视频时长', wpmLabel: '语速 (WPM)',
        fontSizeLabel: '字体大小', fontColorLabel: '文字颜色',
        countdownLabel: '录制倒计时', rotationLabel: '旋转方向',
        downloadBtn: '下载视频', fontShort: '字',
        camErr: '无法启动摄像头，请确认授权并在 HTTPS 下运行。',
        noCamera: '摄像头未就绪', noRecord: '此设备不支持录制功能',
        prompterHint: '点右上角 ⚙ 输入提示词',
    },
    'en': {
        settings: 'SETTINGS', language: 'Language',
        scriptLabel: 'Script', scriptPlaceholder: 'Enter your script here...',
        estDuration: 'Est. Duration', wpmLabel: 'Speed (WPM)',
        fontSizeLabel: 'Font Size', fontColorLabel: 'Text Color',
        countdownLabel: 'Countdown', rotationLabel: 'Rotation',
        downloadBtn: 'Download Video', fontShort: 'Sz',
        camErr: 'Cannot start camera. Please allow access and use HTTPS.',
        noCamera: 'Camera not ready', noRecord: 'Recording not supported on this device',
        prompterHint: 'Tap ⚙ top-right to enter script',
    }
};

function detectLang() {
    const s = (navigator.language || 'en').toLowerCase();
    if (s.startsWith('zh'))
        return (s.includes('tw')||s.includes('hk')||s.includes('mo')||s.includes('hant')) ? 'zh-TW' : 'zh-CN';
    return 'en';
}
let currentLang = detectLang();
function t(k) { return (I18N[currentLang]||I18N['en'])[k] || k; }

/* ===== DOM refs ===== */
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
const countdownSlider   = document.getElementById('countdownSlider');
const countdownDisplay  = document.getElementById('countdownDisplay');
const downloadContainer = document.getElementById('downloadContainer');
const downloadLink      = document.getElementById('downloadLink');
const settingsDrawer    = document.getElementById('settingsDrawer');
const btnOpenSettings   = document.getElementById('btnOpenSettings');
const btnCloseSettings  = document.getElementById('btnCloseSettings');
const btnBottomSettings = document.getElementById('btnBottomSettings');
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

/* ===== i18n apply ===== */
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-ph')));
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
    if (!textInput.value.trim()) scrollingText.innerText = t('prompterHint');
    calcEstimate();
}
document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); currentLang = btn.dataset.lang; applyI18n(); });
});

/* ===== Camera ===== */
let mediaStream = null, facingMode = 'user', isMirror = true;
async function initCamera(facing) {
    if (mediaStream) mediaStream.getTracks().forEach(tr => tr.stop());
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width:{ideal:1280}, height:{ideal:720} }, audio: true
        });
        video.srcObject = mediaStream;
    } catch(err) { alert(t('camErr')+'\n'+err); }
}
initCamera(facingMode);
video.classList.toggle('mirror-off', !isMirror);
btnFlip.addEventListener('click', () => { facingMode = facingMode==='user'?'environment':'user'; initCamera(facingMode); });
btnMirror.addEventListener('click', () => {
    isMirror = !isMirror;
    video.classList.toggle('mirror-off', !isMirror);
    btnMirror.classList.toggle('mirror-active', isMirror);
});

/* ===== Settings drawer ===== */
const openSettings  = () => settingsDrawer.classList.add('open');
const closeSettings = () => settingsDrawer.classList.remove('open');
btnOpenSettings.addEventListener('click',   e => { e.stopPropagation(); openSettings(); });
btnCloseSettings.addEventListener('click',  e => { e.stopPropagation(); closeSettings(); });
btnBottomSettings.addEventListener('click', e => { e.stopPropagation(); openSettings(); });
window.addEventListener('pointerdown', e => {
    if (!settingsDrawer.classList.contains('open')) return;
    if (!settingsDrawer.contains(e.target) &&
        !btnOpenSettings.contains(e.target) &&
        !btnBottomSettings.contains(e.target)) closeSettings();
});

/* ===== Countdown slider ===== */
countdownSlider.addEventListener('input', () => { countdownDisplay.innerText = countdownSlider.value; });

/* ===== WPM sync ===== */
function syncWPM(val) {
    val = Math.max(30, Math.min(400, Math.round(+val)));
    scrollSpeedInput.value = val; speedDisplay.innerText = val; wpmDisplay.innerText = val;
    calcEstimate();
}
scrollSpeedInput.addEventListener('input', () => syncWPM(scrollSpeedInput.value));
wpmDown.addEventListener('click', () => syncWPM(+scrollSpeedInput.value - 10));
wpmUp.addEventListener('click',   () => syncWPM(+scrollSpeedInput.value + 10));

/* ===== Font size sync ===== */
function syncFS(val) {
    val = Math.max(16, Math.min(100, Math.round(+val)));
    fontSizeInput.value = val; fontSizeDisplay.innerText = val; fsDisplay.innerText = val;
    scrollingText.style.fontSize = val + 'px';
    calcEstimate();
}
fontSizeInput.addEventListener('input', () => syncFS(fontSizeInput.value));
fsDown.addEventListener('click', () => syncFS(+fontSizeInput.value - 2));
fsUp.addEventListener('click',   () => syncFS(+fontSizeInput.value + 2));

/* ===== Font color ===== */
fontColorInput.addEventListener('input', () => { scrollingText.style.color = fontColorInput.value; });

/* ===== Text input ===== */
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value.trim() ? textInput.value : t('prompterHint');
    resetPrompter();
    calcEstimate();
});

/* ===== Duration estimate (mm:ss) ===== */
function countUnits(text) {
    return (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)||[]).length +
           (text.match(/[a-zA-Z0-9]+/g)||[]).length;
}
function fmtDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    if (m === 0) return s + ' s';
    return m + ':' + String(s).padStart(2,'0');
}
function calcEstimate() {
    const text = textInput.value.trim();
    if (!text) { estimatedTimeEl.innerText = '0:00'; return; }
    const secs = (countUnits(text) / (+scrollSpeedInput.value || 120)) * 60;
    estimatedTimeEl.innerText = fmtDuration(secs);
}

/* ===== Rotation ===== */
let rot = 0;
btnRotLeft.addEventListener('click',  () => { rot = -90; textWrapper.style.transform = `rotate(${rot}deg)`; });
btnRotRight.addEventListener('click', () => { rot =  90; textWrapper.style.transform = `rotate(${rot}deg)`; });
btnPortrait.addEventListener('click', () => { rot =   0; textWrapper.style.transform = `rotate(${rot}deg)`; });

/* ===== Scroll logic =====
 *
 * 改用 translateY 控制滾動，不再用 absolute top
 * 初始 translateY(0) = 頂部對齊
 *
 * 速度公式：
 *   中文字寬 ≈ fontSize px
 *   每行字數 = floor(containerWidth / fontSize)
 *   每行顯示時間(s) = charsPerLine / (WPM/60)
 *   每秒滾動 px = lineHeight / 每行顯示時間
 */
let scrollOffset = 0;   // px, positive = scrolled down
let isScrolling  = false;
let animId       = null;
let lastTS       = null;

function getPxPerSec() {
    const wpm   = +scrollSpeedInput.value || 120;
    const fs    = +fontSizeInput.value    || 30;
    const lineH = fs * 1.55;
    const contW = prompterContainer.clientWidth || 300;
    // 中文字寬約 fs px，若文字為英文取 0.6
    const charsPerLine = Math.max(1, Math.floor(contW / fs));
    // 每分鐘 WPM 個字 => 每秒 WPM/60 個字 => 每秒滾動行數 = (WPM/60)/charsPerLine
    return ((wpm / 60) / charsPerLine) * lineH;
}

function resetPrompter() {
    isScrolling = false;
    cancelAnimationFrame(animId);
    lastTS = null;
    scrollOffset = 0;
    scrollingText.style.transform = 'translateY(0px)';
}

function startScrolling() {
    // 保留現有位置繼續滾動
    isScrolling = true;
    lastTS = null;
    function tick(ts) {
        if (!isScrolling) return;
        if (lastTS === null) lastTS = ts;
        const dt = Math.min((ts - lastTS) / 1000, 0.1); // cap at 100ms
        lastTS = ts;
        scrollOffset += getPxPerSec() * dt;
        scrollingText.style.transform = `translateY(-${scrollOffset}px)`;
        // 完成條件：文字已全部滾出
        if (scrollOffset < scrollingText.scrollHeight + prompterContainer.clientHeight) {
            animId = requestAnimationFrame(tick);
        } else {
            stopRecording();
        }
    }
    animId = requestAnimationFrame(tick);
}

function stopScrolling() {
    isScrolling = false;
    cancelAnimationFrame(animId);
}

/* ===== Recording ===== */
let mediaRecorder = null, recordedChunks = [], isRecording = false;
btnRecord.addEventListener('click', () => { isRecording ? stopRecording() : startCountdown(); });

function startCountdown() {
    let n = +countdownSlider.value || 0;
    if (n <= 0) { startRecording(); return; }
    countdownNumber.innerText = n;
    countdownOverlay.classList.add('active');
    const timer = setInterval(() => {
        if (--n > 0) { countdownNumber.innerText = n; }
        else { clearInterval(timer); countdownOverlay.classList.remove('active'); startRecording(); }
    }, 1000);
}
function startRecording() {
    if (!mediaStream) { alert(t('noCamera')); return; }
    recordedChunks = [];
    try {
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        mediaRecorder = mime ? new MediaRecorder(mediaStream,{mimeType:mime}) : new MediaRecorder(mediaStream);
    } catch(e) { alert(t('noRecord')); return; }
    mediaRecorder.ondataavailable = e => { if (e.data.size>0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        downloadLink.href = URL.createObjectURL(new Blob(recordedChunks,{type:'video/mp4'}));
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

/* ===== Drag ===== */
let drag=false, dragSX, dragSY, dragL0, dragT0;
dragHandle.addEventListener('pointerdown', e => {
    e.preventDefault(); dragHandle.setPointerCapture(e.pointerId);
    const r = prompterWindow.getBoundingClientRect();
    drag=true; dragSX=e.clientX; dragSY=e.clientY; dragL0=r.left; dragT0=r.top;
    prompterWindow.style.transform='none';
});
dragHandle.addEventListener('pointermove', e => {
    if (!drag) return; e.preventDefault();
    const BH = document.getElementById('bottomBar').offsetHeight;
    const pw = prompterWindow;
    pw.style.left = Math.max(0,Math.min(dragL0+e.clientX-dragSX, window.innerWidth -pw.offsetWidth )) +'px';
    pw.style.top  = Math.max(0,Math.min(dragT0+e.clientY-dragSY, window.innerHeight-pw.offsetHeight-BH))+'px';
});
dragHandle.addEventListener('pointerup',     () => drag=false);
dragHandle.addEventListener('pointercancel', () => drag=false);

/* ===== Resize ===== */
let resize=false, resSX, resSY, resW0, resH0;
resizeHandle.addEventListener('pointerdown', e => {
    e.preventDefault(); resizeHandle.setPointerCapture(e.pointerId);
    resize=true; resSX=e.clientX; resSY=e.clientY;
    resW0=prompterWindow.offsetWidth; resH0=prompterWindow.offsetHeight;
    prompterWindow.style.transform='none';
});
resizeHandle.addEventListener('pointermove', e => {
    if (!resize) return; e.preventDefault();
    const BH=document.getElementById('bottomBar').offsetHeight;
    const rect=prompterWindow.getBoundingClientRect();
    prompterWindow.style.width =Math.max(160,Math.min(resW0+e.clientX-resSX, window.innerWidth -rect.left))+'px';
    prompterWindow.style.height=Math.max(120,Math.min(resH0+e.clientY-resSY, window.innerHeight-rect.top-BH))+'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => resize=false);
resizeHandle.addEventListener('pointercancel', () => resize=false);

/* ===== Clamp window ===== */
function clampWindow() {
    const BH=document.getElementById('bottomBar').offsetHeight;
    const pw=prompterWindow; const r=pw.getBoundingClientRect();
    pw.style.left=Math.max(0,Math.min(r.left,window.innerWidth -pw.offsetWidth ))+'px';
    pw.style.top =Math.max(0,Math.min(r.top, window.innerHeight-pw.offsetHeight-BH))+'px';
    pw.style.transform='none';
}
window.addEventListener('load',   clampWindow);
window.addEventListener('resize', () => { clampWindow(); resetPrompter(); });

/* ===== ResizeObserver for container ===== */
new ResizeObserver(() => { calcEstimate(); }).observe(prompterContainer);

/* ===== Init ===== */
applyI18n();
resetPrompter();
