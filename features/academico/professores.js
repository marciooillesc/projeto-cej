/**
 * features/academico/professores.js
 * Área do Professor — publicar conteúdos, simulados e ver desempenho das turmas.
 */

import { getEstado } from '../../modules/state.js';
import {
  buscarConteudos, publicarConteudo, removerConteudo,
  filtrarPorProfessor, listarTurmas
} from '../../modules/api.js';
import {
  htmlLoading, htmlVazio, htmlErro, htmlBadgeTipo, formatarData,
  htmlDetalheConteudo, inicializarSimulado
} from '../../modules/ui.js';

export async function renderProfessores(container) {
  const { usuario } = getEstado();
  if (!usuario) { container.innerHTML = htmlErro('Você precisa estar logado.'); return; }
  if (usuario.tipo !== 'professor' && usuario.tipo !== 'admin') {
    container.innerHTML = htmlErro('Acesso restrito a professores.');
    return;
  }
  container.innerHTML = htmlLoading('Carregando…');
  try {
    const todos = await buscarConteudos();
    const meus  = usuario.tipo === 'admin' ? todos : filtrarPorProfessor(todos, usuario.nome);
    _renderDashboard(container, meus, usuario);
  } catch (e) {
    container.innerHTML = htmlErro(e.message);
  }
}

function _renderDashboard(container, conteudos, usuario) {
  const turmas = listarTurmas(conteudos);
  container.innerHTML = `
    <div class="page-header">
      <span class="page-header__eyebrow">Professor</span>
      <h1 class="page-header__titulo">Olá, ${_esc(usuario.nome.split(' ')[0])} 👋</h1>
      <p class="page-header__desc">Gerencie seus conteúdos e publique para suas turmas.</p>
    </div>
    <div class="prof-stats">
      <div class="prof-stat">
        <span class="prof-stat__num">${conteudos.length}</span>
        <span class="prof-stat__label">Publicações</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat__num">${conteudos.filter(c=>c.tipo==='simulado').length}</span>
        <span class="prof-stat__label">Simulados</span>
      </div>
      <div class="prof-stat">
        <span class="prof-stat__num">${turmas.length}</span>
        <span class="prof-stat__label">Turmas</span>
      </div>
    </div>
    <div class="prof-tabs">
      <button class="prof-tab ativo" data-tab="conteudos">📚 Meus Conteúdos</button>
      <button class="prof-tab" data-tab="publicar">✏️ Publicar</button>
    </div>
    <div id="prof-painel-conteudos" class="prof-painel ativo">${_htmlLista(conteudos)}</div>
    <div id="prof-painel-publicar"  class="prof-painel">${_htmlForm(usuario)}</div>
  `;
  _bindTabs(container);
  _bindLista(container, conteudos, usuario);
  _bindForm(container, usuario);
}

/* ── LISTA ──────────────────────────────────────────────────────────────────── */
function _htmlLista(conteudos) {
  if (!conteudos.length) return htmlVazio({ icone:'📭', titulo:'Nada publicado ainda', desc:'Clique em "Publicar" para criar seu primeiro conteúdo.' });
  const chips = ['todos','conteudo','atividade','material','simulado'].map(f =>
    `<button class="filtro-chip${f==='todos'?' ativo':''}" data-filtro="${f}">${f==='todos'?'Todos':f.charAt(0).toUpperCase()+f.slice(1)}</button>`
  ).join('');
  const itens = conteudos.map((c,i) => `
    <div class="conteudo-item card--clicavel" data-idx="${i}" data-tipo="${c.tipo}">
      ${htmlBadgeTipo(c.tipo)}
      <div class="conteudo-item__info">
        <div class="conteudo-item__titulo">${_esc(c.titulo)}</div>
        <div class="conteudo-item__meta">
          ${c.materia?`<span>${_esc(c.materia)}</span>`:''}
          ${c.turma?`<span class="conteudo-item__meta-sep"></span><span>${_esc(c.turma)}</span>`:''}
          ${c.data_de_publicacao?`<span class="conteudo-item__meta-sep"></span><span>${formatarData(c.data_de_publicacao)}</span>`:''}
        </div>
      </div>
      <div class="conteudo-item__acoes">
        <button class="btn btn--ghost btn--sm" data-open="${i}">Abrir</button>
        <button class="btn btn--danger-ghost btn--sm" data-remove="${i}" data-titulo="${_esc(c.titulo)}" data-prof="${_esc(c.professor)}">🗑</button>
      </div>
    </div>
  `).join('');
  return `<div class="filtros-wrap">${chips}</div><div id="lista-conteudos">${itens}</div>`;
}

