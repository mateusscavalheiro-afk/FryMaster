/* ── ELEMENTS ── */
const btnPower = document.getElementById('btn-power');
const cameraZone = document.getElementById('camera-zone');
const statusBox = document.getElementById('status-box');
const barFill = document.getElementById('bar-fill');
const pctVal = document.getElementById('pct-val');

const mCam = document.getElementById('m-cam');
const mTemp = document.getElementById('m-temp');
const mTurb = document.getElementById('m-turb');
const mFood = document.getElementById('m-food');
const mConf = document.getElementById('m-conf');
const mCor = document.getElementById('m-cor');
const mTime = document.getElementById('m-time');
const confBar = document.getElementById('conf-bar');

/* ── STATE ── */
let cameraOn = false;
let cooking = false;
let isPaused = false; 
let cookTimer = null;
let cooldownTimer = null;
let currentTemp = 22;
let targetTemp = 200;

/* ── LOG HELPER ── */
function log(msg, cls = '') {
    const d = new Date();
    const ts = d.toTimeString().slice(0, 8);
    console.log(`[${ts}] ${msg}`);
}

/* ── POWER & CONTROL ── */
btnPower.addEventListener('click', () => {
    if (!cameraOn) {
        turnOn();
    } else {
        if (cooking) cancelProcess();
        resetAll();
    }
});

function turnOn() {
    cameraOn = true;
    btnPower.textContent = '⏻   DESLIGAR CÂMERA';
    btnPower.classList.add('on');
    cameraZone.classList.add('active');

    statusBox.style.color = '#c9a84c';
    statusBox.textContent = '> Câmera ONLINE. Aguardando detecção de alimento...';

    mCam.textContent = 'ONLINE';
    mCam.className = 'metric-value ok';
    mTemp.textContent = '22 °C';
    mTemp.className = 'metric-value ok';
    mTurb.textContent = 'STANDBY';
    mTurb.className = 'metric-value warn';

    log('Sistema iniciado.', 'gold');

    cameraZone.style.backgroundImage = "url('assets/camera-pov.png')";
}

/* ── RESET ── */
function resetAll() {
    if (cookTimer) clearInterval(cookTimer);
    if (cooldownTimer) clearInterval(cooldownTimer);

    cooking = false;
    isPaused = false;
    cameraOn = false;
    currentTemp = 22;

    document.getElementById('process-controls').style.display = 'none';

    btnPower.textContent = '⏻   LIGAR CÂMERA';
    btnPower.classList.remove('on');
    cameraZone.classList.remove('active');
    cameraZone.classList.remove('ready');

    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();

    statusBox.style.color = '#9a9080';
    statusBox.textContent = '> Status: Forno desligado.';

    // Reset da barra Maillard
    barFill.style.width = '0%';
    pctVal.textContent = '0';

    [mCam, mTemp, mTurb, mFood, mConf, mCor, mTime].forEach(el => el.className = 'metric-value off');
    mCam.textContent = 'OFFLINE';
    mTemp.textContent = '— °C';
    mTurb.textContent = 'IDLE';
    mFood.textContent = '—';
    mConf.textContent = '—';
    mCor.textContent = '—';
    mTime.textContent = '—';
    confBar.style.width = '0%';

    cameraZone.style.backgroundImage = "";
}

/* ── DRAG & DROP ── */
document.querySelectorAll('.food-item').forEach(item => {
    item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('foodName', item.dataset.name);
        e.dataTransfer.setData('foodEmoji', item.textContent.trim().slice(0, 2));
        e.dataTransfer.setData('foodTime', item.dataset.time);
    });
});

cameraZone.addEventListener('dragover', e => {
    e.preventDefault();
    if (cameraOn) cameraZone.classList.add('dragover');
});

cameraZone.addEventListener('dragleave', () => cameraZone.classList.remove('dragover'));

cameraZone.addEventListener('drop', e => {
    e.preventDefault();
    cameraZone.classList.remove('dragover');
    if (!cameraOn || cooking) return;

    const name = e.dataTransfer.getData('foodName');
    const emoji = e.dataTransfer.getData('foodEmoji');
    const time = parseInt(e.dataTransfer.getData('foodTime')) || 8;
    cookingStart(name, emoji, time);
});

