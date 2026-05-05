/* ===== 國際化 ===== */
const I18N = {
    'zh-TW': {
        settings:          '設  定',
        language:          '語言',
        scriptLabel:       '提示詞內容',
        scriptPlaceholder: '請在此輸入您的提示詞...',
        estDuration:       '預計影片時長',
        wpmLabel:          '語速 (WPM)',
        fontSizeLabel:     '字體大小',
        fontColorLabel:    '文字顏色',
        countdownLabel:    '錄影倒計時',
        rotationLabel:     '旋轉方向',
        downloadBtn:       '下載影片',
        fontShort:         '字',
        camErr:            '無法啟動相機，請確認授權並在 HTTPS 下運行。',
        noCamera:          '相機未就緒',
        noRecord:          '此設備不支援錄影功能',
        prompterHint:      '點右上角 ⚙ 輸入提示詞',
        secUnit:           '秒',
    },
    'zh-CN': {
        settings:          '设  置',
        language:          '语言',
        scriptLabel:       '提示词内容',
        scriptPlaceholder: '请在此输入您的提示词...',
        estDuration:       '预计视频时长',
        wpmLabel:          '语速 (WPM)',
        fontSizeLabel:     '字体大小',
        fontColorLabel:    '文字颜色',
        countdownLabel:    '录制倒计时',
        rotationLabel:     '旋转方向',
        downloadBtn:       '下载视频',
        fontShort:         '字',
        camErr:            '无法启动摄像头，请确认授权并在 HTTPS 下运行。',
        noCamera:          '摄像头未就绪',
        noRecord:          '此设备不支持录制功能',
        prompterHint:      '点右上角 ⚙ 输入提示词',
        secUnit:           '秒',
    },
    'en': {
        settings:          'SETTINGS',
        language:          'Language',
        scriptLabel:       'Script',
        scriptPlaceholder: 'Enter your script here...',
        estDuration:       'Est. Duration',
        wpmLabel:          'Speed (WPM)',
        fontSizeLabel:     'Font Size',
        fontColorLabel:    'Text Color',
        countdownLabel:    'Countdown',
        rotationLabel:     'Rotation',
        downloadBtn:       'Download Video',
        fontShort:         'Sz',
        camErr:            'Cannot start camera. Please allow access and use HTTPS.',
        noCamera:          'Camera not ready',
        noRecord:          'Recording not supported on this device',
        prompterHint:      'Tap ⚙ to enter your script',
        secUnit:           's',
    }
};

function detectLang() {
    const sys = (navigator.language || 'en').toLowerCase();
    if (sys.startsWith('zh')) {
        return (sys.includes('tw') || sys.includes('hk') || sys.includes('mo') || sys.includes('hant'))
            ? 'zh-TW' : 'zh-CN';
    }
    return 'en';
}
let currentLang = detectLang();
function t(key) { return (I18N[currentLang] || I18N['en'])[key] || key; }

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

/* ===== i18n ===== */
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    document.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
    updatePrompterHint();
    calcEstimate();
}

function updatePrompterHint() {
    if (!textInput.value.trim()) {
        scrollingText.innerText = t('prompterHint');
    }
}

document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLang = btn.dataset.lang;
        applyI18n();
    });
});

/* ===== 相機 ===== */
let mediaStream = null;
let facingMode  = 'user';
let isMirror    = true;

async function initCamera(facing) {
    if (mediaStream) mediaStream.getTracks().forEach(tr => tr.stop());
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        video.srcObject = mediaStream;
    } catch (err) {
        alert(t('camErr') + '\n' + err);
    }
}
initCamera(facingMode);
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
btnOpenSettings.addEventListener('click',   (e) => { e.stopPropagation(); openSettings(); });
btnCloseSettings.addEventListener('click',  (e) => { e.stopPropagation(); closeSettings(); });
btnBottomSettings.addEventListener('click', (e) => { e.stopPropagation(); openSettings(); });
window.addEventListener('pointerdown', (e) => {
    if (!settingsDrawer.classList.contains('open')) return;
    if (!settingsDrawer.contains(e.target) &&
        e.target !== btnOpenSettings &&
        !btnOpenSettings.contains(e.target) &&
        e.target !== btnBottomSettings &&
        !btnBottomSettings.contains(e.target)) {
        closeSettings();
    }
});

/* ===== 倒計時滑桿 ===== */
countdownSlider.addEventListener('input', () => {
    countdownDisplay.innerText = countdownSlider.value;
});

