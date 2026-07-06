import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICACOES_KEY = "@rotinaapp:notificacoes";

/**
 * carregarNotificacoes
 * Lê as notificações salvas no AsyncStorage e ordena pela data mais recente.
 */
export async function carregarNotificacoes() {
  try {
    const valor = await AsyncStorage.getItem(NOTIFICACOES_KEY);

    if (!valor) {
      return [];
    }

    const lista = JSON.parse(valor);

    if (!Array.isArray(lista)) {
      return [];
    }

    return lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    return [];
  }
}

/**
 * salvarNotificacoes
 * Persiste a lista de notificações no AsyncStorage.
 */
export async function salvarNotificacoes(notificacoes) {
  await AsyncStorage.setItem(NOTIFICACOES_KEY, JSON.stringify(notificacoes));
}

/**
 * adicionarNotificacao
 * Adiciona uma nova notificação local e mantém o histórico de notificações.
 */
export async function adicionarNotificacao(notificacao) {
  const listaAtual = await carregarNotificacoes();
  const nova = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notificacao,
  };

  const proximaLista = [nova, ...listaAtual];
  await salvarNotificacoes(proximaLista);
  return nova;
}

/**
 * marcarTodasComoLidas
 * Marca todas as notificações como lidas e atualiza o armazenamento.
 */
export async function marcarTodasComoLidas() {
  const listaAtual = await carregarNotificacoes();
  const atualizada = listaAtual.map((item) => ({ ...item, read: true }));
  await salvarNotificacoes(atualizada);
  return atualizada;
}

/**
 * contarNaoLidas
 * Conta quantas notificações ainda não foram marcadas como lidas.
 */
export async function contarNaoLidas() {
  const lista = await carregarNotificacoes();
  return lista.filter((item) => !item.read).length;
}