function _bindLista(container, conteudos, usuario) {
  container.querySelectorAll('.filtro-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filtro-chip').forEach(c => c.classList.remove('ativo'));
      chip.classList.add('ativo');
      document.getElementById('lista-conteudos')?.querySelectorAll('.conteudo-item').forEach(el => {
        el.style.display = chip.dataset.filtro === 'todos' || el.dataset.tipo === chip.dataset.filtro ? '' : 'none';
      });
    });
  });
  container.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _abrirDetalhe(container, conteudos[+btn.dataset.open], conteudos, usuario);
    });
  });
  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(`Remover "${btn.dataset.titulo}"?`)) return;
      btn.disabled = true;
      try { await removerConteudo(btn.dataset.titulo, btn.dataset.prof); await renderProfessores(container); }
      catch(err) { alert('Erro: '+err.message); btn.disabled = false; }
    });
  });
}

function _abrirDetalhe(container, item, conteudos, usuario) {
  const painel = document.getElementById('prof-painel-conteudos');
  painel.innerHTML = htmlDetalheConteudo(item);
  if (item.questoes?.length) inicializarSimulado(item.questoes);
  document.getElementById('btn-detalhe-voltar')?.addEventListener('click', () => {
    painel.innerHTML = _htmlLista(conteudos);
    _bindLista(container, conteudos, usuario);
  });
}

/* ── FORM PUBLICAR ───────────────────────────────────────────────────────────── */
function _htmlForm(usuario) {
  return `
    <div class="form-publicar">
      <h2 class="form-publicar__titulo">Publicar Conteúdo</h2>
      <p class="form-publicar__sub">Publique conteúdos, atividades, materiais ou simulados gerados por IA.</p>
      <div id="pub-msg" class="pub-msg oculto"></div>
      <div class="tipo-select-grupo">
        <label class="tipo-select-op selecionado" data-tipo="conteudo"><span>📄</span>Conteúdo</label>
        <label class="tipo-select-op" data-tipo="atividade"><span>✏️</span>Atividade</label>
        <label class="tipo-select-op" data-tipo="material"><span>📎</span>Material</label>
        <label class="tipo-select-op" data-tipo="simulado"><span>🧠</span>Simulado IA</label>
      </div>
      <input type="hidden" id="pub-tipo" value="conteudo" />
      <div class="form-grid">
        <div class="form-campo form-campo--full">
          <label>Título *</label>
          <input id="pub-titulo" type="text" placeholder="Ex: Introdução ao HTML" />
        </div>
        <div class="form-campo">
          <label>Matéria *</label>
          <input id="pub-materia" type="text" placeholder="Ex: Tecnologia" />
        </div>
        <div class="form-campo">
          <label>Turma *</label>
          <input id="pub-turma" type="text" placeholder="Ex: 7º Ano A" />
        </div>
        <div class="form-campo form-campo--full">
          <label>Descrição *</label>
          <textarea id="pub-descricao" rows="4" placeholder="Descreva o conteúdo…"></textarea>
        </div>
        <div class="form-campo form-campo--full" id="campo-link">
          <label>Link do Google Drive <span class="form-label-opt">(opcional)</span></label>
          <input id="pub-link" type="url" placeholder="https://drive.google.com/…" />
        </div>
        <div class="form-campo" id="campo-download">
          <label>Permitir download?</label>
          <select id="pub-download"><option value="sim">Sim</option><option value="nao">Não</option></select>
        </div>
        <div class="form-campo">
          <label>Publicar em</label>
          <input id="pub-data-pub" type="date" />
        </div>
        <div class="form-campo">
          <label>Encerrar em</label>
          <input id="pub-data-enc" type="date" />
        </div>
        <div id="campos-simulado" class="form-campo--full oculto">
          <div class="simulado-aviso">🤖 O simulado será gerado por IA com base no título e descrição. Pode levar até 1 minuto.</div>
          <div class="form-campo" style="margin-top:.75rem">
            <label>Nº de questões</label>
            <select id="pub-nquestoes">
              <option value="5">5</option><option value="10" selected>10</option>
              <option value="15">15</option><option value="20">20</option>
            </select>
          </div>
        </div>
      </div>
      <button class="btn btn--primary btn--publicar" id="btn-pub">Publicar</button>
    </div>
  `;
}

