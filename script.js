/* ===== i18n ===== */
const I18N = {
    'zh-TW': {
        settings:'設  定', language:'語言',
        scriptLabel:'提示詞', scriptPlaceholder:'請在此輸入您的提示詞...',
        estDuration:'預計時長', wpmLabel:'語速 (WPM)',
        fontSizeLabel:'字體大小', fontColorLabel:'文字顏色',
        countdownLabel:'倒計時', rotationLabel:'旋轉',
        downloadBtn:'下載影片', fontShort:'字',
        camErr:'無法啟動相機，請確認授權並在 HTTPS 下運行。',
        noCamera:'相機未就緒', noRecord:'此設備不支援錄影功能',
        prompterHint:'點右上角 ⚙ 輸入提示詞',
        rerecordConfirm:'上一次錄製將被刪除，確定要重新錄製？',
        tapToStart:'點擊錄影鈕開始錄製',
    },
    'zh-CN': {
        settings:'设  置', language:'语言',
        scriptLabel:'提示词', scriptPlaceholder:'请在此输入您的提示词...',
        estDuration:'预计时长', wpmLabel:'语速 (WPM)',
        fontSizeLabel:'字体大小', fontColorLabel:'文字颜色',
        countdownLabel:'倒计时', rotationLabel:'旋转',
        downloadBtn:'下载视频', fontShort:'字',
        camErr:'无法启动摄像头，请确认授权并在 HTTPS 下运行。',
        noCamera:'摄像头未就绪', noRecord:'此设备不支持录制功能',
        prompterHint:'点右上角 ⚙ 输入提示词',
        rerecordConfirm:'上次录制将被删除，确定要重新录制？',
        tapToStart:'点击录影键开始录制',
    },
    'en': {
        settings:'SETTINGS', language:'Language',
        scriptLabel:'Script', scriptPlaceholder:'Enter your script here...',
        estDuration:'Est. Duration', wpmLabel:'Speed (WPM)',
        fontSizeLabel:'Font Size', fontColorLabel:'Text Color',
        countdownLabel:'Countdown', rotationLabel:'Rotation',
        downloadBtn:'Download Video', fontShort:'Sz',
        camErr:'Cannot start camera. Please allow access and use HTTPS.',
        noCamera:'Camera not ready', noRecord:'Recording not supported on this device',
        prompterHint:'Tap ⚙ to enter your script',
        rerecordConfirm:'The previous recording will be deleted. Start a new recording?',
        tapToStart:'Tap record to start',
    }
};
function detectLang() {
    const s = (navigator.language||'en').toLowerCase();
    if (s.startsWith('zh'))
        return (s.includes('tw')||s.includes('hk')||s.includes('mo')||s.includes('hant')) ? 'zh-TW' : 'zh-CN';
    return 'en';
}
let currentLang = detectLang();
function t(k) { return (I18N[currentLang]||I18N['en'])[k]||k; }

/* ===== state ===== */
let videoStream = null;  // video-only, for preview
let audioStream = null;  // audio-only, for recording
let facingMode = 'user', isMirror = true, rot = 0;
let windowMoved = false;

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
const estimatedTimeEl   = document.getElementById('estimatedTime');
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
const btnRecord         = document.getElementById('btnRecord');
const btnFlip           = document.getElementById('btnFlip');
const btnMirror         = document.getElementById('btnMirror');
const btnRotLeft        = document.getElementById('btnRotLeft');
const btnRotRight       = document.getElementById('btnRotRight');
const btnPortrait       = document.getElementById('btnPortrait');
const wpmDown           = document.getElementById('wpmDown');
const wpmUp             = document.getElementById('wpmUp');
const cameraHint        = document.getElementById('cameraHint');

