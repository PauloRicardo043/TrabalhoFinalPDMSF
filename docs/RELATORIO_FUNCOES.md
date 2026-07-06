# Relatório de Funções

Este arquivo documenta as mudanças de implementação feitas no projeto.

## Funcionalidades implementadas

- Tela `Login` e `Cadastro` com logo, tema consistente e teclado fechado ao tocar no fundo.
- Tela `Home` com saudação personalizada usando o nome do usuário do Supabase Auth.
- Tela `Profile` adaptada para funcionar apenas com Supabase Auth, evitando dependência de tabela `usuarios`.
<!-- Removida a funcionalidade de upload de foto de perfil em favor de iniciais textuais. -->
- Persistência de raio de alerta em `AsyncStorage` via `src/services/proximidade.js`.
- Tela `NovaTarefa` preservando estado de título, descrição, prioridade e nome do local ao retornar do mapa.
- Tela `SelecionarLocal` com seleção de coordenadas, localização atual e suporte a locais favoritos salvos localmente, agora vinculados ao usuário autenticado.
- Tela `NovaTarefa` com modal de `Locais Favoritos` que carrega favoritos apenas do usuário atual e preserva o restante do formulário ao voltar do mapa.
- Novo serviço `src/services/locationsStorage.js` para gerenciar favoritos usando `AsyncStorage` com escopo por `userId`.

## Observações

- O fluxo de perfil agora sincroniza com o usuário autenticado do Supabase Auth.
- Se o bucket `fotos` não existir no Supabase, a tela exibirá mensagem de erro orientando a configuração.
- A navegação entre `NovaTarefa` e `SelecionarLocal` já transmite latitude, longitude e nome do local.
