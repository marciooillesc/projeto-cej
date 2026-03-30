/**
 * modules/ui.js
 * Funções utilitárias de interface — geração de HTML, DOM helpers.
 */

/**
 * Renderiza HTML no elemento de destino com animação.
 * @param {HTMLElement} el
 * @param {string} html
 */
export function renderizar(el, html) {
  el.innerHTML = html;
  // Reaplica animação forçando reflow
  el.style.animation = 'none';
  el.offsetHeight; // eslint-disable-line no-unused-expressions
  el.style.animation = '';
}

/**
 * Gera HTML de loading.
 * @param {string} texto
 * @returns {string}
 */
export function htmlLoading(texto = 'Carregando...') {
  return `
    <div class="loading">
      <div class="loading__spinner"></div>
      <span>${texto}</span>
    </div>
  `;
}

/**
 * Gera HTML de estado vazio.
 * @param {Object} opts
 * @returns {string}
 */
export function htmlVazio({ icone = '📭', titulo = 'Nada por aqui', desc = '' } = {}) {
  return `
    <div class="estado-vazio">
      <span class="estado-vazio__icone">${icone}</span>
      <p class="estado-vazio__titulo">${titulo}</p>
      ${desc ? `<p class="estado-vazio__desc">${desc}</p>` : ''}
    </div>
  `;
}

/**
 * Gera HTML de erro.
 * @param {string} mensagem
 * @returns {string}
 */
export function htmlErro(mensagem) {
  return `
    <div class="aviso-erro">
      <span class="aviso-erro__icone">⚠️</span>
      <div>
        <strong>Erro ao carregar</strong><br />
        <span>${mensagem}</span>
      </div>
    </div>
  `;
}

/**
 * Formata uma data ISO para exibição no formato brasileiro.
 * @param {string} iso - ex: '2024-03-15'
 * @returns {string}
 */
