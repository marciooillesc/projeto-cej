/**
 * main.js
 * Entrada principal do SPA RPR Academy.
 * Inicializa módulos, registra rotas e gerencia transições.
 */

import { getEstado, setEstado } from './modules/state.js';
import { inicializarRouter, registrarRota, navegar } from './modules/router.js';
import { renderProfessores } from './features/academico/professores.js';
import { renderAlunos } from './features/academico/alunos.js';
import { JOGOS, buscarJogo } from './features/jogos/index.js';

// ── ELEMENTOS DOM ──────────────────────────────────────────────────────────────
const elTelaInicial  = document.getElementById('tela-inicial');
const elApp          = document.getElementById('app');
const elSidebarNav   = document.getElementById('sidebar-nav');
const elSidebarTag   = document.getElementById('sidebar-modo-tag');
const elConteudoView = document.getElementById('conteudo-view');
const btnVoltar      = document.getElementById('btn-voltar');
const elRodape       = document.querySelector('.rodape-fixo');
const btnJogos       = document.getElementById('btn-jogos');
const btnAcademico   = document.getElementById('btn-academico');

// ── INICIALIZAÇÃO ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inicializarRouter(elConteudoView);
  _registrarRotas();
  _bindBotoesInicio();
  _bindBotaoVoltar();
});

// ── ROTAS ──────────────────────────────────────────────────────────────────────
function _registrarRotas() {
  // ── Acadêmico
  registrarRota('professores', async (container) => {
    await renderProfessores(container);
  });

  registrarRota('alunos', (container) => {
    renderAlunos(container);
  });

  // ── Jogos: listagem geral
  registrarRota('jogos-home', (container) => {
    _renderJogosHome(container);
  });

  // ── Jogos: cada jogo registrado
  JOGOS.forEach(jogo => {
    registrarRota(`jogo-${jogo.id}`, (container) => {
      jogo.modulo.render(container);
      jogo.modulo.init(container);
    });
  });
}

// ── TRANSIÇÃO: INÍCIO → APP ────────────────────────────────────────────────────
function _ativarModo(modo) {
  setEstado({ modo, tela: modo });

  // Animação de saída da tela inicial
  elTelaInicial.classList.add('saindo');

  setTimeout(() => {
    elTelaInicial.style.display = 'none';
    elApp.style.display = '';          // restaura display antes de remover oculto
    elApp.classList.remove('app--oculto');
    elApp.classList.add('entrando');
    setTimeout(() => elApp.classList.remove('entrando'), 400);

    // No desktop, desloca o rodapé para alinhar com o conteúdo (após a sidebar).
    // No mobile, o CSS cuida disso com left: 0 !important — não sobrepomos.
    if (window.innerWidth > 768) {
      elRodape.style.left = 'var(--sidebar-w)';
    }
    _construirSidebar(modo);

    // Navega para rota padrão do modo
    if (modo === 'jogos') {
      navegar('jogos-home');
    } else {
      navegar('professores');
    }
  }, 350);
}

