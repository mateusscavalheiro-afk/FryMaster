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
let cookTimer = null;
let cooldownTimer = null;
let currentTemp = 22;

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
}

/* ── RESET ── */
function resetAll() {
    if (cookTimer) clearInterval(cookTimer);
    if (cooldownTimer) clearInterval(cooldownTimer);
    
    cooking = false;
    cameraOn = false;
    currentTemp = 22;

    btnPower.textContent = '⏻   LIGAR CÂMERA';
    btnPower.classList.remove('on');
    cameraZone.classList.remove('active');

    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();

    statusBox.style.color = '#9a9080';
    statusBox.textContent = '> Status: Forno desligado.';

    barFill.style.width = '0%';
    pctVal.textContent = '0';

    [mCam, mTemp, mTurb, mFood, mConf, mCor, mTime].forEach(el => el.className = 'metric-value off');
    mCam.textContent = 'OFFLINE';
    mTemp.textContent = '— °C';
    mTurb.textContent = 'IDLE';
    mFood.textContent = '—';
    mConf.textContent = '—';
    mTime.textContent = '—';
    confBar.style.width = '0%';
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

    // Visual food
    const foodEl = document.createElement('span');
    foodEl.className = 'food-cooking';
    foodEl.textContent = emoji;
    cameraZone.appendChild(foodEl);

    // Initial Metrics
    const confianca = 92 + Math.floor(Math.random() * 7);
    mFood.textContent = name;
    mConf.textContent = confianca + '%';
    confBar.style.width = confianca + '%';
    mTurb.textContent = 'MÁXIMA';
    mTurb.className = 'metric-value ok';

    log(`Iniciando: ${name}`, 'gold');

    let tick = 0;
    
    // Intervalo de Temperatura (Sobe enquanto cozinha)
    const tempRise = setInterval(() => {
        if (!cooking) return clearInterval(tempRise);
        if (currentTemp < 200) {
            currentTemp += Math.round(Math.random() * 20 + 10);
            if (currentTemp > 200) currentTemp = 200;
            mTemp.textContent = currentTemp + ' °C';
            mTemp.className = 'metric-value warn';
        }
    }, 400);

    // Intervalo de Maillard (Progresso)
    cookTimer = setInterval(() => {
        tick++;
        const pct = Math.round((tick / totalTime) * 100);
        barFill.style.width = pct + '%';
        pctVal.textContent = pct;
        mTime.textContent = (totalTime - tick) + 's';

        if (pct >= 100) {
            finishCooking(name);
        }
    }, 1000);
}

function finishCooking(name) {
    clearInterval(cookTimer);
    cooking = false;
    statusBox.style.color = '#7fff7f';
    statusBox.textContent = `> ✅ ${name} PRONTO! Removendo alimento em breve...`;
    
    setTimeout(() => {
        removeFood();
    }, 3000);
}

function removeFood() {
    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();
    
    mFood.textContent = '—';
    mConf.textContent = '—';
    confBar.style.width = '0%';
    mTime.textContent = '—';
    
    log('Alimento removido. Iniciando resfriamento.', '');
    startCoolDown();
}

function cancelProcess() {
    log('PROCESSO CANCELADO', 'red');
    clearInterval(cookTimer);
    cooking = false;
    
    statusBox.style.color = '#ff4444';
    statusBox.textContent = '> [ALERTA] Processo interrompido. Resfriando sistema...';
    
    const foodEl = cameraZone.querySelector('.food-cooking');
    if (foodEl) foodEl.remove();

    startCoolDown();
}

function startCoolDown() {
    if (cooldownTimer) clearInterval(cooldownTimer);
    mTurb.textContent = 'VENTILANDO';
    mTurb.className = 'metric-value warn';

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