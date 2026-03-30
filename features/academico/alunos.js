/**
 * features/academico/alunos.js
 * Área dos alunos: identificação por nome+turma, listagem por turma,
 * simulados com salvamento de resultado na planilha.
 */

import { buscarConteudos, filtrarPorTurma, filtrarPorTipo, listarTurmas } from '../../modules/api.js';
import { getEstado, setEstado } from '../../modules/state.js';
import { renderizar, htmlLoading, htmlErro, htmlVazio, htmlBadgeTipo, formatarData, htmlDetalheConteudo, inicializarSimulado } from '../../modules/ui.js';

// ── ESTADO LOCAL ──────────────────────────────────────────────────────────────
let _todos = [];
let _aluno = { nome: '', turma: '' };
let _filtroTipo = '';

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

export function renderAlunos(container) {
  // Restaura sessão salva no navegador
  const salvo = _carregarSessao();
  if (salvo) {
    _aluno = salvo;
    _renderAreaAluno(container);
  } else {
    _renderIdentificacao(container);
  }
}

// ── TELA DE IDENTIFICAÇÃO ─────────────────────────────────────────────────────

async function _renderIdentificacao(container) {
  renderizar(container, htmlLoading('Carregando turmas...'));

  try {
    _todos = await buscarConteudos();
    const turmas = listarTurmas(_todos);

    const turmaOpts = turmas.map(t =>
      `<option value="${t}">${t}</option>`
    ).join('');

    renderizar(container, `
      <div style="max-width:420px; margin:0 auto; padding-top:2rem">
        <div class="page-header" style="text-align:center">
          <span class="page-header__eyebrow">🎒 Alunos</span>
          <h1 class="page-header__titulo">Olá! Quem é você?</h1>
          <p class="page-header__desc">Informe seu nome e turma para acessar os conteúdos.</p>
        </div>

        <div class="card card--destaque" style="margin-top:1.5rem">
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <label style="font-size:0.78rem;color:var(--text-3);font-family:var(--font-mono);letter-spacing:0.08em;display:block;margin-bottom:6px">
                SEU NOME
              </label>
              <input
                id="aluno-nome"
                type="text"
                class="input-custom"
                placeholder="Digite seu nome completo"
                autocomplete="name"
              />
            </div>
            <div>
              <label style="font-size:0.78rem;color:var(--text-3);font-family:var(--font-mono);letter-spacing:0.08em;display:block;margin-bottom:6px">
                SUA TURMA
              </label>
              <select id="aluno-turma" class="select-custom" style="width:100%">
                <option value="">Selecione a turma...</option>
                ${turmaOpts}
              </select>
            </div>
            <button class="btn btn--primary" id="btn-entrar-aluno" style="width:100%;justify-content:center;padding:0.75rem">
              Acessar meus conteúdos →
            </button>
            <p id="aluno-erro" style="color:var(--danger);font-size:0.82rem;text-align:center;display:none">
              Preencha seu nome e selecione a turma.
            </p>
          </div>
        </div>
      </div>
    `);

    container.querySelector('#btn-entrar-aluno')?.addEventListener('click', () => {
      const nome  = container.querySelector('#aluno-nome').value.trim();
      const turma = container.querySelector('#aluno-turma').value;
      const erro  = container.querySelector('#aluno-erro');

      if (!nome || !turma) {
        erro.style.display = '';
        return;
      }

      _aluno = { nome, turma };
      _salvarSessao(_aluno);
      _renderAreaAluno(container);
    });

    // Enter no campo nome avança para turma
    container.querySelector('#aluno-nome')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') container.querySelector('#aluno-turma')?.focus();
    });

  } catch (err) {
    renderizar(container, htmlErro(err.message));
  }
}

// ── ÁREA PRINCIPAL DO ALUNO ───────────────────────────────────────────────────

async function _renderAreaAluno(container) {
  renderizar(container, htmlLoading('Carregando conteúdos...'));

  try {
    _todos = await buscarConteudos();
    _filtroTipo = '';
    _renderListagem(container);
  } catch (err) {
    renderizar(container, htmlErro(err.message));
  }
}

