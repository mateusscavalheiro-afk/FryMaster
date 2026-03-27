// ── STATE ──
let timerMinutes = 15;
let tempC = 400;
let isRunning = false;
let runInterval = null;
let specifyOpen = false;
let moreOpen = false;
let activeFoodItem = null;
let isGolden = false;

// ── TAB SWITCH ──
function switchTab(id, e) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    e.target.classList.add('active');
}

// ── MANUAL CONTROLS ──
function adjust(type, delta) {
    if (type === 'timer') {
        timerMinutes = Math.max(1, Math.min(99, timerMinutes + delta));
        document.getElementById('timer-val').textContent = timerMinutes + ':00';
    } else {
        tempC = Math.max(80, Math.min(250, tempC + delta));
        document.getElementById('temp-val').textContent = tempC + '°';
    }
}

// ── GOLDEN MODE ──
function toggleGolden(el) {
    isGolden = !isGolden;
    el.classList.toggle('active', isGolden);
    
    if (isGolden) {
        showToast('✨ Modo Golden Ativado!');
    } else {
        showToast('Modo Golden Desativado');
    }
}

function toggleStart() {
    isRunning = !isRunning;
    const btn = document.querySelector('.btn-start');
    const lbl = document.getElementById('start-label');
    if (isRunning) {
        btn.classList.add('running');
        lbl.textContent = '■ PARAR';
        runInterval = setInterval(() => {
            if (timerMinutes <= 1) {
                clearInterval(runInterval);
                isRunning = false;
                btn.classList.remove('running');
                lbl.textContent = '▶ INICIAR';
                showToast('✓ Pronto!');
                return;
            }
            timerMinutes--;
            document.getElementById('timer-val').textContent = timerMinutes + ':00';
        }, 60000);
    } else {
        clearInterval(runInterval);
        btn.classList.remove('running');
        lbl.textContent = '▶ INICIAR';
    }
}

// ── AUTO MODE SELECT ──
function selectMode(el, temp, time) {
    document.querySelectorAll('.menu-item, .more-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    
    // Salva qual alimento foi clicado
    activeFoodItem = el;

    if (temp && time) {
        // Atualiza os sliders de configuração para os valores do alimento clicado
        document.getElementById('spec-temp').value = temp;
        document.getElementById('spec-time').value = time;
        updateSpecify();
        
        showToast('✓ ' + temp + '° · ' + time + 'min selecionado');
    }
}

// ── SPECIFY ──
function toggleSpecify(el) {
    specifyOpen = !specifyOpen;
    const panel = document.getElementById('specify-panel');
    const chevron = document.getElementById('specify-chevron');
    panel.classList.toggle('open', specifyOpen);
    chevron.classList.toggle('open', specifyOpen);
    if (specifyOpen) {
        moreOpen = false;
        document.getElementById('more-panel').classList.remove('open');
        document.getElementById('more-chevron').classList.remove('open');
        updateSpecify();
    }
}

function updateSpecify() {
    const t = document.getElementById('spec-temp').value;
    const m = document.getElementById('spec-time').value;
    document.getElementById('spec-temp-val').textContent = t + '°';
    document.getElementById('spec-time-val').textContent = m + 'min';
}

function applySpecify() {
    const t = document.getElementById('spec-temp').value;
    const m = document.getElementById('spec-time').value;
    
    // Verifica se um alimento foi selecionado antes
    if (activeFoodItem && activeFoodItem.getAttribute('onclick').includes('selectMode')) {
        // Atualiza o texto (180° · 15min) visível na lista
        const detailSpan = activeFoodItem.querySelector('.menu-detail, .more-detail');
        if (detailSpan) {
            detailSpan.textContent = t + '° · ' + m + 'min';
        }
        
        // Atualiza a função onclick para usar os novos valores se for clicado de novo
        activeFoodItem.setAttribute('onclick', `selectMode(this, ${t}, ${m})`);
        
        // Pega o nome do alimento para mostrar na notificação
        const foodName = activeFoodItem.querySelector('.menu-text, .more-text').textContent.trim();
        showToast(`✓ ${foodName} atualizado: ${t}° · ${m}min`);
        
    } else {
        // Comportamento original se nenhum alimento foi clicado antes
        document.getElementById('specify-summary').textContent = t + '° · ' + m + 'min';
        document.querySelectorAll('.menu-item, .more-item').forEach(i => i.classList.remove('selected'));
        document.querySelector('[onclick="toggleSpecify(this)"]').classList.add('selected');
        showToast('✓ Config aplicada: ' + t + '° · ' + m + 'min');
    }

    // Fecha o painel após aplicar
    specifyOpen = false;
    document.getElementById('specify-panel').classList.remove('open');
    document.getElementById('specify-chevron').classList.remove('open');
}

// ── MORE ──
function toggleMore(el) {
    moreOpen = !moreOpen;
    const panel = document.getElementById('more-panel');
    const chevron = document.getElementById('more-chevron');
    panel.classList.toggle('open', moreOpen);
    chevron.classList.toggle('open', moreOpen);
    if (moreOpen) {
        specifyOpen = false;
        document.getElementById('specify-panel').classList.remove('open');
        document.getElementById('specify-chevron').classList.remove('open');
    }
}

// ── TOAST ──
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// Init
updateSpecify();