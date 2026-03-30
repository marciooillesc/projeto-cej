/**
 * features/academico/professores.js
 * Área dos professores: listagem, publicação, remoção e gerador IA.
 */

import {
  buscarConteudos, filtrarPorProfessor, filtrarPorTipo,
  listarProfessores, publicarConteudo, removerConteudo, limparCache,
} from '../../modules/api.js';
import { setEstado, getEstado } from '../../modules/state.js';
import {
  renderizar, htmlLoading, htmlVazio, htmlErro,
  htmlBadgeTipo, formatarData, htmlDetalheConteudo, inicializarSimulado,
} from '../../modules/ui.js';

let _todos = [];
let _filtroProf = '';
let _filtroTipo = '';

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

export async function renderProfessores(container) {
  renderizar(container, htmlLoading('Carregando conteúdos...'));
  try {
    _todos = await buscarConteudos();
    setEstado({ dadosApi: _todos });
    const professores = listarProfessores(_todos);
    const { professor } = getEstado();
    _filtroProf = professor || professores[0] || '';
    _filtroTipo = '';
    _renderListagem(container, professores);
  } catch (err) {
    renderizar(container, htmlErro(err.message));
  }
}

// ── LISTAGEM ──────────────────────────────────────────────────────────────────

function _renderListagem(container, professores) {
  const profOpts = professores.map(p =>
    `<option value="${p}" ${p === _filtroProf ? 'selected' : ''}>${p}</option>`
  ).join('');

  const tipos = ['', 'atividade', 'conteudo', 'material', 'simulado'];
  const labels = { '': 'Todos', atividade: 'Atividades', conteudo: 'Conteúdos', material: 'Materiais', simulado: 'Simulados' };
  const chipsHTML = tipos.map(t =>
    `<span class="chip ${_filtroTipo === t ? 'ativo' : ''}" data-tipo="${t}">${labels[t]}</span>`
  ).join('');

  const filtrados = _aplicarFiltros();
  const listaHTML = filtrados.length > 0
    ? filtrados.map((item, idx) => _htmlItemGerenciavel(item, idx)).join('')
    : htmlVazio({ icone: '📭', titulo: 'Sem conteúdos', desc: 'Nenhum item encontrado com os filtros atuais.' });

  renderizar(container, `
    <div>
      <div class="page-header">
        <span class="page-header__eyebrow">👩‍🏫 Acadêmico</span>
        <h1 class="page-header__titulo">Professores</h1>
        <p class="page-header__desc">Gerencie e publique conteúdos para as turmas.</p>
      </div>

      <div class="prof-toolbar">
        <select class="select-custom" id="select-professor">${profOpts}</select>
        <div class="chips" id="chips-tipo" style="margin:0">${chipsHTML}</div>
        <button class="btn btn--primary btn--sm" id="btn-novo-conteudo">+ Publicar novo</button>
        <button class="btn btn--ghost btn--sm" id="btn-recarregar">🔄</button>
      </div>

      <div class="conteudo-lista" id="lista-conteudos">${listaHTML}</div>

      ${_htmlGeradorIA()}
    </div>
  `);

  _bindListagem(container, professores);
}

function _htmlItemGerenciavel(item, idx) {
  const encerrado = item.data_de_encerramento && item.data_de_encerramento.trim() !== ''
    ? `<span style="color:var(--warning);font-size:0.72rem;font-family:var(--font-mono)">até ${formatarData(item.data_de_encerramento)}</span>`
    : `<span style="color:var(--success);font-size:0.72rem;font-family:var(--font-mono)">permanente</span>`;

  return `
    <div class="conteudo-item" data-idx="${idx}">
      ${htmlBadgeTipo(item.tipo)}
      <div class="conteudo-item__info" style="cursor:pointer" data-abrir="${idx}">
        <div class="conteudo-item__titulo">${item.titulo}</div>
        <div class="conteudo-item__meta">
          <span>${item.materia || ''}</span>
          <span class="conteudo-item__meta-sep"></span>
          <span>${item.turma || ''}</span>
          <span class="conteudo-item__meta-sep"></span>
          ${encerrado}
        </div>
      </div>
      <div class="conteudo-item__acoes" style="display:flex;gap:6px">
        <button class="btn btn--ghost btn--sm" data-abrir="${idx}">Abrir</button>
        <button class="btn btn--danger btn--sm" data-remover="${idx}" title="Remover">🗑</button>
      </div>
    </div>
  `;
}

function _aplicarFiltros() {
  let d = filtrarPorProfessor(_todos, _filtroProf);
  return filtrarPorTipo(d, _filtroTipo);
}

