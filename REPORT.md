# Relatório do RotinaApp

## Visão geral
O `RotinaApp` é um aplicativo móvel Expo/React Native para gerenciar tarefas pessoais com foco em geolocalização. Ele permite criar tarefas, registrar locais de interesse, visualizar tarefas em um mapa e receber notificações de proximidade.

## Tecnologias principais
- Expo SDK 54
- React Native 0.81.5
- React Navigation Native Stack
- React Native Paper
- Supabase Auth e banco de dados
- AsyncStorage para armazenamento local
- Expo Location e react-native-maps para geolocalização
- Expo Notifications para alertas locais

## Arquitetura geral
O app usa uma arquitetura baseada em telas e serviços:
- `App.js`: controlador principal de navegação e autenticação.
- `src/screens`: telas de interface do usuário.
- `src/services`: lógica de acesso a dados, localização, notificações e utilitários.
- `src/theme.js`: tema de cores compartilhado com `react-native-paper`.

## Fluxo de navegação
1. O usuário inicia em `Login` ou `Cadastro`.
2. Após autenticar com Supabase, o app redireciona para `Home`.
3. De `Home`, o usuário pode navegar para:
   - `Tarefas` (lista completa de tarefas)
   - `NovaTarefa` (criar tarefa)
   - `Maps` (ver tarefas no mapa)
   - `Notificacoes` (mensagens locais)
   - `Profile` (editar perfil)
4. `NovaTarefa` pode abrir `SelecionarLocal` para escolher coordenadas no mapa e retornar os dados sem perder o estado.
5. `EditarTarefa` e `DetalhesTarefa` permitem gerenciar tarefas existentes.

## Principais funcionalidades
- Autenticação de usuário com e-mail/senha.
- Criação de tarefas com título, descrição, prioridade e local.
- Seleção de locais via mapa e favoritos de localização.
- Lista filtrável por prioridade e status de conclusão.
- Visualização de tarefas no mapa com marcadores coloridos.
- Notificações locais baseadas na proximidade do usuário.
- Configuração de raio de alerta para notificações.
 - Perfil do usuário com atualização de nome, e-mail e senha. (foto removida; agora exibimos iniciais)

## Descrição de telas
### Login
- Valida e-mail e senha.
- Faz login com Supabase.
- Navega para `Home` em caso de sucesso.

### Cadastro
- Registra novo usuário no Supabase Auth.
- Salva `full_name` nos metadados do usuário.
- Permite navegar para `Login` após cadastro.

### Home
- Exibe boas-vindas personalizadas.
- Mostra as 5 tarefas mais recentes.
- Contador de notificações não lidas.
- Atalho rápido para criar nova tarefa.

### Tarefas
- Lista completa de tarefas do usuário.
- Filtros por prioridade e status.
- Atualização de conclusão de tarefa.
- Exclusão de tarefas com confirmação.
- Navegação para edição de tarefa.

### NovaTarefa
- Captura título, descrição, prioridade e local.
- Permite selecionar local no mapa mantendo o estado do formulário.
- Grava tarefa no Supabase.

### SelecionarLocal
- Exibe mapa interativo com ponto selecionável.
- Usa a localização atual do dispositivo como ponto inicial.
- Adiciona locais favoritos em `AsyncStorage`.
- Retorna coordenadas e nome ao criar tarefa.

### Maps
- Mostra todas as tarefas com coordenadas no mapa.
- Exibe marcadores coloridos por prioridade.
- Permite centralizar na posição do usuário.
- Abre detalhes da tarefa ao tocar no marcador.

### Notificacoes
- Lista notificações locais armazenadas em `AsyncStorage`.
- Marca todas como lidas ao abrir a tela.

### Profile
- Permite atualizar dados do usuário autenticado (nome, e-mail, senha).
- A funcionalidade de upload/armazenamento de foto foi removida; o perfil exibe as iniciais do usuário.
- Configura o raio de alerta de proximidade.

### DetalhesTarefa
- Exibe informações completas de uma tarefa selecionada.
- Mostra título, descrição, prioridade, status e coordenadas.

### EditarTarefa
- Carrega dados da tarefa para edição.
- Atualiza título, descrição, prioridade, localização e status.
- Permite excluir a tarefa.

## Serviços e utilitários
- `supabase.js`: cliente Supabase configurado com URL e chave pública.
- `location.js`: solicita permissões de localização e obtém posição atual.
- `locationsStorage.js`: gerencia locais favoritos em `AsyncStorage`.
- `notificacoes.js`: gerencia notificações locais em `AsyncStorage`.
- `proximidade.js`: calcula proximidade entre usuário e tarefas, envia notificações e grava histórico.
- `tarefasUtils.js`: utilitários de prioridade, cor de marcador e formatação de data.

## Observações importantes
- A navegação protegida usa componentes `TelaPublica` e `TelaProtegida` para garantir acesso correto.
- A função `confirmarLocal` em `SelecionarLocal` atualiza os parâmetros da rota de retorno para não perder dados do formulário.
- O app já possui cobertura de comentários de função nas principais telas e serviços.

## Conclusão
O `RotinaApp` é um app completo de gerenciamento de tarefas com localização e notificações. A base está pronta para evolução, incluindo conectividade com Supabase, uso de mapas e suporte a fluxo de usuário autenticado.