// ── TRANSIÇÃO: APP → INÍCIO ────────────────────────────────────────────────────
function _voltarInicio() {
  setEstado({ modo: null, tela: 'inicial', sidebarAtiva: null });

  // 1) Fade-out suave do app (0.35s), depois troca as telas
  elApp.style.opacity = '0';
  elApp.style.transition = 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

  setTimeout(() => {
    // 2) Esconde o app após o fade terminar
    elApp.style.display = 'none';
    elApp.style.opacity = '';
    elApp.style.transition = '';
    elApp.classList.add('app--oculto');

    elRodape.style.left = '0';

    // 3) Reexibe a tela inicial com animação de entrada
    elTelaInicial.style.display = '';
    elTelaInicial.classList.remove('saindo');

    // Força reflow para reativar a animação CSS
    elTelaInicial.style.animation = 'none';
    elTelaInicial.querySelector('.tela-inicial__content').style.animation = 'none';
    elTelaInicial.offsetHeight; // trigger reflow
    elTelaInicial.style.animation = '';
    elTelaInicial.querySelector('.tela-inicial__content').style.animation = '';
  }, 350);
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────────
function _construirSidebar(modo) {
  elSidebarTag.textContent = modo === 'jogos' ? 'Modo: Jogos' : 'Modo: Acadêmico';

  if (modo === 'jogos') {
    _construirSidebarJogos();
  } else {
    _construirSidebarAcademico();
  }
}

function _construirSidebarJogos() {
  const itens = [
    { id: 'jogos-home', icon: '🏠', label: 'Todos os Jogos' },
    ...JOGOS.map(j => ({
      id: `jogo-${j.id}`,
      icon: j.emoji,
      label: j.nome,
    })),
  ];

  elSidebarNav.innerHTML = itens.map(item => `
    <div class="sidebar__item" data-rota="${item.id}">
      <span class="sidebar__item-icon">${item.icon}</span>
      <span class="sidebar__item-label">${item.label}</span>
    </div>
  `).join('');

  _bindSidebarNav();
}

function _construirSidebarAcademico() {
  elSidebarNav.innerHTML = `
    <div class="sidebar__secao-titulo">Área</div>
    <div class="sidebar__item" data-rota="professores">
      <span class="sidebar__item-icon">👩‍🏫</span>
      <span class="sidebar__item-label">Professores</span>
    </div>
    <div class="sidebar__item" data-rota="alunos">
      <span class="sidebar__item-icon">🎒</span>
      <span class="sidebar__item-label">Alunos</span>
    </div>
  `;

  _bindSidebarNav();
}

function _bindSidebarNav() {
  elSidebarNav.querySelectorAll('.sidebar__item').forEach(el => {
    el.addEventListener('click', () => {
      const rota = el.dataset.rota;
      _ativarItemSidebar(rota);
      navegar(rota);
    });
  });
}

function _ativarItemSidebar(rotaId) {
  elSidebarNav.querySelectorAll('.sidebar__item').forEach(el => {
    el.classList.toggle('ativo', el.dataset.rota === rotaId);
  });
}

// ── JOGOS HOME ─────────────────────────────────────────────────────────────────
function _renderJogosHome(container) {
  const jogosHTML = JOGOS.map(jogo => `
    <div class="jogo-card" data-jogo-id="${jogo.id}" role="button" tabindex="0">
      <span class="jogo-card__emoji">${jogo.emoji}</span>
      <span class="jogo-card__nome">${jogo.nome}</span>
      <span class="jogo-card__desc">${jogo.descricao}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div>
      <div class="page-header">
        <span class="page-header__eyebrow">Jogos</span>
        <h1 class="page-header__titulo">Jogos Disponíveis</h1>
        <p class="page-header__desc">Selecione um jogo para jogar. Novos jogos são adicionados constantemente.</p>
      </div>
      <div class="jogos-grid">
        ${jogosHTML}
      </div>
    </div>
  `;

  // Ativa item correto na sidebar
  _ativarItemSidebar('jogos-home');

  // Clique nos cards de jogos
  container.querySelectorAll('.jogo-card').forEach(card => {
    const abrirJogo = () => {
      const id = card.dataset.jogoId;
      const rota = `jogo-${id}`;
      _ativarItemSidebar(rota);
      navegar(rota);
    };
    card.addEventListener('click', abrirJogo);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') abrirJogo();
    });
  });
}

// ── BINDINGS GERAIS ────────────────────────────────────────────────────────────
function _bindBotoesInicio() {
  btnJogos?.addEventListener('click', () => _ativarModo('jogos'));
  btnAcademico?.addEventListener('click', () => _ativarModo('academico'));
}

function _bindBotaoVoltar() {
  btnVoltar?.addEventListener('click', _voltarInicio);
}