function _renderListagem(container) {
  const conteudosDaTurma = filtrarPorTurma(_todos, _aluno.turma);
  const filtrados = _filtroTipo
    ? filtrarPorTipo(conteudosDaTurma, _filtroTipo)
    : conteudosDaTurma;

  const tipos = ['', 'simulado', 'atividade', 'conteudo', 'material'];
  const labels = { '': 'Todos', simulado: 'Simulados', atividade: 'Atividades', conteudo: 'Conteúdos', material: 'Materiais' };

  const chipsHTML = tipos.map(t => `
    <span class="chip ${_filtroTipo === t ? 'ativo' : ''}" data-tipo="${t}">${labels[t]}</span>
  `).join('');

  const listaHTML = filtrados.length > 0
    ? filtrados.map((item, idx) => `
        <div class="conteudo-item card--clicavel" data-idx="${idx}">
          ${htmlBadgeTipo(item.tipo)}
          <div class="conteudo-item__info">
            <div class="conteudo-item__titulo">${item.titulo}</div>
            <div class="conteudo-item__meta">
              <span>${item.materia || ''}</span>
              ${item.data_de_publicacao ? `<span class="conteudo-item__meta-sep"></span><span>${formatarData(item.data_de_publicacao)}</span>` : ''}
              ${item.data_de_encerramento ? `<span class="conteudo-item__meta-sep"></span><span style="color:var(--warning)">Até ${formatarData(item.data_de_encerramento)}</span>` : ''}
            </div>
          </div>
          <div class="conteudo-item__acoes">
            <button class="btn btn--ghost btn--sm">Abrir</button>
          </div>
        </div>
      `).join('')
    : htmlVazio({ icone: '📭', titulo: 'Nenhum conteúdo', desc: `Ainda não há conteúdos publicados para ${_aluno.turma}.` });

  renderizar(container, `
    <div>
      <div class="page-header">
        <span class="page-header__eyebrow">🎒 Alunos</span>
        <h1 class="page-header__titulo">Olá, ${_aluno.nome.split(' ')[0]}!</h1>
        <p class="page-header__desc">Conteúdos publicados para a turma <strong style="color:var(--primary)">${_aluno.turma}</strong>.</p>
      </div>

      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <div class="chips" id="chips-tipo-aluno" style="margin:0;flex:1">${chipsHTML}</div>
        <button class="btn btn--ghost btn--sm" id="btn-trocar-aluno">↩ Trocar aluno</button>
        <button class="btn btn--ghost btn--sm" id="btn-recarregar-aluno">🔄</button>
      </div>

      <div class="conteudo-lista" id="lista-aluno">${listaHTML}</div>
    </div>
  `);

  // Chips de filtro
  container.querySelector('#chips-tipo-aluno')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-tipo]');
    if (!chip) return;
    _filtroTipo = chip.dataset.tipo;
    _renderListagem(container);
  });

  // Trocar aluno
  container.querySelector('#btn-trocar-aluno')?.addEventListener('click', () => {
    _limparSessao();
    _aluno = { nome: '', turma: '' };
    _renderIdentificacao(container);
  });

  // Recarregar
  container.querySelector('#btn-recarregar-aluno')?.addEventListener('click', async () => {
    const { limparCache } = await import('../../modules/api.js');
    limparCache();
    _renderAreaAluno(container);
  });

  // Clique num item
  container.querySelector('#lista-aluno')?.addEventListener('click', e => {
    const item = e.target.closest('.conteudo-item');
    if (!item) return;
    const idx = Number(item.dataset.idx);
    const conteudosDaTurma = filtrarPorTurma(_todos, _aluno.turma);
    const filtrados2 = _filtroTipo ? filtrarPorTipo(conteudosDaTurma, _filtroTipo) : conteudosDaTurma;
    const conteudo = filtrados2[idx];
    if (conteudo) _renderDetalhe(container, conteudo);
  });
}

// ── DETALHE / SIMULADO ────────────────────────────────────────────────────────

