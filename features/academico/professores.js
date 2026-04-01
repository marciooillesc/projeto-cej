/**
 * features/academico/professores.js
 * Área dos professores: listagem, publicação e remoção de conteúdos.
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

// ── CONSTANTES ────────────────────────────────────────────────────────────────

const PROFESSORES = [
  'Marcio Oilles',
];

const NIVEIS = [
  { label: 'Ensino Infantil',       turmas: ['Infantil I', 'Infantil II', 'Infantil III'] },
  { label: 'Ensino Fundamental I',  turmas: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'] },
  { label: 'Ensino Fundamental II', turmas: ['6º Ano', '7º Ano', '8º Ano', '9º Ano'] },
  { label: 'Ensino Médio',          turmas: ['1ª Série', '2ª Série', '3ª Série'] },
];

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const API_URL = '

// Helper: label com asterisco de obrigatório
const LABEL_OBR = texto => `${texto} <span style="color:var(--danger)">*</span>`;

// ── ESTADO LOCAL ──────────────────────────────────────────────────────────────

let _todos      = [];
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
    _filtroProf = professor || professores[0] || PROFESSORES[0];
    _filtroTipo = '';
    _renderListagem(container, professores);
  } catch (err) {
    renderizar(container, htmlErro(err.message));
  }
}

// ── LISTAGEM ──────────────────────────────────────────────────────────────────

function _renderListagem(container, professores) {
  const todosProfs = [...new Set([...PROFESSORES, ...professores])];
  const profOpts = todosProfs.map(p =>
    `<option value="${p}" ${p === _filtroProf ? 'selected' : ''}>${p}</option>`
  ).join('');

  const tipos  = ['', 'atividade', 'conteudo', 'material', 'simulado'];
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
        <span class="page-header__eyebrow">Acadêmico</span>
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
  return filtrarPorTipo(filtrarPorProfessor(_todos, _filtroProf), _filtroTipo);
}

function _bindListagem(container, professores) {
  container.querySelector('#select-professor')?.addEventListener('change', e => {
    _filtroProf = e.target.value;
    setEstado({ professor: _filtroProf });
    _atualizarLista(container);
  });

  container.querySelector('#chips-tipo')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-tipo]');
    if (!chip) return;
    _filtroTipo = chip.dataset.tipo;
    container.querySelectorAll('.chip[data-tipo]').forEach(c => c.classList.remove('ativo'));
    chip.classList.add('ativo');
    _atualizarLista(container);
  });

  container.querySelector('#btn-recarregar')?.addEventListener('click', async () => {
    limparCache();
    await renderProfessores(container);
  });

  container.querySelector('#btn-novo-conteudo')?.addEventListener('click', () => {
    _renderSenha(container, professores);
  });

  container.querySelector('#lista-conteudos')?.addEventListener('click', async e => {
    const btnAbrir = e.target.closest('[data-abrir]');
    if (btnAbrir) {
      const item = _aplicarFiltros()[Number(btnAbrir.dataset.abrir)];
      if (item) _renderDetalhe(container, item, professores);
      return;
    }
    const btnRemover = e.target.closest('[data-remover]');
    if (btnRemover) {
      const item = _aplicarFiltros()[Number(btnRemover.dataset.remover)];
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
}

function _atualizarLista(container) {
  const lista = container.querySelector('#lista-conteudos');
  if (!lista) return;
  const filtrados = _aplicarFiltros();
  lista.innerHTML = filtrados.length > 0
    ? filtrados.map((item, idx) => _htmlItemGerenciavel(item, idx)).join('')
    : htmlVazio({ icone: '📭', titulo: 'Sem conteúdos', desc: 'Nenhum item encontrado.' });
  container.querySelectorAll('.chip[data-tipo]').forEach(c => {
    c.classList.toggle('ativo', c.dataset.tipo === _filtroTipo);
  });
}

// ── DETALHE ───────────────────────────────────────────────────────────────────

function _renderDetalhe(container, conteudo, professores) {
  renderizar(container, htmlDetalheConteudo(conteudo));
  container.querySelector('#btn-detalhe-voltar')?.addEventListener('click', () => {
    _renderListagem(container, professores ?? listarProfessores(_todos));
  });
  if (conteudo.questoes?.length > 0) inicializarSimulado(conteudo.questoes);
}

// ── SENHA ─────────────────────────────────────────────────────────────────────

function _renderSenha(container, professores) {
  renderizar(container, `
    <div style="max-width:360px;margin:4rem auto;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:1rem">🔒</div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:var(--text);margin-bottom:0.4rem">Área restrita</div>
      <p style="color:var(--text-3);font-size:0.88rem;margin-bottom:1.5rem">Digite a senha para publicar conteúdos.</p>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <input id="input-senha" type="password" class="input-custom" placeholder="Senha" autocomplete="current-password" />
        <p id="senha-erro" style="color:var(--danger);font-size:0.82rem;display:none">Senha incorreta.</p>
        <div style="display:flex;gap:0.75rem">
          <button class="btn btn--ghost" id="btn-senha-cancelar" style="flex:1;justify-content:center">Cancelar</button>
          <button class="btn btn--primary" id="btn-senha-confirmar" style="flex:1;justify-content:center">Entrar</button>
        </div>
      </div>
    </div>
  `);
  const input = container.querySelector('#input-senha');
  const erro  = container.querySelector('#senha-erro');
  const confirmar = () => {
    if (input.value === 'REMOVIDO') {
      _renderFormulario(container, professores);
    } else {
      erro.style.display = '';
      input.value = '';
      input.focus();
    }
  };
  container.querySelector('#btn-senha-confirmar')?.addEventListener('click', confirmar);
  container.querySelector('#btn-senha-cancelar')?.addEventListener('click', () => _renderListagem(container, professores));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') confirmar(); });
  input.focus();
}

// ── FORMULÁRIO ────────────────────────────────────────────────────────────────

function _htmlNiveisOpts() {
  return NIVEIS.map(n =>
    `<optgroup label="${n.label}">${n.turmas.map(t => `<option value="${t}">${t}</option>`).join('')}</optgroup>`
  ).join('') + `<option value="Todas as turmas">Todas as turmas</option>`;
}

function _renderFormulario(container, professores) {
  const hoje = new Date().toISOString().split('T')[0];
  const profOpts = `<option value="">Selecione...</option>` +
    PROFESSORES.map(p => `<option value="${p}">${p}</option>`).join('');
  const letrasOpts = `<option value="">Selecione...</option>` +
    LETRAS.map(l => `<option value="${l}">${l}</option>`).join('');

  renderizar(container, `
    <div style="max-width:700px">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button class="detalhe__voltar" id="btn-form-voltar">← Voltar</button>
        <div>
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-3);letter-spacing:0.1em;text-transform:uppercase">Publicar conteúdo</div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:var(--text)">Novo Conteúdo</div>
        </div>
      </div>

      <p style="font-size:0.75rem;color:var(--text-3);margin-bottom:1rem">
        Campos com <span style="color:var(--danger);font-weight:700">*</span> são obrigatórios.
      </p>

      <div class="card" style="display:flex;flex-direction:column;gap:1.25rem">

        <!-- Professor -->
        <div>
          <label class="form-label">${LABEL_OBR('Professor')}</label>
          <select id="form-professor" class="select-custom" style="width:100%">${profOpts}</select>
        </div>

        <!-- Matéria -->
        <div>
          <label class="form-label">${LABEL_OBR('Matéria')}</label>
          <input id="form-materia" type="text" class="input-custom" placeholder="Ex: Educação Digital, Matemática..." />
        </div>

        <!-- Nível + Letra -->
        <div class="grid-2" style="gap:0.75rem">
          <div>
            <label class="form-label">${LABEL_OBR('Nível / Ano')}</label>
            <select id="form-turma-nivel" class="select-custom" style="width:100%">
              <option value="">Selecione o nível...</option>
              ${_htmlNiveisOpts()}
            </select>
          </div>
          <div id="form-turma-letra-wrap">
            <label class="form-label">${LABEL_OBR('Turma — letra')}</label>
            <select id="form-turma-letra" class="select-custom" style="width:100%">${letrasOpts}</select>
          </div>
        </div>

        <!-- Tipo -->
        <div>
          <label class="form-label">${LABEL_OBR('Tipo de conteúdo')}</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="form-tipo-chips">
            ${['conteudo','atividade','material','simulado'].map(t =>
              `<span class="chip ${t === 'conteudo' ? 'ativo' : ''}" data-tipo-form="${t}"
                style="cursor:pointer;padding:6px 14px;font-size:0.8rem">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`
            ).join('')}
          </div>
          <input type="hidden" id="form-tipo" value="conteudo" />
        </div>

        <!-- Título -->
        <div>
          <label class="form-label">${LABEL_OBR('Título')}</label>
          <input id="form-titulo" type="text" class="input-custom" placeholder="Título do conteúdo" />
        </div>

        <!-- Descrição -->
        <div>
          <label class="form-label" id="label-descricao">${LABEL_OBR('Descrição')}</label>
          <textarea id="form-descricao" class="textarea-custom" placeholder="Descreva o conteúdo..." style="min-height:90px"></textarea>
        </div>

        <!-- Datas -->
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

        <!-- Extra simulado -->
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
          <p style="font-size:0.78rem;color:var(--text-3)">As questões serão geradas pela IA ao publicar.</p>
        </div>

        <!-- Upload de arquivo -->
        <div id="form-arquivo-wrap">
          <label class="form-label">Arquivo (opcional)</label>
          <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
            <label class="btn btn--ghost btn--sm" for="form-arquivo-input" style="cursor:pointer">
              📎 Selecionar arquivo
            </label>
            <input type="file" id="form-arquivo-input"
              accept=".pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              style="display:none" />
            <span id="form-arquivo-nome" style="font-size:0.82rem;color:var(--text-3);font-family:var(--font-mono)">
              Nenhum arquivo selecionado
            </span>
          </div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="form-permitir-download" style="accent-color:var(--primary)" checked />
            <label for="form-permitir-download" style="font-size:0.82rem;color:var(--text-2);cursor:pointer">
              Permitir download pelo aluno
            </label>
          </div>
          <p style="font-size:0.75rem;color:var(--text-3);margin-top:6px;line-height:1.5">
            Aceita PDF, imagens e documentos. O arquivo será salvo automaticamente no Google Drive do colégio.
          </p>
          <div id="form-arquivo-progresso" style="display:none;margin-top:8px">
            <div style="height:4px;background:var(--bg-2);border-radius:4px;overflow:hidden">
              <div id="form-arquivo-barra" style="height:100%;width:0%;background:var(--primary);transition:width 0.3s"></div>
            </div>
            <span id="form-arquivo-status" style="font-size:0.75rem;color:var(--text-3);font-family:var(--font-mono);margin-top:4px;display:block"></span>
          </div>
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

  container.querySelectorAll('.form-label').forEach(el => {
    el.style.cssText = 'font-size:0.78rem;color:var(--text-3);font-family:var(--font-mono);letter-spacing:0.08em;display:block;margin-bottom:5px;text-transform:uppercase';
  });

  _bindFormulario(container, professores);
}

function _bindFormulario(container, professores) {
  container.querySelector('#btn-form-voltar')?.addEventListener('click', () => _renderListagem(container, professores));
  container.querySelector('#btn-form-cancelar')?.addEventListener('click', () => _renderListagem(container, professores));

  // Chips de tipo
  container.querySelector('#form-tipo-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-tipo-form]');
    if (!chip) return;
    container.querySelectorAll('[data-tipo-form]').forEach(c => c.classList.remove('ativo'));
    chip.classList.add('ativo');
    const tipo = chip.dataset.tipoForm;
    container.querySelector('#form-tipo').value = tipo;
    container.querySelector('#form-simulado-extra').style.display = tipo === 'simulado' ? 'flex' : 'none';
    container.querySelector('#form-arquivo-wrap').style.display   = tipo === 'simulado' ? 'none' : '';
    const ld = container.querySelector('#label-descricao');
    ld.innerHTML = tipo === 'simulado' ? LABEL_OBR('Descrição / Contexto para a IA') : LABEL_OBR('Descrição');
    ld.style.cssText = 'font-size:0.78rem;color:var(--text-3);font-family:var(--font-mono);letter-spacing:0.08em;display:block;margin-bottom:5px;text-transform:uppercase';
  });

  // Turma: "Todas as turmas" esconde letra
  container.querySelector('#form-turma-nivel')?.addEventListener('change', e => {
    container.querySelector('#form-turma-letra-wrap').style.display =
      e.target.value === 'Todas as turmas' ? 'none' : '';
  });

  // Permanente
  container.querySelector('#form-permanente')?.addEventListener('change', e => {
    container.querySelector('#form-data-enc').disabled = e.target.checked;
    if (e.target.checked) container.querySelector('#form-data-enc').value = '';
  });

  // Preview nome do arquivo
  container.querySelector('#form-arquivo-input')?.addEventListener('change', e => {
    const file  = e.target.files[0];
    const nomeEl = container.querySelector('#form-arquivo-nome');
    nomeEl.textContent = file ? file.name : 'Nenhum arquivo selecionado';
    nomeEl.style.color = file ? 'var(--primary)' : 'var(--text-3)';
  });

  container.querySelector('#btn-form-publicar')?.addEventListener('click', async () => {
    await _submeterFormulario(container, professores);
  });
}

async function _submeterFormulario(container, professores) {
  const get = id => container.querySelector(`#${id}`)?.value?.trim() || '';

  const tipo      = get('form-tipo');
  const professor = get('form-professor');
  const materia   = get('form-materia');
  const nivel     = get('form-turma-nivel');
  const letra     = get('form-turma-letra');
  const turma     = nivel === 'Todas as turmas' ? 'Todas as turmas'
                  : (nivel && letra) ? `${nivel} - Turma ${letra}`
                  : nivel || '';
  const titulo    = get('form-titulo');
  const descricao = get('form-descricao');
  const dataPub   = get('form-data-pub');
  const dataEnc   = container.querySelector('#form-permanente')?.checked ? '' : get('form-data-enc');
  const qtd       = get('form-qtd') || '5';
  const assunto   = get('form-assunto') || descricao;
  const permitirDownload = container.querySelector('#form-permitir-download')?.checked ? 'sim' : 'nao';

  const erroEl = container.querySelector('#form-erro');
  erroEl.style.display = 'none';

  // Validação com lista de campos faltando
  const erros = [];
  if (!professor) erros.push('Professor');
  if (!materia)   erros.push('Matéria');
  if (!nivel)     erros.push('Nível / Ano');
  if (nivel && nivel !== 'Todas as turmas' && !letra) erros.push('Turma (letra)');
  if (!titulo)    erros.push('Título');
  if (!descricao) erros.push('Descrição');

  if (erros.length > 0) {
    erroEl.innerHTML = `<div class="aviso-erro"><span>⚠️</span><span>Preencha os campos obrigatórios: <strong>${erros.join(', ')}</strong></span></div>`;
    erroEl.style.display = '';
    return;
  }

  const btn   = container.querySelector('#btn-form-publicar');
  const label = container.querySelector('#btn-publicar-label');
  btn.disabled = true;

  // Upload de arquivo se houver
  let link = '';
  const arquivo = container.querySelector('#form-arquivo-input')?.files[0];

  if (arquivo) {
    label.textContent = '⏳ Enviando arquivo...';
    container.querySelector('#form-arquivo-progresso').style.display = '';
    try {
      link = await _uploadArquivo(arquivo, container);
      container.querySelector('#form-arquivo-status').textContent = '✅ Arquivo enviado!';
    } catch (err) {
      erroEl.innerHTML = `<div class="aviso-erro"><span>⚠️</span><span>Erro no upload: ${err.message}</span></div>`;
      erroEl.style.display = '';
      btn.disabled = false;
      label.textContent = 'Publicar conteúdo';
      return;
    }
  }

  // Para simulados, exibe contador regressivo para o professor não achar que travou
  let _timerSimulado = null;
  if (tipo === 'simulado') {
    let seg = 0;
    const msgs = [
      '⏳ Gerando questões com IA...',
      '🤖 Consultando IA...',
      '📝 Formulando questões...',
      '🔍 Revisando alternativas...',
      '💾 Quase pronto...',
    ];
    label.textContent = msgs[0];
    _timerSimulado = setInterval(() => {
      seg++;
      const msg = msgs[Math.min(Math.floor(seg / 15), msgs.length - 1)];
      label.textContent = `${msg} (${seg}s)`;
    }, 1000);
  } else {
    label.textContent = '⏳ Publicando...';
  }

  try {
    await publicarConteudo({
      professor, materia, turma, tipo, titulo, descricao, link,
      permitir_download: permitirDownload,
      data_de_publicacao:   dataPub,
      data_de_encerramento: dataEnc,
      assunto, tipo_questao: 'objetiva', qtd_questoes: qtd,
    });

    if (_timerSimulado) clearInterval(_timerSimulado);

    _todos = await buscarConteudos(true);
    setEstado({ dadosApi: _todos });
    _renderListagem(container, listarProfessores(_todos));

  } catch (err) {
    if (_timerSimulado) clearInterval(_timerSimulado);
    erroEl.innerHTML = `<div class="aviso-erro"><span>⚠️</span><span>${err.message}</span></div>`;
    erroEl.style.display = '';
    btn.disabled = false;
    label.textContent = 'Publicar conteúdo';
  }
}

// ── UPLOAD DE ARQUIVO ─────────────────────────────────────────────────────────

async function _uploadArquivo(arquivo, container) {
  const barra  = container.querySelector('#form-arquivo-barra');
  const status = container.querySelector('#form-arquivo-status');

  const setProgresso = (pct, msg) => {
    if (barra)  barra.style.width = pct + '%';
    if (status) status.textContent = msg;
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = e => {
      if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 60), 'Lendo arquivo...');
    };

    reader.onload = async () => {
      setProgresso(70, 'Enviando para o Drive...');
      const base64 = reader.result.split(',')[1];
      try {
        const resp = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao:      'upload_arquivo',
            nome:      arquivo.name,
            tipo_mime: arquivo.type,
            base64,
          }),
          redirect: 'follow',
        });
        setProgresso(95, 'Processando...');
        const json = await resp.json();
        if (json.status !== 'ok') throw new Error(json.mensagem || 'Erro no upload');
        setProgresso(100, '');
        resolve(json.link);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsDataURL(arquivo);
  });
}
