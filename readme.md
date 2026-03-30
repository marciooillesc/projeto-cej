# CEJ Educação Digital — Guia de Referência para Desenvolvimento

## Visão Geral da Arquitetura

Este projeto é um **SPA (Single Page Application)** construído com HTML, CSS e JavaScript puro,
sem frameworks. Uma única página HTML troca de conteúdo dinamicamente via JavaScript.

```
cej-educacao-digital/
├── index.html                          ← único HTML do projeto
├── style.css                           ← TODO o CSS do sistema
├── main.js                             ← orquestrador principal
├── modules/
│   ├── state.js                        ← estado global
│   ├── router.js                       ← roteamento SPA
│   ├── api.js                          ← integração com Apps Script
│   └── ui.js                           ← componentes HTML reutilizáveis
└── features/
    ├── academico/
    │   ├── professores.js
    │   └── alunos.js
    └── jogos/
        ├── index.js                    ← registro central de jogos
        ├── caca-palavras.js
        ├── digitacao-jogo.js
        └── exemplo-jogo.js             ← template para novos jogos
```

---

## Regras Fundamentais (NUNCA quebrar)

- ❌ NÃO usar frameworks (React, Vue, Angular)
- ❌ NÃO criar múltiplos arquivos HTML
- ❌ NÃO usar caminhos absolutos que começam com /
- ❌ NÃO colocar CSS ou JS dentro do HTML
- ❌ NÃO criar arquivos CSS separados por funcionalidade
- ✅ TODO o estilo vai em style.css
- ✅ Cada feature é um módulo .js em /features/
- ✅ Infraestrutura reutilizável fica em /modules/

---

## Design Tokens (variáveis CSS)

Todas as cores e valores do sistema estão em `:root` no `style.css`.
**Sempre use variáveis, nunca valores hardcoded.**

```css
/* Fundos */
--bg:            #0f172a    /* fundo principal */
--bg-2:          #1e293b    /* fundo secundário */
--bg-3:          #162032    /* fundo da sidebar */
--card:          #1e2d3e    /* cards */
--card-hover:    #243447    /* cards hover */

/* Bordas */
--border:        rgba(56,189,248,0.1)
--border-strong: rgba(56,189,248,0.25)

/* Cor principal */
--primary:       #38bdf8    /* azul céu */
--primary-dim:   rgba(56,189,248,0.15)
--primary-dark:  #0ea5e9

/* Cor de destaque */
--accent:        #818cf8    /* roxo/índigo */

/* Feedback */
--success:       #34d399
--warning:       #fbbf24
--danger:        #f87171

/* Textos */
--text:          #e2e8f0    /* texto principal */
--text-2:        #94a3b8    /* texto secundário */
--text-3:        #64748b    /* texto terciário/sutil */
--text-inv:      #0f172a    /* texto sobre fundo claro */

/* Layout */
--sidebar-w:     260px
--radius:        12px
--radius-sm:     8px
--radius-lg:     18px

/* Tipografia */
--font-display:  'Syne', sans-serif      /* títulos, destaques */
--font-body:     'DM Sans', sans-serif   /* textos normais */
--font-mono:     'JetBrains Mono', monospace  /* badges, código, labels */

/* Animações */
--transition:      0.22s cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Componentes CSS Prontos

Use as classes abaixo diretamente no HTML gerado pelos módulos JS.

### Botões

```html
<!-- Primário (azul) -->
<button class="btn btn--primary">Salvar</button>

<!-- Fantasma (borda) -->
<button class="btn btn--ghost">Cancelar</button>

<!-- Perigo -->
<button class="btn btn--danger">Excluir</button>

<!-- Tamanho pequeno (combina com qualquer variante) -->
<button class="btn btn--primary btn--sm">Abrir</button>

<!-- Apenas ícone -->
<button class="btn btn--icon-only">🔍</button>
```

### Cards

```html
<!-- Card base -->
<div class="card">Conteúdo</div>

<!-- Card com destaque (borda + glow) -->
<div class="card card--destaque">Destaque</div>

