/* ===== i18n ===== */
const I18N = {
    'zh-TW': {
        settings:'\u8a2d  \u5b9a', language:'\u8a9e\u8a00',
        scriptLabel:'\u63d0\u793a\u8a5e', scriptPlaceholder:'\u8acb\u5728\u6b64\u8f38\u5165\u60a8\u7684\u63d0\u793a\u8a5e...',
        estDuration:'\u9810\u8a08\u6642\u9577', wpmLabel:'\u8a9e\u901f (WPM)',
        fontSizeLabel:'\u5b57\u9ad4\u5927\u5c0f', fontColorLabel:'\u6587\u5b57\u984f\u8272',
        countdownLabel:'\u5012\u8a08\u6642', rotationLabel:'\u65cb\u8f49',
        downloadBtn:'\u4e0b\u8f09\u5f71\u7247', fontShort:'\u5b57',
        camErr:'\u7121\u6cd5\u555f\u52d5\u76f8\u6a5f\uff0c\u8acb\u78ba\u8a8d\u6388\u6b0a\u4e26\u5728 HTTPS \u4e0b\u904b\u884c\u3002',
        noCamera:'\u76f8\u6a5f\u672a\u5c31\u7dd2', noRecord:'\u6b64\u8a2d\u5099\u4e0d\u652f\u63f4\u9304\u5f71\u529f\u80fd',
        prompterHint:'\u9ede\u53f3\u4e0a\u89d2 \u2699 \u8f38\u5165\u63d0\u793a\u8a5e',
        rerecordConfirm:'\u4e0a\u4e00\u6b21\u9304\u88fd\u5c07\u88ab\u522a\u9664\uff0c\u78ba\u5b9a\u8981\u91cd\u65b0\u9304\u88fd\uff1f',
        tapToStart:'\u9ede\u64ca\u9304\u5f71\u9215\u555f\u52d5\u76f8\u6a5f',
    },
    'zh-CN': {
        settings:'\u8bbe  \u7f6e', language:'\u8bed\u8a00',
        scriptLabel:'\u63d0\u793a\u8bcd', scriptPlaceholder:'\u8bf7\u5728\u6b64\u8f93\u5165\u60a8\u7684\u63d0\u793a\u8bcd...',
        estDuration:'\u9884\u8ba1\u65f6\u957f', wpmLabel:'\u8bed\u901f (WPM)',
        fontSizeLabel:'\u5b57\u4f53\u5927\u5c0f', fontColorLabel:'\u6587\u5b57\u989c\u8272',
        countdownLabel:'\u5012\u8ba1\u65f6', rotationLabel:'\u65cb\u8f6c',
        downloadBtn:'\u4e0b\u8f7d\u89c6\u9891', fontShort:'\u5b57',
        camErr:'\u65e0\u6cd5\u542f\u52a8\u6444\u50cf\u5934\uff0c\u8bf7\u786e\u8ba4\u6388\u6743\u5e76\u5728 HTTPS \u4e0b\u8fd0\u884c\u3002',
        noCamera:'\u6444\u50cf\u5934\u672a\u5c31\u7eea', noRecord:'\u6b64\u8bbe\u5907\u4e0d\u652f\u6301\u5f55\u5236\u529f\u80fd',
        prompterHint:'\u70b9\u53f3\u4e0a\u89d2 \u2699 \u8f93\u5165\u63d0\u793a\u8bcd',
        rerecordConfirm:'\u4e0a\u6b21\u5f55\u5236\u5c06\u88ab\u5220\u9664\uff0c\u786e\u5b9a\u8981\u91cd\u65b0\u5f55\u5236\uff1f',
        tapToStart:'\u70b9\u51fb\u5f55\u5f71\u952e\u542f\u52a8\u6444\u50cf\u5934',
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
        prompterHint:'Tap \u2699 to enter your script',
        rerecordConfirm:'The previous recording will be deleted. Start a new recording?',
        tapToStart:'Tap record button to start camera',
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

/* ===== \u72c0\u614b\u8b8a\u91cf ===== */
let mediaStream = null, facingMode = 'user', isMirror = true, rot = 0;
let cameraReady = false;
let windowMoved = false;
// \u5f85\u91cd\u9304\u6a19\u8a18\uff1a\u505c\u6b62\u9304\u5f71\u5f8c\u82e5\u70ba true\uff0c\u5247\u5728 onstop \u88e1\u81ea\u52d5\u958b\u59cb\u65b0\u4e00\u8f2a\u5012\u6578
let pendingRerecord = false;

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
            isMirror,
            facingMode,
            rot
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

/* ===== i18n apply ===== */
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-ph')));
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
    if (!textInput.value.trim()) scrollingText.innerText = t('prompterHint');
    if (cameraHint && !cameraReady) cameraHint.innerText = t('tapToStart');
    calcEstimate();
}
document.querySelectorAll('.seg-btn').forEach(btn =>
    btn.addEventListener('click', e => {
        e.stopPropagation();
        currentLang = btn.dataset.lang;
        applyI18n();
        saveSettings();
    })
);

/* ===== Camera ===== */
async function initCamera(facing) {
    // \u5148\u505c\u6b62\u820a stream
    if (mediaStream) {
        mediaStream.getTracks().forEach(tr => tr.stop());
        mediaStream = null;
    }
    video.srcObject = null;
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        video.srcObject = mediaStream;
        // \u7b49 video \u771f\u6b63\u64ad\u653e\u5f8c\u624d\u6a19\u8a18 ready\uff0c\u907f\u514d\u6388\u6b0a\u5f8c\u7684 resize repaint \u5c0e\u81f4 UI \u554f\u984c
        await new Promise(resolve => {
            video.onloadedmetadata = () => { video.play().then(resolve).catch(resolve); };
            // \u5df2\u7d93\u6709\u5167\u5bb9\u5247\u76f4\u63a5 resolve
            if (video.readyState >= 2) resolve();
        });
        cameraReady = true;
        if (cameraHint) cameraHint.style.display = 'none';
    } catch(err) {
        cameraReady = false;
        alert(t('camErr') + '\n' + err);
    }
}
btnFlip.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    if (cameraReady) initCamera(facingMode);
    saveSettings();
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
countdownSlider.addEventListener('input', () => {
    countdownDisplay.innerText = countdownSlider.value;
    saveSettings();
});

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
fontColorInput.addEventListener('input', () => {
    scrollingText.style.color = fontColorInput.value;
    saveSettings();
});

