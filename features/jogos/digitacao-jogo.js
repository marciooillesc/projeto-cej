/**
 * features/jogos/digitacao-jogo.js
 * Jogo de velocidade de digitação.
 */

export const META = {
  id: 'digitacao',
  nome: 'Velocidade de Digitação',
  descricao: 'Teste sua velocidade no teclado',
  emoji: '⌨️',
};

const FRASES = [
'Programar é construir soluções para o mundo real.',
'A lógica te leva até a solução, a prática te leva à excelência.',
'Errar faz parte do processo de quem está aprendendo.',
'Cada linha de código é um passo para o conhecimento.',
'Quem tenta todos os dias evolui constantemente.',
'Desafios existem para desenvolver sua mente.',
'A tecnologia é uma ferramenta, o diferencial é quem usa.',
'Pensar antes de codar economiza tempo depois.',
'A dedicação diária supera o talento sem esforço.',
'Seu código reflete seu nível de atenção aos detalhes.',
'O aprendizado acontece fora da zona de conforto.',
'Persistir é mais importante do que acertar de primeira.',
'Resolver problemas é uma habilidade para a vida.',
'O esforço de hoje vira resultado amanhã.',
'Programar é aprender a organizar o pensamento.',
'Todo erro tem algo a ensinar.',
'A evolução vem da prática constante.',
'Dominar o básico é o primeiro passo para o avançado.',
'Criatividade e lógica andam juntas na programação.',
'O conhecimento cresce quando você compartilha.',
'Não desista no erro, investigue a causa.',
'Cada tentativa te aproxima da solução.',
'Aprender leva tempo, mas vale cada segundo.',
'Grandes projetos começam com ideias simples.',
'A disciplina transforma aprendizado em resultado.',
'O código é uma forma de expressar ideias.',
'Quem resolve problemas cria oportunidades.',
'A tecnologia muda, mas a lógica permanece.',
'O aprendizado contínuo é o verdadeiro diferencial.',
'Foco e prática constroem habilidade.',
'Você aprende mais fazendo do que apenas assistindo.',
'Organização no código facilita tudo.',
'Entender o problema é metade da solução.',
'O progresso vem com consistência.',
'Todo dia é uma chance de aprender algo novo.',
];

export function render(container) {
  container.innerHTML = `
    <div class="jogo-area">
      <div class="page-header">
        <span class="page-header__eyebrow">⌨️ Jogo</span>
        <h1 class="page-header__titulo">Velocidade de Digitação</h1>
        <p class="page-header__desc">Digite o texto abaixo o mais rápido possível. Boa sorte!</p>
      </div>

      <div class="card" id="digitacao-card">
        <div id="digitacao-estado-inicial">
          <p style="text-align:center; color:var(--text-2); margin-bottom:1.5rem">Clique em Iniciar quando estiver pronto.</p>
          <div style="text-align:center">
            <button class="btn btn--primary" id="btn-iniciar-digitacao" style="font-size:1rem; padding:0.8rem 2rem">
              🚀 Iniciar
            </button>
          </div>
        </div>

        <div id="digitacao-jogo" style="display:none">
          <div id="digitacao-frase" style="
            font-size:1.1rem;
            line-height:1.9;
            margin-bottom:1.25rem;
            font-family:var(--font-mono);
            letter-spacing:0.02em;
            padding:1rem;
            background:var(--bg-2);
            border-radius:var(--radius-sm);
            border:1px solid var(--border);
          "></div>

          <textarea
            id="digitacao-input"
            class="textarea-custom"
            style="font-family:var(--font-mono); font-size:1rem; min-height:80px"
            placeholder="Digite aqui..."
            spellcheck="false"
            autocomplete="off"
          ></textarea>

          <div style="display:flex; gap:1rem; margin-top:1rem; font-family:var(--font-mono); font-size:0.8rem; color:var(--text-3)">
            <span>⏱️ <span id="digitacao-tempo">0</span>s</span>
            <span>✅ <span id="digitacao-precisao">100</span>% precisão</span>
            <span>⌨️ <span id="digitacao-wpm">0</span> PPM</span>
          </div>
        </div>

        <div id="digitacao-resultado" style="display:none; text-align:center; padding:1.5rem 0">
          <div style="font-size:3rem; margin-bottom:0.5rem">🏆</div>
          <h3 style="font-family:var(--font-display); color:var(--primary); font-size:1.8rem" id="resultado-wpm"></h3>
          <p style="color:var(--text-2); margin:0.4rem 0 1.5rem" id="resultado-desc"></p>
          <button class="btn btn--primary" id="btn-reiniciar-digitacao">Jogar Novamente</button>
        </div>
      </div>
    </div>
  `;
}