<!-- Card clicável (hover com elevação) -->
<div class="card card--clicavel">Clicável</div>
```

### Cabeçalho de página

```html
<div class="page-header">
  <span class="page-header__eyebrow">🎓 Categoria</span>
  <h1 class="page-header__titulo">Título da Página</h1>
  <p class="page-header__desc">Descrição breve da seção.</p>
</div>
```

### Loading / Erro / Vazio

```html
<!-- Use as funções do ui.js — elas geram esses HTMLs: -->

<!-- Loading -->
<div class="loading">
  <div class="loading__spinner"></div>
  <span>Carregando...</span>
</div>

<!-- Erro -->
<div class="aviso-erro">
  <span>⚠️</span>
  <div><strong>Erro ao carregar</strong><br /><span>Mensagem</span></div>
</div>

<!-- Vazio -->
<div class="estado-vazio">
  <span class="estado-vazio__icone">📭</span>
  <p class="estado-vazio__titulo">Nada por aqui</p>
  <p class="estado-vazio__desc">Descrição opcional</p>
</div>
```

### Chips (filtros)

```html
<div class="chips">
  <span class="chip ativo" data-valor="todos">Todos</span>
  <span class="chip" data-valor="atividade">Atividades</span>
  <span class="chip" data-valor="simulado">Simulados</span>
</div>
```

### Inputs e Selects

```html
<input type="text" class="input-custom" placeholder="Digite aqui..." />
<select class="select-custom"><option>Opção</option></select>
<textarea class="textarea-custom" placeholder="Descreva..."></textarea>
```

---

## Como Adicionar um Novo Jogo

**Passo 1** — Criar o arquivo `features/jogos/meu-jogo.js`:

```js
export const META = {
  id: 'meu-jogo',
  nome: 'Nome do Jogo',
  descricao: 'Descrição curta',
  emoji: '🎯',
};

// Gera o HTML do jogo no container
export function render(container) {
  container.innerHTML = `
    <div class="jogo-area">
      <div class="page-header">
        <span class="page-header__eyebrow">${META.emoji} Jogo</span>
        <h1 class="page-header__titulo">${META.nome}</h1>
      </div>
      <!-- seu HTML aqui -->
    </div>
  `;
}

// Inicializa a lógica após o render
export function init(container) {
  // seus eventos e lógica aqui
}
```

**Passo 2** — Registrar em `features/jogos/index.js`:

```js
import * as MeuJogo from './meu-jogo.js';

export const JOGOS = [
  // jogos existentes...
  {
    id: 'meu-jogo',
    nome: 'Nome do Jogo',
    descricao: 'Descrição curta',
    emoji: '🎯',
    modulo: MeuJogo,
  },
];
```

Só isso. O sistema cria o card, o item na sidebar e a rota automaticamente.

---

## Como Adicionar uma Nova Seção Acadêmica

**Passo 1** — Criar `features/academico/minha-secao.js`:

```js
import { renderizar } from '../../modules/ui.js';

export function renderMinhaSecao(container) {
  renderizar(container, `
    <div>
      <div class="page-header">
        <span class="page-header__eyebrow">📌 Seção</span>
        <h1 class="page-header__titulo">Minha Seção</h1>
      </div>
      <!-- conteúdo -->
    </div>
  `);
}
```

**Passo 2** — Registrar rota em `main.js`:

```js
import { renderMinhaSecao } from './features/academico/minha-secao.js';

// dentro de _registrarRotas():
registrarRota('minha-secao', (container) => {
  renderMinhaSecao(container);
});
```

**Passo 3** — Adicionar na sidebar em `main.js`, dentro de `_construirSidebarAcademico()`:

```js
<div class="sidebar__item" data-rota="minha-secao">
  <span class="sidebar__item-icon">📌</span>
  <span class="sidebar__item-label">Minha Seção</span>