/* ===== WPM ===== */
function syncWPM(val) {
    val = Math.max(30, Math.min(400, Math.round(+val)));
    scrollSpeedInput.value = val;
    speedDisplay.innerText = val;
    wpmDisplay.innerText   = val;
    calcEstimate();
}
scrollSpeedInput.addEventListener('input', () => syncWPM(scrollSpeedInput.value));
wpmDown.addEventListener('click', () => syncWPM(+scrollSpeedInput.value - 10));
wpmUp.addEventListener('click',   () => syncWPM(+scrollSpeedInput.value + 10));

/* ===== 字體大小 ===== */
function syncFS(val) {
    val = Math.max(16, Math.min(100, Math.round(+val)));
    fontSizeInput.value           = val;
    fontSizeDisplay.innerText     = val;
    fsDisplay.innerText           = val;
    scrollingText.style.fontSize  = val + 'px';
    calcEstimate();
}
fontSizeInput.addEventListener('input', () => syncFS(fontSizeInput.value));
fsDown.addEventListener('click', () => syncFS(+fontSizeInput.value - 2));
fsUp.addEventListener('click',   () => syncFS(+fontSizeInput.value + 2));

/* ===== 文字顏色 ===== */
fontColorInput.addEventListener('input', () => {
    scrollingText.style.color = fontColorInput.value;
});

/* ===== 提示詞輸入 ===== */
textInput.addEventListener('input', () => {
    if (textInput.value.trim()) {
        scrollingText.innerText = textInput.value;
    } else {
        scrollingText.innerText = t('prompterHint');
    }
    resetPrompter(); // 文字改變時重置到頂部
    calcEstimate();
});

/* ===== 預計時長 ===== */
function countUnits(text) {
    const chinese  = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const engWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;
    return chinese + engWords;
}
function calcEstimate() {
    const text = textInput.value.trim();
    if (!text) { estimatedTimeEl.innerText = '0.0 ' + t('secUnit'); return; }
    const secs = (countUnits(text) / (+scrollSpeedInput.value || 120)) * 60;
    estimatedTimeEl.innerText = secs.toFixed(1) + ' ' + t('secUnit');
}
new ResizeObserver(() => { resetPrompter(); calcEstimate(); }).observe(prompterContainer);

/* ===== 旋轉 ===== */
let currentRotation = 0;
function applyRotation() { textWrapper.style.transform = `rotate(${currentRotation}deg)`; }
btnRotLeft.addEventListener('click',  () => { currentRotation = -90; applyRotation(); });
btnRotRight.addEventListener('click', () => { currentRotation =  90; applyRotation(); });
btnPortrait.addEventListener('click', () => { currentRotation =   0; applyRotation(); });

/* ===== 滾動逻輯 ===== */
//
// 計算公式：
//   WPM = 每分鐘讀的字/詞數
//   每秒字數 = WPM / 60
//   每秒滾動行數 = (每秒字數) / (每行字數)
//   每秒滾動像素 = 每秒滾動行數 * 行高(px)
//
function calcPxPerSecond() {
    const wpm      = +scrollSpeedInput.value || 120;
    const fontSize = +fontSizeInput.value    || 30;
    // 每行字數：展示寬度 / 字寬（中文字寬約為 fontSize * 1.05）
    const contW        = prompterContainer.clientWidth  || 300;
    const charsPerLine = Math.max(1, Math.floor(contW / (fontSize * 1.05)));
    // 行高
    const lineH        = fontSize * 1.55;
    // 每秒字數
    const charsPerSec  = wpm / 60;
    // 每秒滾動像素 = (charsPerSec / charsPerLine) * lineH
    return (charsPerSec / charsPerLine) * lineH;
}

let scrollY = 0, isScrolling = false, animId = null;
let lastTimestamp = null;

/*
 * 提示詞滾動起始位置：第一行就顯示在框內頂部
 * top = 0 表示就定位在頂部
 */
function resetPrompter() {
    isScrolling = false;
    cancelAnimationFrame(animId);
    scrollY = 0;
    scrollingText.style.top = '0px';
}