/* ── COZIMENTO ── */
function cookingStart(name, emoji, totalTime) {
    if (cooldownTimer) clearInterval(cooldownTimer);
    cooking = true;
    isPaused = false;
    cameraZone.classList.remove('ready');

    // Reset da barra Maillard ao iniciar
    barFill.style.width = '0%';
    pctVal.textContent = '0';

    // Exibe botões de pausa e cancelamento
    document.getElementById('process-controls').style.display = 'flex';
    document.getElementById('btn-pause').textContent = 'PAUSAR';
    document.getElementById('btn-pause').classList.remove('paused-state');

    // Visual food
    const foodEl = document.createElement('span');
    foodEl.className = 'food-cooking';
    foodEl.textContent = emoji;
    cameraZone.appendChild(foodEl);

    // Initial Metrics
    const confianca = 92 + Math.floor(Math.random() * 7);
    mFood.textContent = name;
    mFood.className = 'metric-value warn';
    mConf.textContent = confianca + '%';
    mConf.className = 'metric-value warn';
    confBar.style.width = confianca + '%';
    mTurb.textContent = 'MÁXIMA';
    mTurb.className = 'metric-value ok';
    mCor.textContent = 'CRU';
    mCor.className = 'metric-value';

    log(`Iniciando: ${name}`, 'gold');

    let tick = 0;

    // Intervalo de Temperatura (Curva de aquecimento realista)
    const tempRise = setInterval(() => {
        if (!cooking) return clearInterval(tempRise);
        if (isPaused) return; 

        if (currentTemp < targetTemp) {
            let step = (targetTemp - currentTemp) * 0.15 + Math.random() * 5;
            currentTemp += Math.round(step);
            if (currentTemp > targetTemp) currentTemp = targetTemp;
            mTemp.textContent = currentTemp + ' °C';
            mTemp.className = 'metric-value warn';
        }
    }, 400);

    // Intervalo de Maillard (Progresso)
    cookTimer = setInterval(() => {
        if (isPaused) return;

        tick++;
        const pct = Math.min(Math.round((tick / totalTime) * 100), 100);
        barFill.style.width = pct + '%';
        pctVal.textContent = pct;
        mTime.textContent = (totalTime - tick) + 's';
        mTime.className = 'metric-value warn';

        // Atualiza Cor Superficial
        if (pct < 30) mCor.textContent = 'CRU';
        else if (pct < 60) mCor.textContent = 'SELADO';
        else if (pct < 85) mCor.textContent = 'DOURADO';
        else mCor.textContent = 'PERFEITO';

        if (pct >= 100) {
            finishCooking(name);
        }
    }, 1000);
}

function finishCooking(name) {
    clearInterval(cookTimer);
    cooking = false;
    isPaused = false;
    
    document.getElementById('process-controls').style.display = 'none';

    cameraZone.classList.add('ready');
    mCor.className = 'metric-value ok';
    mTime.className = 'metric-value ok';

    statusBox.style.color = '#7fff7f';
    statusBox.textContent = `> ✅ ${name} PRONTO! Removendo alimento em breve...`;

    if (name === 'Frango') {
        cameraZone.style.backgroundImage = "url('assets/grilled-chicken.png')";
    }

    setTimeout(() => {
        removeFood();
    }, 3000);
}

function removeFood() {
    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();

    cameraZone.classList.remove('ready');
    mFood.textContent = '—';
    mFood.className = 'metric-value off';
    mConf.textContent = '—';
    mConf.className = 'metric-value off';
    confBar.style.width = '0%';
    mCor.textContent = '—';
    mCor.className = 'metric-value off';
    mTime.textContent = '—';
    mTime.className = 'metric-value off';
    
    // ZERAR MAILLARD QUANDO RETIRAR ALIMENTO
    barFill.style.width = '0%';
    pctVal.textContent = '0';
    
    log('Alimento removido. Iniciando resfriamento.', '');
    startCoolDown();

    cameraZone.style.backgroundImage = "url('assets/camera-pov.png')";
}

function cancelProcess() {
    log('PROCESSO CANCELADO', 'red');
    clearInterval(cookTimer);
    cooking = false;
    isPaused = false;
    cameraZone.classList.remove('ready');
    document.getElementById('process-controls').style.display = 'none';
    
    statusBox.style.color = '#ff4444';
    statusBox.textContent = '> [ALERTA] Processo interrompido. Resfriando sistema...';

    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();

    // ZERAR MAILLARD NO CANCELAMENTO
    barFill.style.width = '0%';
    pctVal.textContent = '0';

    startCoolDown();

    cameraZone.style.backgroundImage = "url('assets/camera-pov.png')";
}

function startCoolDown() {
    if (cooldownTimer) clearInterval(cooldownTimer);
    mTurb.textContent = 'VENTILANDO';
    mTurb.className = 'metric-value warn';
    mCor.textContent = '—';

    cooldownTimer = setInterval(() => {
        if (currentTemp > 22 && !cooking) {
            currentTemp -= 8;
            if (currentTemp < 22) currentTemp = 22;
            mTemp.textContent = currentTemp + ' °C';

            if (currentTemp === 22) {
                clearInterval(cooldownTimer);
                mTurb.textContent = 'STANDBY';
                mTurb.className = 'metric-value ok';
                mTemp.className = 'metric-value ok';
            }
        } else {
            clearInterval(cooldownTimer);
        }
    }, 600);
}

/* ── BOTÕES MANUAIS ── */
function togglePause() {
    if (!cooking) return;
    
    isPaused = !isPaused;
    const btnPause = document.getElementById('btn-pause');

    if (isPaused) {
        btnPause.textContent = 'RETOMAR';
        btnPause.classList.add('paused-state');
        statusBox.style.color = '#c9a84c';
        statusBox.textContent = '> [PAUSADO] O processo de preparo foi suspenso.';
        mTurb.textContent = 'PAUSADO';
        mTurb.className = 'metric-value warn';
        log('Preparo pausado pelo utilizador.', 'gold');
    } else {
        btnPause.textContent = 'PAUSAR';
        btnPause.classList.remove('paused-state');
        statusBox.style.color = '#f0d080';
        statusBox.textContent = `> Retomando preparo do alimento...`;
        mTurb.textContent = 'MÁXIMA';
        mTurb.className = 'metric-value ok';
        log('Preparo retomado.', 'green');
    }
}

function cancelProcessManually() {
    if (!cooking) return;
    cancelProcess();
}