</div>
```

---

## API — Google Apps Script

Configurar a URL em `modules/api.js`:

```js
const API_URL = 'https://script.google.com/macros/s/SEU_ID/exec';
```

Formato esperado de resposta:

```json
{
  "items": [
    {
      "professor": "Prof. Márcio",
      "materia": "Tecnologia",
      "turma": "8º Ano",
      "tipo": "simulado",
      "titulo": "Título do conteúdo",
      "descricao": "Descrição",
      "data_de_publicacao": "2026-03-30",
      "questoes": [
        {
          "enunciado": "Pergunta?",
          "alternativas": ["A", "B", "C", "D"],
          "correta": 1
        }
      ]
    }
  ]
}
```

Tipos válidos para o campo `tipo`: `atividade`, `conteudo`, `material`, `simulado`

---

## Funções Utilitárias Disponíveis

### modules/ui.js

```js
import { renderizar, htmlLoading, htmlVazio, htmlErro,
         htmlConteudoItem, htmlDetalheConteudo,
         htmlSimulado, inicializarSimulado,
         htmlBadgeTipo, formatarData } from './modules/ui.js';

renderizar(container, html)           // injeta HTML com animação
htmlLoading('Carregando...')          // retorna HTML de loading
htmlVazio({ icone, titulo, desc })    // retorna HTML de estado vazio
htmlErro('mensagem')                  // retorna HTML de erro
htmlConteudoItem(item, idx)           // card de item da lista
htmlDetalheConteudo(item)             // tela de detalhe completa
inicializarSimulado(questoes)         // ativa lógica do simulado
htmlBadgeTipo('simulado')             // badge colorido por tipo
formatarData('2026-03-30')            // → "30 de mar. de 2026"
```

### modules/api.js

```js
import { buscarConteudos, filtrarPorProfessor,
         filtrarPorTipo, listarProfessores,
         gerarConteudoIA, limparCache } from './modules/api.js';

await buscarConteudos()               // busca todos os itens (com cache)
await buscarConteudos(true)           // força recarregar ignorando cache
filtrarPorProfessor(dados, 'Prof. X') // filtra por professor
filtrarPorTipo(dados, 'simulado')     // filtra por tipo
listarProfessores(dados)              // retorna array de nomes únicos
await gerarConteudoIA(tema, opcoes)   // gera conteúdo com IA (placeholder)
limparCache()                         // limpa cache em memória
```

### modules/state.js

```js
import { getEstado, setEstado, assinar } from './modules/state.js';

getEstado()                           // retorna cópia do estado atual
setEstado({ professor: 'Prof. X' })   // atualiza estado e notifica
assinar('professor', (valor) => {})   // escuta mudanças de uma chave
assinar('*', (estado, chaves) => {})  // escuta qualquer mudança
```

### modules/router.js

```js
import { registrarRota, navegar } from './modules/router.js';

registrarRota('nome', async (container, params) => {})  // registra rota
navegar('nome', { param: 'valor' })                      // navega para rota
```

---

## Padrões de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Arquivo de feature | kebab-case | `caca-palavras.js` |
| Função de render | camelCase com prefixo `render` | `renderProfessores()` |
| Função de init | camelCase com prefixo `init` | `initSimulado()` |
| ID no HTML | kebab-case com prefixo do módulo | `#cp-grid`, `#btn-corrigir` |
| Classe CSS | BEM simplificado | `.conteudo-item__titulo` |
| Variável CSS | kebab-case com `--` | `--sidebar-w` |
| Rota | kebab-case | `'jogos-home'`, `'jogo-caca-palavras'` |

---

## Checklist ao Criar Algo Novo

- [ ] CSS vai em `style.css` (nunca inline nem em arquivo separado)
- [ ] Imports usam caminhos relativos (`../../modules/ui.js`)
- [ ] HTML gerado por JS usa variáveis CSS (`var(--primary)`)
- [ ] Eventos adicionados após o HTML ser inserido no DOM
- [ ] Funções nomeadas de forma descritiva (sem `fn1`, `temp`, etc.)
- [ ] Jogo novo registrado em `features/jogos/index.js`
- [ ] Rota nova registrada em `main.js → _registrarRotas()`
- [ ] Seção nova adicionada na sidebar em `main.js`

---

*CEJ Educação Digital — Prof. Márcio Oilles © 2026*
