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
import { login, logout, restaurarSessao } from './modules/auth.js';

// ── ELEMENTOS DOM — declarados aqui, atribuídos no DOMContentLoaded ───────────
let elTelaInicial, elApp, elSidebarNav, elSidebarTag, elConteudoView;
let btnVoltar, elRodape, btnJogos, btnAcademico;

// ── INICIALIZAÇÃO ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Captura elementos após o DOM estar pronto
  elTelaInicial  = document.getElementById('tela-inicial');
  elApp          = document.getElementById('app');
  elSidebarNav   = document.getElementById('sidebar-nav');
  elSidebarTag   = document.getElementById('sidebar-modo-tag');
  elConteudoView = document.getElementById('conteudo-view');
  btnVoltar      = document.getElementById('btn-voltar');
  elRodape       = document.querySelector('.rodape-fixo');
  btnJogos       = document.getElementById('btn-jogos');
  btnAcademico   = document.getElementById('btn-academico');

  inicializarRouter(elConteudoView);
  _registrarRotas();
  _bindBotoesInicio();
  _bindBotaoVoltar();

  // Detecta link de redefinição de senha (hash #type=recovery)
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  if (hashParams.get('type') === 'recovery') {
    history.replaceState(null, '', window.location.pathname);
    // Aguarda o Supabase processar o token e estabelecer a sessão
    const { supabase } = await import('./modules/supabase.js');
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        _abrirModalNovaSenha();
      }
    });
    return;
  }

  // Restaura sessão persistente
  const perfil = await restaurarSessao();
  if (perfil) {
    _atualizarBotaoAcademico(perfil);
  }
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
  const { usuario } = getEstado();
  const isProfOuAdmin = usuario?.tipo === 'professor' || usuario?.tipo === 'admin';

  elSidebarNav.innerHTML = `
    <div class="sidebar__secao-titulo">Área</div>
    ${isProfOuAdmin ? `
    <div class="sidebar__item" data-rota="professores">
      <span class="sidebar__item-icon">👩‍🏫</span>
      <span class="sidebar__item-label">Professor</span>
    </div>` : ''}
    <div class="sidebar__item" data-rota="alunos">
      <span class="sidebar__item-icon">🎒</span>
      <span class="sidebar__item-label">Alunos</span>
    </div>
    <div class="sidebar__secao-titulo" style="margin-top:auto">Conta</div>
    <div class="sidebar__item sidebar__item--usuario">
      <span class="sidebar__item-icon">👤</span>
      <span class="sidebar__item-label">${usuario?.nome || ''}</span>
    </div>
    <div class="sidebar__item sidebar__item--sair" id="btn-logout">
      <span class="sidebar__item-icon">🚪</span>
      <span class="sidebar__item-label">Sair</span>
    </div>
  `;

  _bindSidebarNav();

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
    const sub = btnAcademico?.querySelector('.btn__sub');
    if (sub) sub.textContent = 'Conteúdos e materiais';
    _voltarInicio();
  });
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

function _bindBotoesInicio() {
  // Helper: dispara ação tanto em click quanto em touchend (Android fix)
  function bindAcao(btn, acao) {
    if (!btn) return;
    btn.addEventListener('click', acao);
    btn.addEventListener('touchend', e => {
      e.preventDefault(); // evita o click duplo que o browser dispara depois
      acao();
    }, { passive: false });
  }

  bindAcao(btnJogos, () => _ativarModo('jogos'));
  bindAcao(btnAcademico, () => {
    const { usuario } = getEstado();
    if (!usuario) {
      _abrirModalLogin();
    } else {
      _entrarAcademico(usuario);
    }
  });
}

/** Atualiza label do botão acadêmico após sessão restaurada */
function _atualizarBotaoAcademico(perfil) {
  if (!btnAcademico) return;
  const sub = btnAcademico.querySelector('.btn__sub');
  if (sub) sub.textContent = `Olá, ${perfil.nome.split(' ')[0]}`;
}

/** Entra no modo acadêmico roteando por tipo */
function _entrarAcademico(usuario) {
  _ativarModo('academico');
  setTimeout(() => {
    if (usuario.tipo === 'professor' || usuario.tipo === 'admin') {
      navegar('professores');
    } else {
      navegar('alunos');
    }
  }, 400);
}

/** Admin escolhe entrar como professor ou aluno */
function _entrarAcademicoComModo(usuario, modo) {
  _ativarModo('academico');
  setTimeout(() => {
    navegar(modo === 'aluno' ? 'alunos' : 'professores');
  }, 400);
}

