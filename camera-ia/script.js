    /* ── ELEMENTS ── */
    const btnPower   = document.getElementById('btn-power');
    const cameraZone = document.getElementById('camera-zone');
    const statusBox  = document.getElementById('status-box');
    const barFill    = document.getElementById('bar-fill');
    const pctVal     = document.getElementById('pct-val');
    const logBox     = document.getElementById('log-box');

    const mCam  = document.getElementById('m-cam');
    const mTemp = document.getElementById('m-temp');
    const mTurb = document.getElementById('m-turb');
    const mFood = document.getElementById('m-food');
    const mConf = document.getElementById('m-conf');
    const mCor  = document.getElementById('m-cor');
    const mTime = document.getElementById('m-time');
    const mFps  = document.getElementById('m-fps');
    const confBar = document.getElementById('conf-bar');

    /* ── STATE ── */
    let cameraOn = false;
    let cooking  = false;
    let cookTimer = null;
    let fpsInterval = null;

    /* ── LOG HELPER ── */
    function log(msg, cls = '') {
      const d = new Date();
      const ts = d.toTimeString().slice(0,8);
      const el = document.createElement('div');
      el.className = 'log-line ' + cls;
      el.textContent = `[${ts}] ${msg}`;
      logBox.appendChild(el);
      logBox.scrollTop = logBox.scrollHeight;
    }

    /* ── POWER ── */
    btnPower.addEventListener('click', () => {
      cameraOn = !cameraOn;

      if (cameraOn) {
        btnPower.textContent = '⏻   DESLIGAR CÂMERA';
        btnPower.classList.add('on');
        cameraZone.classList.add('active');

        statusBox.style.color = '#c9a84c';
        statusBox.textContent = '> Câmera inicializada. Arraste um alimento para a área de visão.';

        // Metrics
        mCam.textContent = 'ONLINE'; mCam.className = 'metric-value ok';
        mTemp.textContent = '-- °C'; mTemp.className = 'metric-value warn';
        mTurb.textContent = 'STANDBY'; mTurb.className = 'metric-value warn';
        mFps.textContent  = '30 FPS'; mFps.className  = 'metric-value ok';

        // Simulate temp rising
        let t = 22;
        const tempRise = setInterval(() => {
          t += Math.round(Math.random()*12 + 5);
          if (t >= 200) { t = 200; clearInterval(tempRise); }
          mTemp.textContent = t + ' °C';
        }, 400);

        // fps flicker
        fpsInterval = setInterval(() => {
          mFps.textContent = (28 + Math.floor(Math.random()*4)) + ' FPS';
        }, 800);

        log('Câmera LIGADA. Inicializando sensor de imagem...', 'gold');
        log('Turbina em standby. Aguardando alimento.', '');

      } else {
        resetAll();
        log('Sistema desligado pelo usuário.', 'dim');
      }
    });

    /* ── RESET ── */
    function resetAll() {
      if (cookTimer) { clearInterval(cookTimer); cookTimer = null; }
      if (fpsInterval) { clearInterval(fpsInterval); fpsInterval = null; }
      cooking = false;

      cameraOn = false;
      btnPower.textContent = '⏻   LIGAR CÂMERA';
      btnPower.classList.remove('on');
      cameraZone.classList.remove('active');

      // strip any cooking emoji but preserve inner structure elements
      const foodEl = cameraZone.querySelector('.food-cooking');
      if (foodEl) foodEl.remove();

      statusBox.style.color = '#9a9080';
      statusBox.textContent = '> Status: Forno desligado. Aguardando inicialização.';

      barFill.style.width = '0%';
      pctVal.textContent = '0';

      [mCam,mTemp,mTurb,mFood,mConf,mCor,mTime,mFps].forEach(el => {
        el.className = 'metric-value off';
      });
      mCam.textContent  = 'OFFLINE';
      mTemp.textContent = '— °C';
      mTurb.textContent = 'IDLE';
      mFood.textContent = '—';
      mConf.textContent = '—';
      mCor.textContent  = '—';
      mTime.textContent = '—';
      mFps.textContent  = '— FPS';
      confBar.style.width = '0%';
    }

    /* ── DRAG ── */
    document.querySelectorAll('.food-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('foodName',  item.dataset.name);
        e.dataTransfer.setData('foodEmoji', item.textContent.trim().slice(0,2));
        e.dataTransfer.setData('foodTime',  item.dataset.time);
      });
    });

    cameraZone.addEventListener('dragover', e => {
      e.preventDefault();
      if (cameraOn) cameraZone.classList.add('dragover');
    });

    cameraZone.addEventListener('dragleave', () => {
      cameraZone.classList.remove('dragover');
    });

    cameraZone.addEventListener('drop', e => {
      e.preventDefault();
      cameraZone.classList.remove('dragover');

      if (!cameraOn) { log('ERRO: Câmera desligada.', ''); return; }
      if (cooking)   { log('AVISO: Cozimento já em andamento.', 'gold'); return; }

      const nome  = e.dataTransfer.getData('foodName');
      const emoji = e.dataTransfer.getData('foodEmoji');
      const tempo = parseInt(e.dataTransfer.getData('foodTime')) || 8;

      iniciarCozimento(nome, emoji, tempo);
    });

    /* ── COZIMENTO ── */
    function iniciarCozimento(nome, emoji, tempoTotal) {
      cooking = true;

      // Show emoji over oven bg
      const oldFood = cameraZone.querySelector('.food-cooking');
      if (oldFood) oldFood.remove();
      const foodEl = document.createElement('span');
      foodEl.className = 'food-cooking';
      foodEl.textContent = emoji;
      cameraZone.appendChild(foodEl);

      // Metrics
      const confianca = 92 + Math.floor(Math.random()*7);
      mFood.textContent = nome; mFood.className = 'metric-value warn';
      mConf.textContent = confianca + '%'; mConf.className = 'metric-value warn';
      confBar.style.width = confianca + '%';
      mTurb.textContent = 'MÁXIMA'; mTurb.className = 'metric-value ok';
      mCor.textContent  = 'CRU'; mCor.className = 'metric-value';
      mTime.textContent = tempoTotal + 's'; mTime.className = 'metric-value warn';

      statusBox.style.color = '#f0d080';
      statusBox.textContent = `> [IA] ${nome} detectado (${confianca}% conf.). Iniciando análise de Maillard...`;

      log(`Alimento identificado: ${nome} — confiança ${confianca}%`, 'gold');
      log(`Turbina: MÁXIMA. Iniciando cozimento por ${tempoTotal}s.`, '');

      let tick = 0;

      const STAGES = [
        { pct: 20,  cor: 'CRU',      label: 'Superfície fria. Sem reação detectada.' },
        { pct: 45,  cor: 'AQUECENDO', label: 'Temperatura superficial subindo. Início de desidratação.' },
        { pct: 65,  cor: 'SELADO',   label: 'Selagem ativa. Compostos de Maillard se formando.' },
        { pct: 82,  cor: 'DOURADO',  label: 'Douramento avançado. Polímeros de cor intensificando.' },
        { pct: 95,  cor: 'PERFEITO', label: 'Maillard máximo. Ponto de parada iminente.' },
        { pct: 100, cor: '✅ PONTO', label: `${nome} pronto! Maillard perfeito atingido.` },
      ];

      cookTimer = setInterval(() => {
        tick++;
        const pct = Math.round((tick / tempoTotal) * 100);
        barFill.style.width = pct + '%';
        pctVal.textContent = pct;

        const restante = tempoTotal - tick;
        mTime.textContent = restante + 's';

        // find stage
        const stage = STAGES.find(s => pct <= s.pct) || STAGES[STAGES.length - 1];
        mCor.textContent = stage.cor;

        // color transitions
        if (pct < 30)       barFill.style.background = 'linear-gradient(90deg,#3a2a00,#8a6020)';
        else if (pct < 60)  barFill.style.background = 'linear-gradient(90deg,#3a2a00,#c9a84c)';
        else if (pct < 85)  barFill.style.background = 'linear-gradient(90deg,#8a6020,#f0d080)';
        else                barFill.style.background = 'linear-gradient(90deg,#c9a84c,#fff8dc)';

        statusBox.textContent = `> [MAILLARD ${pct}%] ${stage.label}`;

        // log at stage triggers
        if ([20,45,65,82,95,100].includes(pct)) {
          log(`Maillard ${pct}% — ${stage.label}`, pct === 100 ? 'green' : 'gold');
        }

        if (tick >= tempoTotal) {
          clearInterval(cookTimer);
          cooking = false;

          statusBox.style.color = '#7fff7f';
          statusBox.textContent = `> ✅ ${nome} pronto! Desligando turbina. Maillard perfeito.`;
          mTurb.textContent = 'DESLIGADA'; mTurb.className = 'metric-value ok';
          mTime.textContent = '0s';
          pctVal.textContent = '100';

          log('Turbina desligada. Aguardando próximo alimento.', 'green');
        }

      }, 1000);
    }