/* ===== Text input ===== */
textInput.addEventListener('input', () => {
    scrollingText.innerText = textInput.value.trim() ? textInput.value : t('prompterHint');
    resetPrompter();
    calcEstimate();
    saveSettings();
});

/* ===== Duration estimate ===== */
function countUnits(text) {
    return (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff60\u3000-\u303f]/g)||[]).length +
           (text.match(/[a-zA-Z0-9]+/g)||[]).length;
}
function fmtDuration(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = Math.round(totalSecs % 60);
    return m > 0 ? m + ':' + String(s).padStart(2,'0') : s + ' s';
}
function calcEstimate() {
    const text = textInput.value.trim();
    if (!text) { estimatedTimeEl.innerText = '0:00'; return; }
    const secs = (countUnits(text) / (+scrollSpeedInput.value || 120)) * 60;
    estimatedTimeEl.innerText = fmtDuration(secs);
}

/* ===== Rotation ===== */
btnRotLeft.addEventListener('click',  () => { rot = -90; scrollingText.style.transform = `translateY(0) rotate(${rot}deg)`; saveSettings(); });
btnRotRight.addEventListener('click', () => { rot =  90; scrollingText.style.transform = `translateY(0) rotate(${rot}deg)`; saveSettings(); });
btnPortrait.addEventListener('click', () => { rot =   0; resetPrompter(); saveSettings(); });

/* ===== Scroll ===== */
let scrollOffset = 0, isScrolling = false, animId = null, lastTS = null;

function getPxPerSec() {
    const wpm   = +scrollSpeedInput.value || 120;
    const fs    = +fontSizeInput.value    || 30;
    const lineH = fs * 1.55;
    const contW = prompterContainer.clientWidth || 300;
    const charsPerLine = Math.max(1, Math.floor(contW / fs));
    return (wpm / charsPerLine * lineH) / 60;
}

function resetPrompter() {
    isScrolling = false;
    cancelAnimationFrame(animId);
    lastTS = null; scrollOffset = 0;
    scrollingText.style.transform = rot !== 0 ? `translateY(0px) rotate(${rot}deg)` : 'translateY(0px)';
}