/* ===== localStorage ===== */
const STORAGE_KEY = 'teleprompter_v1';
function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            lang: currentLang,
            text: textInput.value,
            wpm: +scrollSpeedInput.value,
            fontSize: +fontSizeInput.value,
            fontColor: fontColorInput.value,
            countdown: +countdownSlider.value,
            isMirror, facingMode, rot
        }));
    } catch(e) {}
}
function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.lang) currentLang = s.lang;
        if (typeof s.text === 'string') textInput.value = s.text;
        if (s.wpm)  scrollSpeedInput.value = s.wpm;
        if (s.fontSize) fontSizeInput.value = s.fontSize;
        if (s.fontColor) fontColorInput.value = s.fontColor;
        if (typeof s.countdown === 'number') countdownSlider.value = s.countdown;
        if (typeof s.isMirror === 'boolean') isMirror = s.isMirror;
        if (s.facingMode) facingMode = s.facingMode;
        if (typeof s.rot === 'number') rot = s.rot;
    } catch(e) {}
}

/* ===== i18n ===== */
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-ph')));
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
    if (!textInput.value.trim()) scrollingText.innerText = t('prompterHint');
    calcEstimate();
}
document.querySelectorAll('.seg-btn').forEach(btn =>
    btn.addEventListener('click', e => {
        e.stopPropagation(); currentLang = btn.dataset.lang; applyI18n(); saveSettings();
    })
);

/* ===== Camera (video-only preview) ===== */
async function initCamera(facing) {
    if (videoStream) { videoStream.getTracks().forEach(tr => tr.stop()); videoStream = null; }
    video.srcObject = null;
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = videoStream;
        if (cameraHint) cameraHint.style.display = 'none';
    } catch(err) {
        alert(t('camErr') + '\n' + err);
    }
}

/* ===== Audio (requested once on first record) ===== */
async function initAudio() {
    if (audioStream) return;
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch(err) {
        console.warn('Audio unavailable:', err);
    }
}

btnFlip.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    initCamera(facingMode); saveSettings();
});
btnMirror.addEventListener('click', () => {
    isMirror = !isMirror;
    video.classList.toggle('mirror-off', !isMirror);
    btnMirror.classList.toggle('mirror-active', isMirror);
    saveSettings();
});

/* ===== Settings ===== */
const openSettings  = () => settingsDrawer.classList.add('open');
const closeSettings = () => settingsDrawer.classList.remove('open');
btnOpenSettings.addEventListener('click',  e => { e.stopPropagation(); openSettings(); });
btnCloseSettings.addEventListener('click', e => { e.stopPropagation(); closeSettings(); });
window.addEventListener('pointerdown', e => {
    if (!settingsDrawer.classList.contains('open')) return;
    if (!settingsDrawer.contains(e.target) && !btnOpenSettings.contains(e.target)) closeSettings();
});

/* ===== Countdown slider ===== */
countdownSlider.addEventListener('input', () => { countdownDisplay.innerText = countdownSlider.value; saveSettings(); });

/* ===== WPM ===== */
function syncWPM(val) {
    val = Math.max(30, Math.min(400, Math.round(+val)));
    scrollSpeedInput.value = speedDisplay.innerText = wpmDisplay.innerText = val;
    calcEstimate();
}
scrollSpeedInput.addEventListener('input', () => { syncWPM(scrollSpeedInput.value); saveSettings(); });
wpmDown.addEventListener('click', () => { syncWPM(+scrollSpeedInput.value - 10); saveSettings(); });
wpmUp.addEventListener('click',   () => { syncWPM(+scrollSpeedInput.value + 10); saveSettings(); });

/* ===== Font size ===== */
function syncFS(val) {
    val = Math.max(16, Math.min(100, Math.round(+val)));
    fontSizeInput.value = fontSizeDisplay.innerText = val;
    scrollingText.style.fontSize = val + 'px';
    calcEstimate();
}
fontSizeInput.addEventListener('input', () => { syncFS(fontSizeInput.value); saveSettings(); });

/* ===== Font color ===== */
fontColorInput.addEventListener('input', () => { scrollingText.style.color = fontColorInput.value; saveSettings(); });

/* ===== Text input ===== */
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value.trim() ? textInput.value : t('prompterHint');
    resetPrompter(); calcEstimate(); saveSettings();
});