function _renderDetalhe(container, conteudo) {
  renderizar(container, htmlDetalheConteudo(conteudo));

  container.querySelector('#btn-detalhe-voltar')?.addEventListener('click', () => {
    _renderListagem(container);
  });

  if (conteudo.questoes?.length > 0) {
    inicializarSimuladoAluno(container, conteudo);
  }
}

/**
 * Versão do simulado para alunos — salva resultado na planilha ao corrigir.
 */
function inicializarSimuladoAluno(container, conteudo) {
  inicializarSimulado(conteudo.questoes);

  // Intercepta o botão de corrigir para salvar o resultado
  const btnCorrigir = document.getElementById('btn-corrigir');
  if (!btnCorrigir) return;

  const btnOriginal = btnCorrigir.cloneNode(true);
  btnCorrigir.parentNode.replaceChild(btnOriginal, btnCorrigir);

  btnOriginal.addEventListener('click', async () => {
    // Coleta respostas
    const questoes = conteudo.questoes;
    const respostas = new Map();
    document.querySelectorAll('.alternativa.selecionada').forEach(el => {
      respostas.set(Number(el.dataset.questao), Number(el.dataset.alt));
    });

    // Corrige visualmente (chama lógica do ui.js)
    let acertos = 0;
    questoes.forEach((q, qi) => {
      const respondida = respostas.get(qi);
      document.querySelectorAll(`.alternativa[data-questao="${qi}"]`).forEach(a => {
        a.style.pointerEvents = 'none';
        const ai = Number(a.dataset.alt);
        if (ai === q.correta) a.classList.add('correta');
        else if (ai === respondida) a.classList.add('incorreta');
        a.classList.remove('selecionada');
      });
      if (respondida === q.correta) acertos++;
    });

    const placar = document.getElementById('simulado-placar');
    const btnRefazer = document.getElementById('btn-refazer');
    if (placar) {
      placar.innerHTML = `Resultado: <strong>${acertos}/${questoes.length}</strong> acertos`;
      placar.style.display = '';
    }
    btnOriginal.style.display = 'none';
    if (btnRefazer) btnRefazer.style.display = '';

    // Salva na planilha
    await _salvarResultado(conteudo, acertos, questoes.length);
  });
}

// ── SALVAR RESULTADO ──────────────────────────────────────────────────────────

async function _salvarResultado(conteudo, acertos, total) {
  const API_URL_KEY = 'COLOCAR_AQUI_URL';

  try {
    const { default: apiUrl } = await import('../../modules/api.js').then(m => ({ default: m })).catch(() => ({}));
  } catch (_) {}

  // Importa a URL dinamicamente do api.js
  const mod = await import('../../modules/api.js');

  const payload = {
    acao:      'salvar_resultado',
    aluno:     _aluno.nome,
    turma:     _aluno.turma,
    simulado:  conteudo.titulo,
    professor: conteudo.professor,
    materia:   conteudo.materia,
    acertos,
    total,
    nota:      `${acertos}/${total}`,
    data:      new Date().toISOString(),
  };

  try {
    await mod.publicarConteudo(payload);
    _mostrarToast('✅ Resultado salvo!');
  } catch (e) {
    console.warn('[alunos] Não foi possível salvar resultado:', e.message);
    _mostrarToast('⚠️ Resultado não salvo (verifique a conexão)');
  }
}

function _mostrarToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:2.5rem; left:50%; transform:translateX(-50%);
    background:var(--card); border:1px solid var(--border-strong);
    color:var(--text); font-family:var(--font-mono); font-size:0.78rem;
    padding:0.6rem 1.2rem; border-radius:20px; z-index:9998;
    box-shadow:var(--shadow-card); white-space:nowrap;
    animation: fadeInUp 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── SESSÃO (localStorage) ─────────────────────────────────────────────────────

function _salvarSessao(aluno) {
  try { localStorage.setItem('cej_aluno', JSON.stringify(aluno)); } catch (_) {}
}

function _carregarSessao() {
  try {
    const s = localStorage.getItem('cej_aluno');
    return s ? JSON.parse(s) : null;
  } catch (_) { return null; }
}

function _limparSessao() {
  try { localStorage.removeItem('cej_aluno'); } catch (_) {}
}