function _bindForm(container, usuario) {
  container.querySelectorAll('.tipo-select-op').forEach(op => {
    op.addEventListener('click', () => {
      container.querySelectorAll('.tipo-select-op').forEach(o => o.classList.remove('selecionado'));
      op.classList.add('selecionado');
      document.getElementById('pub-tipo').value = op.dataset.tipo;
      const isSimulado = op.dataset.tipo === 'simulado';
      document.getElementById('campos-simulado')?.classList.toggle('oculto', !isSimulado);
      document.getElementById('campo-link')?.classList.toggle('oculto', isSimulado);
      document.getElementById('campo-download')?.classList.toggle('oculto', isSimulado);
    });
  });

  document.getElementById('btn-pub')?.addEventListener('click', async () => {
    const tipo      = document.getElementById('pub-tipo').value;
    const titulo    = document.getElementById('pub-titulo').value.trim();
    const materia   = document.getElementById('pub-materia').value.trim();
    const turma     = document.getElementById('pub-turma').value.trim();
    const descricao = document.getElementById('pub-descricao').value.trim();
    const link      = document.getElementById('pub-link')?.value.trim() || '';
    const download  = document.getElementById('pub-download')?.value || 'sim';
    const dataPub   = document.getElementById('pub-data-pub').value;
    const dataEnc   = document.getElementById('pub-data-enc').value;
    const nQ        = document.getElementById('pub-nquestoes')?.value || '10';
    const msg       = document.getElementById('pub-msg');
    const btn       = document.getElementById('btn-pub');

    if (!titulo || !materia || !turma || !descricao) {
      _msg(msg,'erro','Preencha título, matéria, turma e descrição.'); return;
    }
    btn.disabled = true;
    btn.textContent = tipo === 'simulado' ? '🤖 Gerando… (até 1 min)' : 'Publicando…';
    try {
      await publicarConteudo({
        professor: usuario.nome, tipo, titulo, materia, turma, descricao,
        link, permitir_download: download,
        data_de_publicacao: dataPub, data_de_encerramento: dataEnc,
        ...(tipo === 'simulado' && { num_questoes: nQ }),
      });
      _msg(msg,'sucesso',`✅ "${titulo}" publicado com sucesso!`);
      ['pub-titulo','pub-materia','pub-turma','pub-descricao','pub-link']
        .forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    } catch(err) {
      _msg(msg,'erro','Erro: '+err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Publicar';
  });
}

/* ── TABS ────────────────────────────────────────────────────────────────────── */
function _bindTabs(container) {
  container.querySelectorAll('.prof-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.prof-tab').forEach(t=>t.classList.remove('ativo'));
      container.querySelectorAll('.prof-painel').forEach(p=>p.classList.remove('ativo'));
      tab.classList.add('ativo');
      document.getElementById(`prof-painel-${tab.dataset.tab}`)?.classList.add('ativo');
    });
  });
}

function _msg(el, tipo, texto) {
  el.className = `pub-msg pub-msg--${tipo}`;
  el.textContent = texto;
  el.classList.remove('oculto');
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _esc(str) {
  if (typeof str !== 'string') return str ?? '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