function _bindListagem(container, professores) {
  container.querySelector('#select-professor')?.addEventListener('change', e => {
    _filtroProf = e.target.value;
    setEstado({ professor: _filtroProf });
    _atualizarLista(container, professores);
  });

  container.querySelector('#chips-tipo')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-tipo]');
    if (!chip) return;
    _filtroTipo = chip.dataset.tipo;
    container.querySelectorAll('.chip[data-tipo]').forEach(c => c.classList.remove('ativo'));
    chip.classList.add('ativo');
    _atualizarLista(container, professores);
  });

  container.querySelector('#btn-recarregar')?.addEventListener('click', async () => {
    limparCache();
    await renderProfessores(container);
  });

  container.querySelector('#btn-novo-conteudo')?.addEventListener('click', () => {
    _renderFormulario(container, professores);
  });

  container.querySelector('#lista-conteudos')?.addEventListener('click', async e => {
    // Abrir detalhe
    const btnAbrir = e.target.closest('[data-abrir]');
    if (btnAbrir) {
      const idx = Number(btnAbrir.dataset.abrir);
      const item = _aplicarFiltros()[idx];
      if (item) _renderDetalhe(container, item, professores);
      return;
    }

    // Remover
    const btnRemover = e.target.closest('[data-remover]');
    if (btnRemover) {
      const idx = Number(btnRemover.dataset.remover);
      const item = _aplicarFiltros()[idx];
      if (!item) return;
      if (!confirm(`Remover "${item.titulo}"?`)) return;
      try {
        await removerConteudo(item.titulo, item.professor);
        _todos = await buscarConteudos(true);
        _renderListagem(container, listarProfessores(_todos));
      } catch (err) {
        alert('Erro ao remover: ' + err.message);
      }
    }
  });

  // Gerador IA
  container.querySelector('#btn-gerar-ia')?.addEventListener('click', () => {
    _executarGerarIA(container);
  });
}

function _atualizarLista(container, professores) {
  const lista = container.querySelector('#lista-conteudos');
  if (!lista) return;
  const filtrados = _aplicarFiltros();
  lista.innerHTML = filtrados.length > 0
    ? filtrados.map((item, idx) => _htmlItemGerenciavel(item, idx)).join('')
    : htmlVazio({ icone: '📭', titulo: 'Sem conteúdos', desc: 'Nenhum item encontrado.' });
  _bindListagem(container, professores);
}

// ── DETALHE ───────────────────────────────────────────────────────────────────

function _renderDetalhe(container, conteudo, professores) {
  renderizar(container, htmlDetalheConteudo(conteudo));
  container.querySelector('#btn-detalhe-voltar')?.addEventListener('click', () => {
    _renderListagem(container, professores ?? listarProfessores(_todos));
  });
  if (conteudo.questoes?.length > 0) {
    inicializarSimulado(conteudo.questoes);
  }
}

// ── FORMULÁRIO DE PUBLICAÇÃO ──────────────────────────────────────────────────