function startScrolling() {
    // 從現有位置開始滾動（不重置位置，保留實際 top 對應的 px 値）
    scrollY = parseFloat(scrollingText.style.top) || 0;
    isScrolling = true;
    lastTimestamp = null;

    function tick(timestamp) {
        if (!isScrolling) return;
        if (!lastTimestamp) lastTimestamp = timestamp;
        const delta = (timestamp - lastTimestamp) / 1000; // 秒
        lastTimestamp = timestamp;

        scrollY -= calcPxPerSecond() * delta;
        scrollingText.style.top = scrollY + 'px';

        if (scrollY > -scrollingText.scrollHeight) {
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
    // 不重置位置，保留在停止處
}

/* ===== 錄影 ===== */
let mediaRecorder = null, recordedChunks = [], isRecording = false;

btnRecord.addEventListener('click', () => { isRecording ? stopRecording() : startCountdown(); });

function startCountdown() {
    let n = +countdownSlider.value || 0;
    if (n <= 0) { startRecording(); return; }
    countdownNumber.innerText = n;
    countdownOverlay.classList.add('active');
    const timer = setInterval(() => {
        n--;
        if (n > 0) {
            countdownNumber.innerText = n;
        } else {
            clearInterval(timer);
            countdownOverlay.classList.remove('active');
            startRecording();
        }
    }, 1000);
}

function startRecording() {
    if (!mediaStream) { alert(t('noCamera')); return; }
    recordedChunks = [];
    try {
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
        mediaRecorder = mime
            ? new MediaRecorder(mediaStream, { mimeType: mime })
            : new MediaRecorder(mediaStream);
    } catch(e) { alert(t('noRecord')); return; }

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
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

/* ===== 拖拽 ===== */
let drag = false, dragSX, dragSY, dragL0, dragT0;
dragHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault(); dragHandle.setPointerCapture(e.pointerId);
    const r = prompterWindow.getBoundingClientRect();
    drag = true; dragSX = e.clientX; dragSY = e.clientY;
    dragL0 = r.left; dragT0 = r.top;
    prompterWindow.style.transform = 'none';
});
dragHandle.addEventListener('pointermove', (e) => {
    if (!drag) return; e.preventDefault();
    const BH = document.getElementById('bottomBar').offsetHeight;
    const pw = prompterWindow;
    pw.style.left = Math.max(0, Math.min(dragL0 + e.clientX - dragSX, window.innerWidth  - pw.offsetWidth))  + 'px';
    pw.style.top  = Math.max(0, Math.min(dragT0 + e.clientY - dragSY, window.innerHeight - pw.offsetHeight - BH)) + 'px';
});
dragHandle.addEventListener('pointerup',     () => { drag = false; });
dragHandle.addEventListener('pointercancel', () => { drag = false; });

/* ===== 縮放 ===== */
let resize = false, resSX, resSY, resW0, resH0;
resizeHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault(); resizeHandle.setPointerCapture(e.pointerId);
    resize = true; resSX = e.clientX; resSY = e.clientY;
    resW0 = prompterWindow.offsetWidth; resH0 = prompterWindow.offsetHeight;
    prompterWindow.style.transform = 'none';
});
resizeHandle.addEventListener('pointermove', (e) => {
    if (!resize) return; e.preventDefault();
    const BH   = document.getElementById('bottomBar').offsetHeight;
    const rect = prompterWindow.getBoundingClientRect();
    prompterWindow.style.width  = Math.max(160, Math.min(resW0 + e.clientX - resSX, window.innerWidth  - rect.left)) + 'px';
    prompterWindow.style.height = Math.max(120, Math.min(resH0 + e.clientY - resSY, window.innerHeight - rect.top - BH)) + 'px';
    calcEstimate();
});
resizeHandle.addEventListener('pointerup',     () => { resize = false; });
resizeHandle.addEventListener('pointercancel', () => { resize = false; });

/* ===== 初始位置 ===== */
function clampWindow() {
    const BH = document.getElementById('bottomBar').offsetHeight;
    const pw = prompterWindow;
    const r  = pw.getBoundingClientRect();
    pw.style.left      = Math.max(0, Math.min(r.left, window.innerWidth  - pw.offsetWidth))  + 'px';
    pw.style.top       = Math.max(0, Math.min(r.top,  window.innerHeight - pw.offsetHeight - BH)) + 'px';
    pw.style.transform = 'none';
}
window.addEventListener('load',   clampWindow);
window.addEventListener('resize', () => { clampWindow(); resetPrompter(); });

/* ===== 初始化 ===== */
applyI18n();      // i18n
resetPrompter();  // 確保提示詞酲 top:0