export function init(container) {
  let inicioTempo = null;
  let intervaloTempo = null;
  let fraseAtual = '';

  const btnIniciar    = container.querySelector('#btn-iniciar-digitacao');
  const btnReiniciar  = container.querySelector('#btn-reiniciar-digitacao');
  const estadoInicial = container.querySelector('#digitacao-estado-inicial');
  const jogoArea      = container.querySelector('#digitacao-jogo');
  const resultadoArea = container.querySelector('#digitacao-resultado');
  const fraseEl       = container.querySelector('#digitacao-frase');
  const inputEl       = container.querySelector('#digitacao-input');
  const tempoEl       = container.querySelector('#digitacao-tempo');
  const precisaoEl    = container.querySelector('#digitacao-precisao');
  const wpmEl         = container.querySelector('#digitacao-wpm');
  const resultadoWpm  = container.querySelector('#resultado-wpm');
  const resultadoDesc = container.querySelector('#resultado-desc');

  function iniciar() {
    fraseAtual = FRASES[Math.floor(Math.random() * FRASES.length)];
    renderizarFrase('');
    inputEl.value = '';
    estadoInicial.style.display = 'none';
    resultadoArea.style.display = 'none';
    jogoArea.style.display = '';
    inputEl.focus();
    inicioTempo = Date.now();

    clearInterval(intervaloTempo);
    intervaloTempo = setInterval(() => {
      const seg = Math.floor((Date.now() - inicioTempo) / 1000);
      tempoEl.textContent = seg;
      // Calcula WPM em tempo real
      const digitado = inputEl.value;
      const palavras  = digitado.trim().split(/\s+/).filter(Boolean).length;
      const minutos   = (Date.now() - inicioTempo) / 60000;
      wpmEl.textContent = minutos > 0 ? Math.round(palavras / minutos) : 0;
    }, 500);
  }

  function renderizarFrase(digitado) {
    let html = '';
    for (let i = 0; i < fraseAtual.length; i++) {
      const char = fraseAtual[i];
      if (i < digitado.length) {
        const correto = digitado[i] === char;
        const cor = correto ? 'var(--success)' : 'var(--danger)';
        const bg  = correto ? '' : 'rgba(248,113,113,0.15)';
        html += `<span style="color:${cor};background:${bg};border-radius:2px">${char}</span>`;
      } else if (i === digitado.length) {
        html += `<span style="border-left:2px solid var(--primary);animation:blink 1s step-end infinite">${char}</span>`;
      } else {
        html += `<span style="color:var(--text-3)">${char}</span>`;
      }
    }
    fraseEl.innerHTML = html;
  }

  function calcularPrecisao(digitado) {
    if (!digitado.length) return 100;
    let corretos = 0;
    for (let i = 0; i < Math.min(digitado.length, fraseAtual.length); i++) {
      if (digitado[i] === fraseAtual[i]) corretos++;
    }
    return Math.round((corretos / digitado.length) * 100);
  }

  inputEl?.addEventListener('input', () => {
    const digitado = inputEl.value;
    renderizarFrase(digitado);
    precisaoEl.textContent = calcularPrecisao(digitado);

    // Concluído
    if (digitado === fraseAtual) {
      clearInterval(intervaloTempo);
      const seg     = (Date.now() - inicioTempo) / 1000;
      const palavras = fraseAtual.trim().split(/\s+/).length;
      const wpm     = Math.round((palavras / seg) * 60);
      const prec    = calcularPrecisao(digitado);

      jogoArea.style.display = 'none';
      resultadoArea.style.display = '';
      resultadoWpm.textContent = `${wpm} PPM`;

      let desc = '';
      if (wpm < 30) desc = `Bom começo! Precisão: ${prec}%. Continue praticando!`;
      else if (wpm < 50) desc = `Nível intermediário! Precisão: ${prec}%. Você está evoluindo!`;
      else if (wpm < 70) desc = `Ótimo! Precisão: ${prec}%. Você digita bem!`;
      else desc = `Incrível! Precisão: ${prec}%. Você é muito rápido! 🔥`;
      resultadoDesc.textContent = desc;
    }
  });

  btnIniciar?.addEventListener('click', iniciar);
  btnReiniciar?.addEventListener('click', iniciar);

  // Adiciona estilo de cursor piscante
  const style = document.createElement('style');
  style.textContent = `@keyframes blink { 50% { opacity: 0 } }`;
  document.head.appendChild(style);
}