/** Modal de login estilizado */
function _abrirModalLogin() {
  const overlay = document.createElement('div');
  overlay.id = 'modal-login-overlay';
  overlay.innerHTML = `
    <div class="modal-login">
      <button class="modal-login__fechar" id="modal-fechar">✕</button>

      <!-- TELA 1: LOGIN -->
      <div id="ml-tela-login">
        <div class="modal-login__logo">
          <span class="modal-login__sigla">RPR</span>
          <span class="modal-login__nome">Área Acadêmica</span>
        </div>
        <p class="modal-login__desc">Acesse com seu cadastro aprovado</p>

        <div class="modal-login__campo">
          <label>E-mail</label>
          <input id="ml-email" type="email" placeholder="seu@email.com" autocomplete="email" />
        </div>
        <div class="modal-login__campo">
          <label>Senha</label>
          <input id="ml-senha" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>

        <div id="ml-erro" class="modal-login__erro oculto"></div>

        <button class="modal-login__btn" id="ml-entrar">Entrar</button>

        <p class="modal-login__rodape">
          <a href="#" class="modal-login__link" id="ml-link-esqueci">Esqueci minha senha</a>
        </p>
        <p class="modal-login__rodape">
          Não tem conta?
          <a href="/cadastro" class="modal-login__link">Cadastre-se</a>
        </p>
      </div>

      <!-- TELA 3: SELETOR DE MODO (só admin) -->
      <div id="ml-tela-modo" style="display:none">
        <div class="modal-login__logo">
          <span class="modal-login__sigla">RPR</span>
          <span class="modal-login__nome">Como deseja entrar?</span>
        </div>
        <p class="modal-login__desc">Escolha o modo de acesso para esta sessão</p>

        <button class="modal-login__btn" id="ml-modo-professor" style="margin-bottom:.75rem">
          🎓 Entrar como Professor
        </button>
        <button class="modal-login__btn" id="ml-modo-aluno" style="background:var(--surface-2);color:var(--text-1);border:1px solid var(--border);margin-bottom:.75rem">
          🎒 Entrar como Aluno
        </button>
        <button class="modal-login__btn" id="ml-modo-admin" style="background:transparent;color:var(--text-2);font-size:.85rem;padding:.5rem">
          ⚙️ Ir para o Admin
        </button>
      </div>

      <!-- TELA 2: ESQUECI SENHA -->
      <div id="ml-tela-reset" style="display:none">
        <div class="modal-login__logo">
          <span class="modal-login__sigla">RPR</span>
          <span class="modal-login__nome">Redefinir Senha</span>
        </div>
        <p class="modal-login__desc">Digite seu e-mail para receber o link de redefinição</p>

        <div class="modal-login__campo">
          <label>E-mail</label>
          <input id="ml-reset-email" type="email" placeholder="seu@email.com" autocomplete="email" />
        </div>

        <div id="ml-reset-msg" class="modal-login__erro oculto"></div>

        <button class="modal-login__btn" id="ml-btn-reset">Enviar link</button>

        <p class="modal-login__rodape">
          <a href="#" class="modal-login__link" id="ml-link-voltar">← Voltar ao login</a>
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('ativo'));

  const fechar = () => {
    overlay.classList.remove('ativo');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
  document.getElementById('modal-fechar').addEventListener('click', fechar);

  // Alternar entre telas
  const telaLogin = document.getElementById('ml-tela-login');
  const telaReset = document.getElementById('ml-tela-reset');

  document.getElementById('ml-link-esqueci').addEventListener('click', e => {
    e.preventDefault();
    telaLogin.style.display = 'none';
    telaReset.style.display = '';
    document.getElementById('ml-reset-email').focus();
  });

  document.getElementById('ml-link-voltar').addEventListener('click', e => {
    e.preventDefault();
    telaReset.style.display = 'none';
    telaLogin.style.display = '';
  });

  // Login
  const btnEntrar = document.getElementById('ml-entrar');
  const elErro    = document.getElementById('ml-erro');

  btnEntrar.addEventListener('click', async () => {
    const email = document.getElementById('ml-email').value.trim();
    const senha = document.getElementById('ml-senha').value;

    if (!email || !senha) {
      _mostrarErroModal(elErro, 'Preencha e-mail e senha.');
      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando…';

    const resultado = await login(email, senha);

    if (resultado.erro) {
      _mostrarErroModal(elErro, resultado.erro);
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
      return;
    }

    const perfil = resultado.perfil;
    _atualizarBotaoAcademico(perfil);

    // Admin vê o seletor de modo antes de entrar
    if (perfil.isAdmin) {
      document.getElementById('ml-tela-login').style.display = 'none';
      document.getElementById('ml-tela-modo').style.display = '';
      return; // não fecha o modal ainda
    }

    fechar();
    _entrarAcademico(perfil);
  });

  // Botões do seletor de modo (admin)
  document.getElementById('ml-modo-professor').addEventListener('click', () => {
    const perfil = { ...getEstado().usuario, _modoAtivo: 'professor' };
    fechar();
    _entrarAcademicoComModo(perfil, 'professor');
  });

  document.getElementById('ml-modo-aluno').addEventListener('click', () => {
    fechar();
    _entrarAcademicoComModo(getEstado().usuario, 'aluno');
  });

  document.getElementById('ml-modo-admin').addEventListener('click', () => {
    fechar();
    window.location.href = '/admin/';
  });

  [document.getElementById('ml-email'), document.getElementById('ml-senha')]
    .forEach(el => el.addEventListener('keydown', e => {
      if (e.key === 'Enter') btnEntrar.click();
    }));

  // Reset de senha
  const btnReset  = document.getElementById('ml-btn-reset');
  const elResetMsg = document.getElementById('ml-reset-msg');

  btnReset.addEventListener('click', async () => {
    const email = document.getElementById('ml-reset-email').value.trim();
    if (!email) {
      elResetMsg.textContent = 'Informe seu e-mail.';
      elResetMsg.style.color = '';
      elResetMsg.classList.remove('oculto');
      return;
    }

    btnReset.disabled = true;
    btnReset.textContent = 'Enviando…';

    import('./modules/supabase.js').then(async ({ supabase }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://educacaodigital.iprpr.dev.br'
      });

      if (error) {
        elResetMsg.textContent = 'Erro ao enviar. Tente novamente.';
        elResetMsg.style.color = '';
        elResetMsg.classList.remove('oculto');
        btnReset.disabled = false;
        btnReset.textContent = 'Enviar link';
      } else {
        elResetMsg.textContent = '✅ Link enviado! Verifique seu e-mail.';
        elResetMsg.style.color = 'var(--accent)';
        elResetMsg.classList.remove('oculto');
        btnReset.textContent = 'Enviado!';
      }
    });
  });

  document.getElementById('ml-reset-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') btnReset.click();
  });
}

function _mostrarErroModal(el, msg) {
  el.textContent = msg;
  el.classList.remove('oculto');
}

function _bindBotaoVoltar() {
  btnVoltar?.addEventListener('click', _voltarInicio);
}

/** Modal para definir nova senha (após clicar no link de recovery do e-mail) */
function _abrirModalNovaSenha() {
  const overlay = document.createElement('div');
  overlay.id = 'modal-login-overlay';
  overlay.innerHTML = `
    <div class="modal-login">
      <div class="modal-login__logo">
        <span class="modal-login__sigla">RPR</span>
        <span class="modal-login__nome">Nova Senha</span>
      </div>
      <p class="modal-login__desc">Digite sua nova senha para continuar</p>

      <div class="modal-login__campo">
        <label>Nova senha</label>
        <input id="ml-nova-senha" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
      </div>
      <div class="modal-login__campo">
        <label>Confirmar senha</label>
        <input id="ml-conf-senha" type="password" placeholder="Repita a senha" autocomplete="new-password" />
      </div>

      <div id="ml-nova-msg" class="modal-login__erro oculto"></div>

      <button class="modal-login__btn" id="ml-btn-nova">Salvar nova senha</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('ativo'));

  const btn   = document.getElementById('ml-btn-nova');
  const msgEl = document.getElementById('ml-nova-msg');

  btn.addEventListener('click', async () => {
    const nova = document.getElementById('ml-nova-senha').value;
    const conf = document.getElementById('ml-conf-senha').value;

    if (!nova || nova.length < 6) {
      msgEl.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
      msgEl.style.color = '';
      msgEl.classList.remove('oculto');
      return;
    }
    if (nova !== conf) {
      msgEl.textContent = 'As senhas não coincidem.';
      msgEl.style.color = '';
      msgEl.classList.remove('oculto');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando…';

    const { supabase } = await import('./modules/supabase.js');
    const { error } = await supabase.auth.updateUser({ password: nova });

    if (error) {
      msgEl.textContent = 'Erro ao salvar: ' + error.message;
      msgEl.style.color = '';
      msgEl.classList.remove('oculto');
      btn.disabled = false;
      btn.textContent = 'Salvar nova senha';
    } else {
      msgEl.textContent = '✅ Senha redefinida com sucesso! Faça login.';
      msgEl.style.color = 'var(--accent)';
      msgEl.classList.remove('oculto');
      btn.textContent = 'Concluído!';
      setTimeout(() => {
        overlay.classList.remove('ativo');
        setTimeout(() => { overlay.remove(); _abrirModalLogin(); }, 300);
      }, 2000);
    }
  });

  [document.getElementById('ml-nova-senha'), document.getElementById('ml-conf-senha')]
    .forEach(el => el.addEventListener('keydown', e => {
      if (e.key === 'Enter') btn.click();
    }));
}
