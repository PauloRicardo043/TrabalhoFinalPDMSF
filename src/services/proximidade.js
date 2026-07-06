import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { buscarLocalizacaoAtual } from "./location";
import { adicionarNotificacao } from "./notificacoes";
import { supabase } from "./supabase";

const RAIO_STORAGE_KEY = "@rotinaapp:raio-alerta";
const NOTIFICADAS_STORAGE_KEY = "@rotinaapp:notificadas";
// Intervalo balanceado entre responsividade e consumo de bateria.
// Reduzido para 15s para que notificações por proximidade apareçam rapidamente
// após a criação/entrada no raio, sem aumentar demais o consumo.
const INTERVALO_VERIFICACAO_MS = 15_000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * normalizarRaio
 * Normaliza o valor do raio de alerta para valores suportados.
 */
function normalizarRaio(valor) {
  const opcoes = [50, 100, 200, 500];
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 100;
  }

  return opcoes.includes(numero) ? numero : 100;
}

/**
 * buscarRaioAlerta
 * Obtém o raio de alerta configurado pelo usuário ou retorna valor padrão.
 */
export async function buscarRaioAlerta() {
  try {
    const valor = await AsyncStorage.getItem(RAIO_STORAGE_KEY);
    return normalizarRaio(valor ?? 100);
  } catch (error) {
    return 100;
  }
}

/**
 * salvarRaioAlerta
 * Salva o raio de alerta escolhido pelo usuário no AsyncStorage.
 */
export async function salvarRaioAlerta(valor) {
  const raio = normalizarRaio(valor);
  await AsyncStorage.setItem(RAIO_STORAGE_KEY, String(raio));
  return raio;
}

/**
 * buscarIdsNotificados
 * Recupera a lista de IDs de tarefas já notificadas para evitar duplicação.
 */
async function buscarIdsNotificados() {
  try {
    const valor = await AsyncStorage.getItem(NOTIFICADAS_STORAGE_KEY);

    if (!valor) {
      return [];
    }

    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    return [];
  }
}

/**
 * salvarIdsNotificados
 * Persiste IDs de tarefas notificadas para não notificar repetidamente.
 */
async function salvarIdsNotificados(ids) {
  await AsyncStorage.setItem(NOTIFICADAS_STORAGE_KEY, JSON.stringify(ids));
}

/**
 * calcularDistanciaEmMetros
 * Calcula a distância entre duas coordenadas geográficas em metros.
 */
function calcularDistanciaEmMetros(coordA, coordB) {
  const paraRad = (valor) => (valor * Math.PI) / 180;
  const dLat = paraRad(coordB.latitude - coordA.latitude);
  const dLon = paraRad(coordB.longitude - coordA.longitude);
  const lat1 = paraRad(coordA.latitude);
  const lat2 = paraRad(coordB.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const distancia = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * distancia;
}

/**
 * enviarNotificacaoLocal
 * Agenda uma notificação local e grava um registro da notificação.
 */
async function enviarNotificacaoLocal(tarefa) {
  const mensagem =
    "Você possui uma tarefa próxima. Abra o app para visualizar os detalhes.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "RotinaApp",
      body: mensagem,
      data: { tarefaId: tarefa.id },
    },
    trigger: null,
  });

  await adicionarNotificacao({
    title: "RotinaApp",
    message: mensagem,
    type: "proximidade",
  });
}

/**
 * verificarProximidadeTarefas
 * Verifica tarefas geolocalizadas próximas ao usuário e envia notificações.
 */
export async function verificarProximidadeTarefas() {
  try {
    const raio = await buscarRaioAlerta();
    const localizacao = await buscarLocalizacaoAtual();

    if (!localizacao) {
      return { raio, notificadas: [] };
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { raio, notificadas: [] };
    }

    const { data, error } = await supabase
      .from("tarefas")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("concluida", false)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      throw new Error(error.message || "Falha ao buscar tarefas.");
    }

    const idsNotificados = await buscarIdsNotificados();
    const proximas = [];

    for (const tarefa of data || []) {
      const distancia = calcularDistanciaEmMetros(localizacao, {
        latitude: Number(tarefa.latitude),
        longitude: Number(tarefa.longitude),
      });

      if (distancia <= raio && !idsNotificados.includes(tarefa.id)) {
        await enviarNotificacaoLocal(tarefa);
        proximas.push(tarefa.id);
      }
    }

    if (proximas.length > 0) {
      await salvarIdsNotificados([...idsNotificados, ...proximas]);
    }

    return { raio, notificadas: proximas };
  } catch (error) {
    throw new Error(error.message || "Não foi possível verificar sua proximidade.");
  }
}

/**
 * getIntervaloVerificacaoMs
 * Retorna o intervalo em milissegundos usado pela verificação periódica de proximidade.
 */
export function getIntervaloVerificacaoMs() {
  return INTERVALO_VERIFICACAO_MS;
}