export function formatarData(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/**
 * Mapeia tipo de conteúdo para badge HTML.
 * @param {string} tipo
 * @returns {string}
 */
export function htmlBadgeTipo(tipo) {
  const map = {
    atividade: { classe: 'tipo-atividade', label: 'Atividade' },
    conteudo:  { classe: 'tipo-conteudo',  label: 'Conteúdo'  },
    material:  { classe: 'tipo-material',  label: 'Material'  },
    simulado:  { classe: 'tipo-simulado',  label: 'Simulado'  },
  };
  const t = map[tipo?.toLowerCase()] || { classe: 'tipo-conteudo', label: tipo || '—' };
  return `<span class="conteudo-item__tipo-badge ${t.classe}">${t.label}</span>`;
}

/**
 * Gera HTML de um item da lista de conteúdos.
 * @param {Object} item
 * @param {number} idx
 * @returns {string}
 */
export function htmlConteudoItem(item, idx) {
  return `
    <div class="conteudo-item card--clicavel" data-idx="${idx}">
      ${htmlBadgeTipo(item.tipo)}
      <div class="conteudo-item__info">
        <div class="conteudo-item__titulo">${_escapar(item.titulo)}</div>
        <div class="conteudo-item__meta">
          <span>${_escapar(item.materia || '')}</span>
          ${item.turma ? `<span class="conteudo-item__meta-sep"></span><span>${_escapar(item.turma)}</span>` : ''}
          ${item.data_de_publicacao ? `<span class="conteudo-item__meta-sep"></span><span>${formatarData(item.data_de_publicacao)}</span>` : ''}
        </div>
      </div>
      <div class="conteudo-item__acoes">
        <button class="btn btn--ghost btn--sm">Abrir</button>
      </div>
    </div>
  `;
}

/**
 * Gera HTML completo de detalhe de conteúdo.
 * @param {Object} item
 * @returns {string}
 */
export function htmlDetalheConteudo(item) {
  const temQuestoes = item.questoes && Array.isArray(item.questoes) && item.questoes.length > 0;

  return `
    <div class="detalhe">
      <div class="detalhe__header">
        <button class="detalhe__voltar" id="btn-detalhe-voltar">
          ← Voltar
        </button>
      </div>
      <div class="detalhe__corpo">
        ${htmlBadgeTipo(item.tipo)}
        <h2 class="detalhe__titulo" style="margin-top:0.75rem">${_escapar(item.titulo)}</h2>
        <div class="detalhe__meta-row">
          ${item.professor ? `<span class="detalhe__meta-tag">👤 ${_escapar(item.professor)}</span>` : ''}
          ${item.materia   ? `<span class="detalhe__meta-tag">📚 ${_escapar(item.materia)}</span>` : ''}
          ${item.turma     ? `<span class="detalhe__meta-tag">🏫 ${_escapar(item.turma)}</span>` : ''}
          ${item.data_de_publicacao ? `<span class="detalhe__meta-tag">📅 ${formatarData(item.data_de_publicacao)}</span>` : ''}
        </div>
        <p class="detalhe__descricao">${_escapar(item.descricao || 'Sem descrição.')}</p>
        ${temQuestoes ? htmlSimulado(item.questoes) : ''}
      </div>
    </div>
  `;
}

/**
 * Gera HTML de simulado com questões interativas.
 * @param {Array} questoes
 * @returns {string}
 */
export function htmlSimulado(questoes) {
  const questoesHTML = questoes.map((q, qi) => {
    const letras = ['A', 'B', 'C', 'D', 'E'];
    const altsHTML = q.alternativas.map((alt, ai) => `
      <div class="alternativa" data-questao="${qi}" data-alt="${ai}">
        <span class="alternativa__letra">${letras[ai]}</span>
        <span>${_escapar(alt)}</span>
      </div>
    `).join('');

    return `
      <div class="questao" id="questao-${qi}">
        <span class="questao__numero">Questão ${qi + 1}</span>
        <p class="questao__enunciado">${_escapar(q.enunciado)}</p>
        <div class="alternativas">
          ${altsHTML}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="simulado" id="simulado-container">
      <div class="simulado__titulo">📝 Questões</div>
      ${questoesHTML}
      <div class="simulado__acoes">
        <button class="btn btn--primary" id="btn-corrigir">Corrigir</button>
        <button class="btn btn--ghost" id="btn-refazer" style="display:none">Refazer</button>
        <div class="simulado__placar" id="simulado-placar" style="display:none"></div>
      </div>
    </div>
  `;
}

/**
 * Inicializa lógica interativa do simulado após render.
 * @param {Array} questoes - array com campo 'correta' por questão
 */
export function inicializarSimulado(questoes) {
  const container = document.getElementById('simulado-container');
  if (!container) return;

  const respostas = new Map(); // questaoIdx -> altIdx

  // Clique nas alternativas
  container.querySelectorAll('.alternativa').forEach(el => {
    el.addEventListener('click', () => {
      const qi = Number(el.dataset.questao);
      const ai = Number(el.dataset.alt);

      // Remove seleção anterior da mesma questão
      container.querySelectorAll(`.alternativa[data-questao="${qi}"]`)
        .forEach(a => a.classList.remove('selecionada'));

      el.classList.add('selecionada');
      respostas.set(qi, ai);
    });
  });

  // Botão corrigir
  const btnCorrigir = document.getElementById('btn-corrigir');
  const btnRefazer  = document.getElementById('btn-refazer');
  const placar      = document.getElementById('simulado-placar');

  btnCorrigir?.addEventListener('click', () => {
    let acertos = 0;

    questoes.forEach((q, qi) => {
      const respondida = respostas.get(qi);
      container.querySelectorAll(`.alternativa[data-questao="${qi}"]`).forEach(a => {
        a.style.pointerEvents = 'none';
        const ai = Number(a.dataset.alt);
        if (ai === q.correta) a.classList.add('correta');
        else if (ai === respondida) a.classList.add('incorreta');
        a.classList.remove('selecionada');
      });
      if (respondida === q.correta) acertos++;
    });

    placar.innerHTML = `Resultado: <strong>${acertos}/${questoes.length}</strong> acertos`;
    placar.style.display = '';
    btnCorrigir.style.display = 'none';
    btnRefazer.style.display = '';
  });

  // Botão refazer
  btnRefazer?.addEventListener('click', () => {
    respostas.clear();
    container.querySelectorAll('.alternativa').forEach(a => {
      a.classList.remove('selecionada', 'correta', 'incorreta');
      a.style.pointerEvents = '';
    });
    placar.style.display = 'none';
    btnCorrigir.style.display = '';
    btnRefazer.style.display = 'none';
  });
}

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function _escapar(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