function _renderFormulario(container, professores) {
  const hoje = new Date().toISOString().split('T')[0];
  const profOpts = professores.map(p => `<option value="${p}">${p}</option>`).join('');

  renderizar(container, `
    <div style="max-width:680px">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button class="detalhe__voltar" id="btn-form-voltar">← Voltar</button>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-3);letter-spacing:0.1em;text-transform:uppercase">Publicar conteúdo</div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:var(--text)">Novo Conteúdo</div>
        </div>
      </div>

      <div class="card" style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Linha 1: Professor / Matéria / Turma -->
        <div class="grid-2" style="grid-template-columns:1fr 1fr 1fr;gap:0.75rem">
          <div>
            <label class="form-label">Professor</label>
            <select id="form-professor" class="select-custom" style="width:100%">
              ${profOpts}
            </select>
          </div>
          <div>
            <label class="form-label">Matéria</label>
            <input id="form-materia" type="text" class="input-custom" placeholder="Ex: Tecnologia" />
          </div>
          <div>
            <label class="form-label">Turma</label>
            <input id="form-turma" type="text" class="input-custom" placeholder="Ex: 8º Ano" />
          </div>
        </div>

        <!-- Linha 2: Tipo -->
        <div>
          <label class="form-label">Tipo de conteúdo</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="form-tipo-chips">
            ${['conteudo','atividade','material','simulado'].map(t =>
              `<span class="chip ${t === 'conteudo' ? 'ativo' : ''}" data-tipo-form="${t}"
                style="cursor:pointer;padding:6px 14px;font-size:0.8rem">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`
            ).join('')}
          </div>
          <input type="hidden" id="form-tipo" value="conteudo" />
        </div>

        <!-- Linha 3: Título -->
        <div>
          <label class="form-label">Título</label>
          <input id="form-titulo" type="text" class="input-custom" placeholder="Título do conteúdo" />
        </div>

        <!-- Linha 4: Descrição / Assunto -->
        <div>
          <label class="form-label" id="label-descricao">Descrição</label>
          <textarea id="form-descricao" class="textarea-custom" placeholder="Descreva o conteúdo..." style="min-height:90px"></textarea>
        </div>

        <!-- Linha 5: Datas -->
        <div class="grid-2" style="gap:0.75rem">
          <div>
            <label class="form-label">Data de publicação</label>
            <input id="form-data-pub" type="date" class="input-custom" value="${hoje}" />
          </div>
          <div>
            <label class="form-label">Data de encerramento</label>
            <div style="display:flex;align-items:center;gap:8px">
              <input id="form-data-enc" type="date" class="input-custom" style="flex:1" />
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;font-size:0.82rem;color:var(--text-2)">
                <input type="checkbox" id="form-permanente" style="accent-color:var(--primary)" />
                Permanente
              </label>
            </div>
          </div>
        </div>

        <!-- Campos extras para simulado -->
        <div id="form-simulado-extra" style="display:none;flex-direction:column;gap:0.75rem;
          background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:1rem">
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--primary);letter-spacing:0.1em;text-transform:uppercase">
            ✨ Geração automática de questões via IA
          </div>
          <div class="grid-2" style="gap:0.75rem">
            <div>
              <label class="form-label">Quantidade de questões</label>
              <select id="form-qtd" class="select-custom" style="width:100%">
                <option value="3">3 questões</option>
                <option value="5" selected>5 questões</option>
                <option value="8">8 questões</option>
                <option value="10">10 questões</option>
              </select>
            </div>
            <div>
              <label class="form-label">Assunto específico (opcional)</label>
              <input id="form-assunto" type="text" class="input-custom" placeholder="Ex: Equações do 1º grau" />
            </div>
          </div>
          <p style="font-size:0.78rem;color:var(--text-3)">
            As questões serão geradas automaticamente pela IA ao publicar, com base no título e assunto informados.
          </p>
        </div>

        <!-- Link opcional -->
        <div>
          <label class="form-label">Link (opcional)</label>
          <input id="form-link" type="url" class="input-custom" placeholder="https://..." />
        </div>

        <!-- Erro e botão -->
        <div id="form-erro" style="display:none"></div>

        <div style="display:flex;gap:0.75rem;justify-content:flex-end">
          <button class="btn btn--ghost" id="btn-form-cancelar">Cancelar</button>
          <button class="btn btn--primary" id="btn-form-publicar">
            <span id="btn-publicar-label">Publicar conteúdo</span>
          </button>
        </div>

      </div>
    </div>
  `);

  // Adiciona estilo de label inline
  container.querySelectorAll('.form-label').forEach(el => {
    el.style.cssText = 'font-size:0.78rem;color:var(--text-3);font-family:var(--font-mono);letter-spacing:0.08em;display:block;margin-bottom:5px;text-transform:uppercase';
  });

  _bindFormulario(container, professores);
}

function _bindFormulario(container, professores) {
  // Voltar
  container.querySelector('#btn-form-voltar')?.addEventListener('click', () => {
    _renderListagem(container, professores);
  });
  container.querySelector('#btn-form-cancelar')?.addEventListener('click', () => {
    _renderListagem(container, professores);
  });

  // Chips de tipo
  container.querySelector('#form-tipo-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-tipo-form]');
    if (!chip) return;
    container.querySelectorAll('[data-tipo-form]').forEach(c => c.classList.remove('ativo'));
    chip.classList.add('ativo');
    const tipo = chip.dataset.tipoForm;
    container.querySelector('#form-tipo').value = tipo;
    // Mostra/oculta extras de simulado
    const extra = container.querySelector('#form-simulado-extra');
    extra.style.display = tipo === 'simulado' ? 'flex' : 'none';
    // Ajusta label descrição
    container.querySelector('#label-descricao').textContent =
      tipo === 'simulado' ? 'Descrição / Contexto para a IA' : 'Descrição';
  });

  // Permanente
  container.querySelector('#form-permanente')?.addEventListener('change', e => {
    container.querySelector('#form-data-enc').disabled = e.target.checked;
    if (e.target.checked) container.querySelector('#form-data-enc').value = '';
  });

  // Publicar
  container.querySelector('#btn-form-publicar')?.addEventListener('click', async () => {
    await _submeterFormulario(container, professores);
  });
}