/* ===== Duration estimate ===== */
function countUnits(text) {
    return (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff60\u3000-\u303f]/g)||[]).length +
           (text.match(/[a-zA-Z0-9]+/g)||[]).length;
}
function fmtDuration(totalSecs) {
    const m = Math.floor(totalSecs / 60), s = Math.round(totalSecs % 60);
    return m > 0 ? m + ':' + String(s).padStart(2,'0') : s + ' s';
}
function calcEstimate() {
    const text = textInput.value.trim();
    if (!text) { estimatedTimeEl.innerText = '0:00'; return; }
    estimatedTimeEl.innerText = fmtDuration((countUnits(text) / (+scrollSpeedInput.value || 120)) * 60);
}

/* ===== Rotation ===== */
btnRotLeft.addEventListener('click',  () => { rot = -90; scrollingText.style.transform = `translateY(0) rotate(${rot}deg)`; saveSettings(); });
btnRotRight.addEventListener('click', () => { rot =  90; scrollingText.style.transform = `translateY(0) rotate(${rot}deg)`; saveSettings(); });
btnPortrait.addEventListener('click', () => { rot =   0; resetPrompter(); saveSettings(); });

/* ===== Scroll ===== */
let scrollOffset = 0, isScrolling = false, animId = null, lastTS = null;
function getPxPerSec() {
    const wpm = +scrollSpeedInput.value || 120, fs = +fontSizeInput.value || 30;
    const lineH = fs * 1.55, contW = prompterContainer.clientWidth || 300;
    return (wpm / Math.max(1, Math.floor(contW / fs)) * lineH) / 60;
}
function resetPrompter() {
    isScrolling = false; cancelAnimationFrame(animId);
    lastTS = null; scrollOffset = 0;
    scrollingText.style.transform = rot !== 0 ? `translateY(0px) rotate(${rot}deg)` : 'translateY(0px)';
}
function startScrolling() {
    isScrolling = true; lastTS = null;
    function tick(ts) {
        if (!isScrolling) return;
        if (!lastTS) lastTS = ts;
        const dt = Math.min((ts - lastTS) / 1000, 0.1); lastTS = ts;
        scrollOffset += getPxPerSec() * dt;
        scrollingText.style.transform = `translateY(-${scrollOffset}px)`;
        if (scrollOffset < scrollingText.scrollHeight + prompterContainer.clientHeight)
            animId = requestAnimationFrame(tick);
        else stopRecording();
    }
    animId = requestAnimationFrame(tick);
}
function stopScrolling() { isScrolling = false; cancelAnimationFrame(animId); }

/* ===== Recording ===== */
let mediaRecorder = null, recordedChunks = [], isRecording = false;

btnRecord.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else if (recordedChunks.length > 0) {
        if (confirm(t('rerecordConfirm'))) {
            recordedChunks = [];
            downloadContainer.style.display = 'none';
            if (downloadLink.href && downloadLink.href !== '#') {
                URL.revokeObjectURL(downloadLink.href);
                downloadLink.href = '#';
            }
            audioStream = null;
            resetPrompter();
            initCamera(facingMode).then(() => startCountdown());
        }
    } else {
        startCountdown();
    }
});

function startCountdown() {
    let n = +countdownSlider.value || 0;
    if (n <= 0) { startRecording(); return; }
    countdownNumber.innerText = n;
    countdownOverlay.classList.add('active');
    const timer = setInterval(() => {
        if (--n > 0) countdownNumber.innerText = n;
        else { clearInterval(timer); countdownOverlay.classList.remove('active'); startRecording(); }
    }, 1000);
}

