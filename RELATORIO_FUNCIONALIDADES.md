# Relatório do RotinaApp

## Visão geral
O RotinaApp é um aplicativo móvel para organização de tarefas com foco em localização. Ele permite cadastrar tarefas, visualizar listas, localizar atividades no mapa e receber alertas quando o usuário estiver próximo de um local cadastrado.

## Funcionalidades principais

### 1. Autenticação
- Tela de login com validação de e-mail e senha.
- Tela de cadastro para criar uma conta no Supabase.
- Sessão do usuário mantida para o acesso ao restante do app.

### 2. Gestão de tarefas
- Criação de novas tarefas com título, descrição, prioridade e local.
- Edição de tarefas existentes.
- Marcação de tarefas como concluídas ou pendentes.
- Exclusão de tarefas.
- Listagem de tarefas com filtros por prioridade e status.

### 3. Localização e mapa
 Removido menu manual duplicado e navegação para `EditarTarefa` ajustada para abrir dentro da tab `Tarefas`.

 Possíveis causas para o mapa não ser exibido inicialmente:

 Correções aplicadas relacionadas ao mapa:
 
 - `src/screens/NovaTarefa.js`: adicionado botão "Salvar Local nos Favoritos" e implementação de salvamento (Supabase com fallback para AsyncStorage). Validação de duplicidade por nome implementada.
### 4. Notificações por proximidade
  "Você possui uma tarefa próxima. Abra o app para visualizar os detalhes."

### 5. Configuração de alerta
- Definição do raio de alerta em metros.
- Valores disponíveis: 50 m, 100 m, 200 m e 500 m.
- Configuração salva localmente com AsyncStorage.

### 6. Perfil do usuário
- Edição do nome do usuário.
 - Edição do nome do usuário.
 - Edição de e-mail e senha.
 - A funcionalidade de upload/armazenamento de foto de perfil foi removida; agora o perfil exibe as iniciais do usuário dentro de um círculo colorido.
 - Ajuste do raio de alerta.

### 7. Interface
- Navegação entre telas com stack navigator.
- Menu inferior com acesso rápido às principais áreas do app.
- Visual consistente com cards, botões, chips e barras de cabeçalho.
- Ícones com biblioteca compatível com Expo.

## Mudanças implementadas

- Removida funcionalidade de foto de perfil (upload, seleção de galeria, câmera e uso do Supabase Storage). Perfil agora mostra iniciais.
- Tela de criação de tarefas mantém o mapa sempre visível; marcador arrastável e toque definem localização; latitude/longitude exibidas (somente leitura).
- Telas de Login e Cadastro simplificadas: subtítulos promocionais removidos, mantendo logo e nome do app.
- Navegação reorganizada: telas de edição/detalhes/seleção de local são gerenciadas pelas stacks internas das tabs para manter o Bottom Tab visível.
- Lógica de notificações ajustada: intervalo de verificação reduzido para 15s; verificação é disparada imediatamente após criar uma tarefa.

## Arquivos modificados (resumo)

- `src/screens/Profile.js`: removida lógica e UI de upload; exibe iniciais do usuário.
- `src/screens/Login.js` e `src/screens/Cadastro.js`: subtítulos removidos; layout simplificado.
- `src/screens/NovaTarefa.js`: chamada para `verificarProximidadeTarefas()` após salvar tarefa.
- `src/screens/Home.js`: navegação para `EditarTarefa` ajustada para abrir dentro da tab `Tarefas`.
- `src/services/proximidade.js`: intervalo de verificação reduzido para 15s.
- `App.js`: removidas rotas duplicadas no root Stack para manter Bottom Tab visível.