async function _submeterFormulario(container, professores) {
  const get = id => container.querySelector(`#${id}`)?.value?.trim() || '';

  const tipo       = get('form-tipo');
  const professor  = get('form-professor');
  const materia    = get('form-materia');
  const turma      = get('form-turma');
  const titulo     = get('form-titulo');
  const descricao  = get('form-descricao');
  const dataPub    = get('form-data-pub');
  const dataEnc    = container.querySelector('#form-permanente')?.checked ? '' : get('form-data-enc');
  const link       = get('form-link');
  const qtd        = get('form-qtd') || '5';
  const assunto    = get('form-assunto') || descricao;

  const erroEl = container.querySelector('#form-erro');
  erroEl.style.display = 'none';

  if (!professor || !materia || !turma || !titulo || !descricao) {
    erroEl.innerHTML = `<div class="aviso-erro"><span>⚠️</span><span>Preencha todos os campos obrigatórios.</span></div>`;
    erroEl.style.display = '';
    return;
  }

  const btn = container.querySelector('#btn-form-publicar');
  const label = container.querySelector('#btn-publicar-label');
  btn.disabled = true;
  label.textContent = tipo === 'simulado' ? '⏳ Gerando questões com IA...' : '⏳ Publicando...';

  try {
    await publicarConteudo({
      professor,
      materia,
      turma,
      tipo,
      titulo,
      descricao,
      link,
      data_de_publicacao:   dataPub,
      data_de_encerramento: dataEnc,
      // Campos extras para simulado
      assunto,
      tipo_questao: 'objetiva',
      qtd_questoes: qtd,
    });

    // Recarrega e volta para listagem
    _todos = await buscarConteudos(true);
    setEstado({ dadosApi: _todos });
    _renderListagem(container, listarProfessores(_todos));

  } catch (err) {
    erroEl.innerHTML = `<div class="aviso-erro"><span>⚠️</span><span>${err.message}</span></div>`;
    erroEl.style.display = '';
    btn.disabled = false;
    label.textContent = 'Publicar conteúdo';
  }
}

// ── GERADOR IA (standalone) ───────────────────────────────────────────────────

function _htmlGeradorIA() {
  return `
    <div class="ia-card" id="ia-card" style="margin-top:2rem">
      <div class="ia-card__titulo">✨ Testar Gerador com IA</div>
      <p class="ia-card__sub">Gere um rascunho de conteúdo para usar como base antes de publicar.</p>
      <div class="ia-card__form">
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap">
          <select class="select-custom" id="ia-tipo" style="flex:0 0 auto">
            <option value="conteudo">Conteúdo</option>
            <option value="atividade">Atividade</option>
            <option value="simulado">Simulado</option>
          </select>
          <input type="text" class="input-custom" id="ia-materia" placeholder="Matéria" style="flex:1;min-width:120px" />
          <input type="text" class="input-custom" id="ia-turma" placeholder="Turma" style="flex:0 0 110px" />
        </div>
        <textarea class="textarea-custom" id="ia-tema" placeholder="Descreva o tema..."></textarea>
        <div style="display:flex;gap:0.75rem;align-items:center">
          <button class="btn btn--primary" id="btn-gerar-ia">✨ Gerar rascunho</button>
          <span id="ia-status" style="font-size:0.82rem;color:var(--text-3)"></span>
        </div>
      </div>
      <div class="ia-card__resultado" id="ia-resultado"></div>
    </div>
  `;
}

async function _executarGerarIA(container) {
  const tema    = container.querySelector('#ia-tema')?.value?.trim();
  const btn     = container.querySelector('#btn-gerar-ia');
  const status  = container.querySelector('#ia-status');
  const result  = container.querySelector('#ia-resultado');

  if (!tema) {
    container.querySelector('#ia-tema')?.focus();
    status.textContent = '⚠️ Informe um tema.';
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Gerando...';
  status.textContent = 'Comunicando com a IA...';
  result.classList.remove('visivel');

  try {
    const { gerarConteudoIA } = await import('../../modules/api.js');
    const texto = await gerarConteudoIA(tema, {
      tipo:    container.querySelector('#ia-tipo')?.value,
      materia: container.querySelector('#ia-materia')?.value,
      turma:   container.querySelector('#ia-turma')?.value,
    });
    result.textContent = texto;
    result.classList.add('visivel');
    status.textContent = '✅ Pronto.';
  } catch (err) {
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Gerar rascunho';
  }
}