async function startRecording() {
    if (!videoStream) { alert(t('noCamera')); return; }
    await initAudio();
    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream) tracks.push(...audioStream.getAudioTracks());
    const recStream = new MediaStream(tracks);
    recordedChunks = [];
    try {
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        mediaRecorder = mime ? new MediaRecorder(recStream, { mimeType: mime }) : new MediaRecorder(recStream);
    } catch(e) { alert(t('noRecord')); return; }
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        if (!recordedChunks.length) return;
        downloadLink.href = URL.createObjectURL(new Blob(recordedChunks, { type: 'video/mp4' }));
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
let drag = false, dragSX, dragSY, dragL0, dragT0;
dragHandle.addEventListener('pointerdown', e => {
    e.preventDefault(); dragHandle.setPointerCapture(e.pointerId);
    const r = prompterWindow.getBoundingClientRect();
    prompterWindow.style.left = r.left + 'px'; prompterWindow.style.top = r.top + 'px';
    prompterWindow.style.transform = 'none'; windowMoved = true;
    drag = true; dragSX = e.clientX; dragSY = e.clientY; dragL0 = r.left; dragT0 = r.top;
});
dragHandle.addEventListener('pointermove', e => {
    if (!drag) return; e.preventDefault();
    const BH = document.getElementById('bottomBar').offsetHeight, pw = prompterWindow;
    pw.style.left = Math.max(0, Math.min(dragL0 + e.clientX - dragSX, window.innerWidth  - pw.offsetWidth))  + 'px';
    pw.style.top  = Math.max(0, Math.min(dragT0 + e.clientY - dragSY, window.innerHeight - pw.offsetHeight - BH)) + 'px';
});
dragHandle.addEventListener('pointerup',     () => drag = false);
dragHandle.addEventListener('pointercancel', () => drag = false);

/* ===== Resize ===== */
let resize = false, resSX, resSY, resW0, resH0;
resizeHandle.addEventListener('pointerdown', e => {
    e.preventDefault(); resizeHandle.setPointerCapture(e.pointerId);
    if (!windowMoved) {
        const r = prompterWindow.getBoundingClientRect();
        prompterWindow.style.left = r.left + 'px'; prompterWindow.style.top = r.top + 'px';
        prompterWindow.style.transform = 'none'; windowMoved = true;
    }
    resize = true; resSX = e.clientX; resSY = e.clientY;
    resW0 = prompterWindow.offsetWidth; resH0 = prompterWindow.offsetHeight;
});
resizeHandle.addEventListener('pointermove', e => {
    if (!resize) return; e.preventDefault();
    const BH = document.getElementById('bottomBar').offsetHeight, rect = prompterWindow.getBoundingClientRect();
    prompterWindow.style.width  = Math.max(160, Math.min(resW0 + e.clientX - resSX, window.innerWidth  - rect.left)) + 'px';
    prompterWindow.style.height = Math.max(100, Math.min(resH0 + e.clientY - resSY, window.innerHeight - rect.top - BH)) + 'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => resize = false);
resizeHandle.addEventListener('pointercancel', () => resize = false);

/* ===== Clamp ===== */
function clampWindow() {
    if (!windowMoved) return;
    const BH = document.getElementById('bottomBar').offsetHeight, pw = prompterWindow, r = pw.getBoundingClientRect();
    pw.style.left = Math.max(0, Math.min(r.left, window.innerWidth  - pw.offsetWidth))  + 'px';
    pw.style.top  = Math.max(0, Math.min(r.top,  window.innerHeight - pw.offsetHeight - BH)) + 'px';
}
window.addEventListener('resize', () => { clampWindow(); resetPrompter(); });
new ResizeObserver(() => calcEstimate()).observe(prompterContainer);

/* ===== BFCache fix ===== */
window.addEventListener('pageshow', e => { if (e.persisted) window.location.reload(); });

/* ===== Init ===== */
loadSettings();
applyI18n();
syncWPM(+scrollSpeedInput.value);
syncFS(+fontSizeInput.value);
scrollingText.style.color = fontColorInput.value;
countdownDisplay.innerText = countdownSlider.value;
video.classList.toggle('mirror-off', !isMirror);
btnMirror.classList.toggle('mirror-active', isMirror);
if (rot !== 0) scrollingText.style.transform = `translateY(0) rotate(${rot}deg)`;
resetPrompter();
// 頁面載入即同時請求相機 + 麥克風（只需授權一次，之後自動通過）
Promise.all([
    initCamera(facingMode),
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(s => { audioStream = s; })
        .catch(err => console.warn('Audio permission:', err))
]);
