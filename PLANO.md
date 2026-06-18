# PLANO DO PROJETO: HTML/CSS/JS

> Gerado automaticamente pelo SK Code Editor em 18/06/2026, 16:16:10
> **86 arquivo(s)** | **~30.530 linhas de codigo**

---

## RESUMO EXECUTIVO

- **Tipo de aplicacao:** Aplicacao Web Frontend (React)
- **Frontend / Stack principal:** React + Vite, TypeScript, Tailwind CSS
- **Backend / Dados:** Drizzle ORM
- **Versao:** 1.0.0

**Para rodar o projeto:**
```bash
npm install && npm run dev
```

---

## ESTRUTURA DE ARQUIVOS

```
HTML/CSS/JS/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── tooltip.tsx
│   │   ├── pwa-install.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── tiptap-editor.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── offline-api.ts
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── auditoria-financeira.tsx
│   │   ├── code-assistant.tsx
│   │   ├── comparador-juridico.tsx
│   │   ├── comunicacoes-cnj.tsx
│   │   ├── configuracoes.tsx
│   │   ├── consulta-corporativo.tsx
│   │   ├── consulta-pdpj.tsx
│   │   ├── consulta-processual.tsx
│   │   ├── filtrador.tsx
│   │   ├── jurisprudencia.tsx
│   │   ├── legal-assistant.tsx
│   │   ├── legal-assistant.tsx.recovered
│   │   ├── login.tsx
│   │   ├── not-found.tsx
│   │   ├── painel-processos.tsx
│   │   ├── playground.tsx
│   │   ├── previdenciario.tsx
│   │   ├── robo-djen.tsx
│   │   ├── token-generator.tsx
│   │   └── tramitacao.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## STACK TECNOLOGICO DETECTADO

- **Frontend:** React + Vite, TypeScript, Tailwind CSS
- **Backend:** Drizzle ORM
- **Todos os pacotes (82):** @google/genai, @hookform/resolvers, @radix-ui/react-accordion, @radix-ui/react-alert-dialog, @radix-ui/react-aspect-ratio, @radix-ui/react-avatar, @radix-ui/react-checkbox, @radix-ui/react-collapsible, @radix-ui/react-context-menu, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-hover-card, @radix-ui/react-label, @radix-ui/react-menubar, @radix-ui/react-navigation-menu, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slider, @radix-ui/react-slot, @radix-ui/react-switch, @radix-ui/react-tabs, @radix-ui/react-toast, @radix-ui/react-toggle, @radix-ui/react-toggle-group, @radix-ui/react-tooltip, @tanstack/react-query, @tiptap/core, @tiptap/extension-color, @tiptap/extension-font-family, @tiptap/extension-highlight, @tiptap/extension-link, @tiptap/extension-table, @tiptap/extension-table-cell, @tiptap/extension-table-header, @tiptap/extension-table-row, @tiptap/extension-text-align, @tiptap/extension-text-style, @tiptap/extension-underline, @tiptap/pm, @tiptap/react, @tiptap/starter-kit, class-variance-authority, clsx, cmdk, date-fns, docx, embla-carousel-react, framer-motion, input-otp, lucide-react, mammoth, next-themes, openai, pdfjs-dist, react, react-day-picker, react-dom, react-hook-form, react-icons, react-resizable-panels, recharts, tailwind-merge, tailwindcss-animate, vaul, wouter, zod, @tailwindcss/typography, @types/node, @types/react, @types/react-dom, @vitejs/plugin-react, autoprefixer, drizzle-orm, drizzle-zod, postcss, tailwindcss, typescript, vite

---

## SCRIPTS DISPONIVEIS (package.json)

```bash
npm run dev           # vite
npm run build         # vite build
npm run preview       # vite preview
npm run check         # tsc --noEmit
```

---

## VARIAVEIS DE AMBIENTE NECESSARIAS

Crie um arquivo `.env` na raiz com estas variaveis:

```env
PORT=seu_valor_aqui
BASE_PATH=seu_valor_aqui
```

---

## ARQUIVOS PRINCIPAIS

- `index.html` — Pagina HTML principal
- `src/App.tsx` — Componente raiz do frontend
- `src/main.tsx` — Arquivo principal

---

## GUIA COMPLETO — O QUE CADA PARTE DO PROJETO FAZ

> Esta secao explica, em linguagem simples, o que e para que serve cada pasta e cada arquivo.

### 📁 Raiz do Projeto (pasta principal)
> Arquivos de configuracao e pontos de entrada ficam aqui.

**`index.html`** _(28 linhas)_
Pagina HTML raiz do projeto. E o ponto de entrada que o browser carrega primeiro.

**`package.json`** _(100 linhas)_
Registro de dependencias e scripts do projeto. Aqui ficam os comandos (npm run dev, npm start) e os pacotes instalados.

**`postcss.config.js`** _(7 linhas)_
Configuracao do PostCSS, necessaria para o Tailwind processar os estilos.

**`tailwind.config.ts`** _(108 linhas)_
Configuracao do Tailwind CSS — a biblioteca de estilos visuais usada no projeto.

**`tsconfig.json`** _(24 linhas)_
Configuracao do TypeScript. Diz para o computador como interpretar o codigo .ts e .tsx.

**`vite.config.ts`** _(45 linhas)_
Configuracao do Vite (servidor de desenvolvimento). Define a porta, alias de caminhos e plugins usados.

---

### 📁 `src/`
> Codigo-fonte principal do projeto. Nao apague esta pasta.

**`App.tsx`** _(149 linhas)_
Componente RAIZ do frontend — e o pai de todos os outros componentes. Aqui ficam as rotas principais.

**`index.css`** _(378 linhas)_
Arquivo de estilos visuais — cores, tamanhos, fontes, espacamentos da interface.

**`main.tsx`** _(9 linhas)_
Ponto de entrada do React — monta o componente App na pagina HTML.

**`vite-env.d.ts`** _(2 linhas)_
Arquivo TypeScript/JavaScript — logica, funcoes ou modulo do projeto.

---

### 📁 `src/components/`
> Pecas visuais reutilizaveis da interface (botoes, cards, formularios...).

**`pwa-install.tsx`** _(86 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`theme-provider.tsx`** _(47 linhas)_
Componente PROVIDER — 'fornece' dados/funcoes para todos os componentes filhos via Context API do React.

**`theme-toggle.tsx`** _(19 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`tiptap-editor.tsx`** _(542 linhas)_
Componente EDITOR — area de edicao de texto, codigo ou conteudo rico.

---

### 📁 `src/hooks/`
> Hooks React customizados — logica reutilizavel de estado e efeitos.

**`use-mobile.tsx`** _(20 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`use-toast.ts`** _(192 linhas)_
HOOK React personalizado para gerenciar estado/comportamento de '-toast'.

---

### 📁 `src/lib/`
> Funcoes auxiliares reutilizaveis em varios lugares do projeto.

**`offline-api.ts`** _(999 linhas)_
Arquivo de SERVICO/API — funcoes para comunicar com o servidor ou API externa.

**`queryClient.ts`** _(68 linhas)_
Arquivo de SERVICO/API — funcoes para comunicar com o servidor ou API externa.

**`utils.ts`** _(7 linhas)_
Funcoes UTILITARIAS — ferramentas reutilizaveis de uso geral no projeto.

---

### 📁 `src/pages/`
> Telas completas do app — cada arquivo aqui e uma pagina navegavel.

**`auditoria-financeira.tsx`** _(25 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`code-assistant.tsx`** _(1000 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`comparador-juridico.tsx`** _(25 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`comunicacoes-cnj.tsx`** _(403 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`configuracoes.tsx`** _(352 linhas)_
Componente de CONFIGURACOES — tela onde o usuario ajusta preferencias do app.

**`consulta-corporativo.tsx`** _(479 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`consulta-pdpj.tsx`** _(671 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`consulta-processual.tsx`** _(656 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`filtrador.tsx`** _(732 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`jurisprudencia.tsx`** _(3837 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`legal-assistant.tsx`** _(5470 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`legal-assistant.tsx.recovered`** _(3763 linhas)_
Arquivo RECOVERED — parte do projeto.

**`login.tsx`** _(119 linhas)_
Componente de LOGIN/AUTENTICACAO — tela de entrada com usuario e senha.

**`not-found.tsx`** _(33 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`painel-processos.tsx`** _(758 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`playground.tsx`** _(1473 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`previdenciario.tsx`** _(770 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`robo-djen.tsx`** _(1056 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`token-generator.tsx`** _(450 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`tramitacao.tsx`** _(828 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

---

### 📁 `src/components/ui/`
> Componentes de UI (interface) basicos e genericos.

**`accordion.tsx`** _(57 linhas)_
Componente ACCORDION — secoes que abrem/fecham ao clicar, economizando espaco na tela.

**`alert-dialog.tsx`** _(140 linhas)_
Componente de NOTIFICACAO/ALERTA — mensagem temporaria que aparece na tela (ex: 'Salvo com sucesso!').

**`alert.tsx`** _(60 linhas)_
Componente de NOTIFICACAO/ALERTA — mensagem temporaria que aparece na tela (ex: 'Salvo com sucesso!').

**`aspect-ratio.tsx`** _(6 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`avatar.tsx`** _(52 linhas)_
Componente AVATAR — foto ou iniciais do usuario em formato circular.

**`badge.tsx`** _(39 linhas)_
Componente BADGE (etiqueta) — pequeno indicador com numero ou status (ex: '3 novas mensagens').

**`breadcrumb.tsx`** _(116 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`button.tsx`** _(63 linhas)_
Componente de BOTAO — elemento clicavel reutilizavel com estilo padrao do projeto.

**`calendar.tsx`** _(69 linhas)_
Componente CALENDARIO/AGENDA — visualizacao e selecao de datas e eventos.

**`card.tsx`** _(86 linhas)_
Componente CARD (cartao) — exibe uma informacao em um bloco visual com borda e sombra. Muito usado para listas de items.

**`carousel.tsx`** _(261 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`chart.tsx`** _(366 linhas)_
Componente de GRAFICO — visualizacao de dados em forma de grafico (barras, linhas, pizza...).

**`checkbox.tsx`** _(29 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`collapsible.tsx`** _(12 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`command.tsx`** _(152 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`context-menu.tsx`** _(199 linhas)_
CONTEXT do React — mecanismo para compartilhar dados entre componentes sem passar por props.

**`dialog.tsx`** _(123 linhas)_
Componente DIALOG — caixa de dialogo que exige resposta do usuario (confirmar, cancelar...).

**`drawer.tsx`** _(119 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`dropdown-menu.tsx`** _(199 linhas)_
Componente de MENU/DROPDOWN — lista de opcoes que aparece ao clicar em um botao.

**`form.tsx`** _(179 linhas)_
Componente de FORMULARIO — campos de entrada de dados (texto, selecao, etc.) com validacao.

**`hover-card.tsx`** _(30 linhas)_
Componente CARD (cartao) — exibe uma informacao em um bloco visual com borda e sombra. Muito usado para listas de items.

**`input-otp.tsx`** _(70 linhas)_
Componente de CAMPO DE ENTRADA — elemento de input com estilo personalizado.

**`input.tsx`** _(24 linhas)_
Componente de CAMPO DE ENTRADA — elemento de input com estilo personalizado.

**`label.tsx`** _(25 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`menubar.tsx`** _(257 linhas)_
Componente de MENU/DROPDOWN — lista de opcoes que aparece ao clicar em um botao.

**`navigation-menu.tsx`** _(129 linhas)_
Componente de NAVEGACAO/CABECALHO — barra superior com logo, menu e links de navegacao.

**`pagination.tsx`** _(118 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`popover.tsx`** _(30 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`progress.tsx`** _(29 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`radio-group.tsx`** _(43 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`resizable.tsx`** _(46 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`scroll-area.tsx`** _(47 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`select.tsx`** _(161 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`separator.tsx`** _(30 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`sheet.tsx`** _(141 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`sidebar.tsx`** _(728 linhas)_
Componente de BARRA LATERAL — menu ou painel que aparece na lateral da tela.

**`skeleton.tsx`** _(16 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`slider.tsx`** _(27 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`switch.tsx`** _(28 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`table.tsx`** _(118 linhas)_
Componente de TABELA — exibe dados em linhas e colunas.

**`tabs.tsx`** _(54 linhas)_
Componente de ABAS — permite alternar entre diferentes secoes de conteudo com clique.

**`textarea.tsx`** _(23 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`toast.tsx`** _(128 linhas)_
Componente de NOTIFICACAO/ALERTA — mensagem temporaria que aparece na tela (ex: 'Salvo com sucesso!').

**`toaster.tsx`** _(34 linhas)_
Componente de NOTIFICACAO/ALERTA — mensagem temporaria que aparece na tela (ex: 'Salvo com sucesso!').

**`toggle-group.tsx`** _(62 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`toggle.tsx`** _(44 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

**`tooltip.tsx`** _(31 linhas)_
Componente React — parte visual reutilizavel da interface do usuario.

---

## CONTEXTO PARA IA (copie e cole para continuar o projeto)

> Use este bloco para explicar o projeto para qualquer IA ou desenvolvedor:

```
Projeto: HTML/CSS/JS
Tipo: Aplicacao Web Frontend (React)
Stack: React + Vite, TypeScript, Tailwind CSS, Drizzle ORM
Arquivos: 86 | Linhas: ~30.530
Variaveis de ambiente necessarias: PORT, BASE_PATH

