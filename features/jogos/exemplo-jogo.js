/**
 * features/jogos/exemplo-jogo.js
 * Template base para criar novos jogos.
 * Contrato obrigatório: export function render(container) + export function init(container)
 */

export const META = {
  id: 'exemplo',
  nome: 'Jogo Exemplo',
  descricao: 'Demonstra a estrutura de um módulo de jogo',
  emoji: '🧩',
};

/**
 * Gera o HTML do jogo no container.
 * Chamado antes de init().
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = `
    <div class="jogo-area">
      <div class="page-header">
        <span class="page-header__eyebrow">🧩 Jogo</span>
        <h1 class="page-header__titulo">Jogo Exemplo</h1>
        <p class="page-header__desc">Este é um template. Copie este arquivo para criar seu próprio jogo.</p>
      </div>

      <div class="card card--destaque" style="text-align:center; padding: 3rem 2rem;">
        <div style="font-size:4rem; margin-bottom:1rem">🎮</div>
        <h2 style="font-family:var(--font-display); color:var(--primary); margin-bottom:0.5rem">Estrutura de Jogo</h2>
        <p style="color:var(--text-2); font-size:0.9rem; margin-bottom:2rem; line-height:1.7">
          Para criar um novo jogo, crie um arquivo em <code style="font-family:var(--font-mono); color:var(--primary)">features/jogos/meu-jogo.js</code>
          exportando as funções <strong>render()</strong> e <strong>init()</strong>,<br/>
          depois registre no <code style="font-family:var(--font-mono); color:var(--primary)">features/jogos/index.js</code>.
        </p>

        <div id="jogo-exemplo-contador" style="font-family:var(--font-display); font-size:3rem; color:var(--primary); margin-bottom:1.5rem; font-weight:800">0</div>
        <button class="btn btn--primary" id="btn-jogo-clique" style="font-size:1rem; padding:0.8rem 2rem">
          Clique aqui!
        </button>
        <p id="jogo-exemplo-msg" style="margin-top:1rem; color:var(--text-3); font-size:0.85rem; min-height:1.4em"></p>
      </div>
    </div>
  `;
}

/**
 * Inicializa a lógica do jogo após render().
 * @param {HTMLElement} container
 */
export function init(container) {
  let cliques = 0;
  const btn = container.querySelector('#btn-jogo-clique');
  const contador = container.querySelector('#jogo-exemplo-contador');
  const msg = container.querySelector('#jogo-exemplo-msg');

  const mensagens = [
    'Continue clicando!',
    'Está pegando o jeito!',
    'Uau, rápido!',
    'Incrível velocidade!',
    '🔥 Você está pegando fogo!',
    '💥 IMPARÁVEL!',
  ];

  btn?.addEventListener('click', () => {
    cliques++;
    contador.textContent = cliques;
    const i = Math.min(Math.floor(cliques / 5), mensagens.length - 1);
    msg.textContent = mensagens[i];

    // micro-animação
    contador.style.transform = 'scale(1.3)';
    setTimeout(() => { contador.style.transform = ''; }, 120);
  });

  // Estilo de transição
  contador.style.transition = 'transform 0.12s ease';
}