function startScrolling() {
    isScrolling = true; lastTS = null;
    function tick(ts) {
        if (!isScrolling) return;
        if (!lastTS) lastTS = ts;
        const dt = Math.min((ts - lastTS) / 1000, 0.1);
        lastTS = ts;
        scrollOffset += getPxPerSec() * dt;
        scrollingText.style.transform = `translateY(-${scrollOffset}px)`;
        if (scrollOffset < scrollingText.scrollHeight + prompterContainer.clientHeight)
            animId = requestAnimationFrame(tick);
        else stopRecording();
    }
    animId = requestAnimationFrame(tick);
}

function stopScrolling() {
    isScrolling = false;
    cancelAnimationFrame(animId);
}

/* ===== Recording ===== */
let mediaRecorder = null, recordedChunks = [], isRecording = false;

btnRecord.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else if (recordedChunks.length > 0) {
        if (confirm(t('rerecordConfirm'))) {
            downloadContainer.style.display = 'none';
            if (downloadLink.href && downloadLink.href !== '#') {
                URL.revokeObjectURL(downloadLink.href);
                downloadLink.href = '#';
            }
            resetPrompter();
            // \u91cd\u9304\u6642\u5fc5\u9808\u91cd\u65b0\u53d6\u5f97\u65b0\u7684 MediaStream\uff0c\u907f\u514d\u820a stream \u5c0e\u81f4 freeze
            recordedChunks = [];
            pendingRerecord = true;
            // \u91cd\u65b0 initCamera \u53d6\u5f97\u5168\u65b0 stream\uff0c\u5b8c\u6210\u5f8c\u958b\u59cb\u5012\u6578
            initCamera(facingMode).then(() => {
                if (cameraReady) startCountdown();
            });
        }
    } else {
        startWithCamera();
    }
});

async function startWithCamera() {
    if (!cameraReady) {
        await initCamera(facingMode);
        if (!cameraReady) return;
    }
    startCountdown();
}

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

function startRecording() {
    if (!mediaStream) { alert(t('noCamera')); return; }
    recordedChunks = [];
    try {
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        mediaRecorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);
    } catch(e) { alert(t('noRecord')); return; }
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        if (pendingRerecord) {
            pendingRerecord = false;
            return; // \u91cd\u9304\u6d41\u7a0b\u5df2\u7531 btnRecord \u8655\u7406\uff0c\u4e0d\u8f38\u51fa\u4e0b\u8f09
        }
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
    prompterWindow.style.left = r.left + 'px';
    prompterWindow.style.top  = r.top  + 'px';
    prompterWindow.style.transform = 'none';
    windowMoved = true;
    drag = true; dragSX = e.clientX; dragSY = e.clientY; dragL0 = r.left; dragT0 = r.top;
});
dragHandle.addEventListener('pointermove', e => {
    if (!drag) return; e.preventDefault();
    const BH = document.getElementById('bottomBar').offsetHeight;
    const pw = prompterWindow;
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
        prompterWindow.style.left = r.left + 'px';
        prompterWindow.style.top  = r.top  + 'px';
        prompterWindow.style.transform = 'none';
        windowMoved = true;
    }
    resize = true; resSX = e.clientX; resSY = e.clientY;
    resW0 = prompterWindow.offsetWidth; resH0 = prompterWindow.offsetHeight;
});
resizeHandle.addEventListener('pointermove', e => {
    if (!resize) return; e.preventDefault();
    const BH   = document.getElementById('bottomBar').offsetHeight;
    const rect = prompterWindow.getBoundingClientRect();
    prompterWindow.style.width  = Math.max(160, Math.min(resW0 + e.clientX - resSX, window.innerWidth  - rect.left)) + 'px';
    prompterWindow.style.height = Math.max(100, Math.min(resH0 + e.clientY - resSY, window.innerHeight - rect.top - BH)) + 'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => resize = false);
resizeHandle.addEventListener('pointercancel', () => resize = false);

/* ===== Clamp ===== */
function clampWindow() {
    if (!windowMoved) return;
    const BH = document.getElementById('bottomBar').offsetHeight;
    const pw = prompterWindow;
    const r  = pw.getBoundingClientRect();
    pw.style.left = Math.max(0, Math.min(r.left, window.innerWidth  - pw.offsetWidth))  + 'px';
    pw.style.top  = Math.max(0, Math.min(r.top,  window.innerHeight - pw.offsetHeight - BH)) + 'px';
}
window.addEventListener('resize', () => { clampWindow(); resetPrompter(); });
new ResizeObserver(() => calcEstimate()).observe(prompterContainer);

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