Estrutura principal:
  index.html
  package.json
  postcss.config.js
  src/App.tsx
  src/components/pwa-install.tsx
  src/components/theme-provider.tsx
  src/components/theme-toggle.tsx
  src/components/tiptap-editor.tsx
  src/components/ui/accordion.tsx
  src/components/ui/alert-dialog.tsx
  src/components/ui/alert.tsx
  src/components/ui/aspect-ratio.tsx
  src/components/ui/avatar.tsx
  src/components/ui/badge.tsx
  src/components/ui/breadcrumb.tsx
  src/components/ui/button.tsx
  src/components/ui/calendar.tsx
  src/components/ui/card.tsx
  src/components/ui/carousel.tsx
  src/components/ui/chart.tsx
  src/components/ui/checkbox.tsx
  src/components/ui/collapsible.tsx
  src/components/ui/command.tsx
  src/components/ui/context-menu.tsx
  src/components/ui/dialog.tsx
  src/components/ui/drawer.tsx
  src/components/ui/dropdown-menu.tsx
  src/components/ui/form.tsx
  src/components/ui/hover-card.tsx
  src/components/ui/input-otp.tsx
  src/components/ui/input.tsx
  src/components/ui/label.tsx
  src/components/ui/menubar.tsx
  src/components/ui/navigation-menu.tsx
  src/components/ui/pagination.tsx
  src/components/ui/popover.tsx
  src/components/ui/progress.tsx
  src/components/ui/radio-group.tsx
  src/components/ui/resizable.tsx
  src/components/ui/scroll-area.tsx
  src/components/ui/select.tsx
  src/components/ui/separator.tsx
  src/components/ui/sheet.tsx
  src/components/ui/sidebar.tsx
  src/components/ui/skeleton.tsx
  src/components/ui/slider.tsx
  src/components/ui/switch.tsx
  src/components/ui/table.tsx
  src/components/ui/tabs.tsx
  src/components/ui/textarea.tsx
  src/components/ui/toast.tsx
  src/components/ui/toaster.tsx
  src/components/ui/toggle-group.tsx
  src/components/ui/toggle.tsx
  src/components/ui/tooltip.tsx
  src/hooks/use-mobile.tsx
  src/hooks/use-toast.ts
  src/index.css
  src/lib/offline-api.ts
  src/lib/queryClient.ts
  src/lib/utils.ts
  src/main.tsx
  src/pages/auditoria-financeira.tsx
  src/pages/code-assistant.tsx
  src/pages/comparador-juridico.tsx
  src/pages/comunicacoes-cnj.tsx
  src/pages/configuracoes.tsx
  src/pages/consulta-corporativo.tsx
  src/pages/consulta-pdpj.tsx
  src/pages/consulta-processual.tsx
  src/pages/filtrador.tsx
  src/pages/jurisprudencia.tsx
  src/pages/legal-assistant.tsx
  src/pages/legal-assistant.tsx.recovered
  src/pages/login.tsx
  src/pages/not-found.tsx
  src/pages/painel-processos.tsx
  src/pages/playground.tsx
  src/pages/previdenciario.tsx
  src/pages/robo-djen.tsx
  src/pages/token-generator.tsx
  src/pages/tramitacao.tsx
  src/vite-env.d.ts
  tailwind.config.ts
  tsconfig.json
  vite.config.ts
```

---

*Plano gerado pelo SK Code Editor — 18/06/2026, 16:16:10*