import { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  FAB,
  IconButton,
  Chip,
  ActivityIndicator,
  Snackbar,
  Button,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../services/supabase";
import { formatarData, getPrioridadeInfo } from "../services/tarefasUtils";

/**
 * Tarefas
 * Tela de listagem completa e gerenciamento de tarefas do usuário.
 */
export default function Tarefas() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todas");

  // Busca tarefas com filtros aplicados e atualiza a lista.
  /**
   * buscarTarefas
   * Carrega tarefas do Supabase aplicando filtros de prioridade e status.
   */
  const buscarTarefas = useCallback(async () => {
    setErro(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setErro("Usuário não autenticado.");
      setTarefas([]);
      setLoading(false);
      setAtualizando(false);
      return;
    }

    let query = supabase
      .from("tarefas")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (filtroPrioridade !== "todas") {
      query = query.eq("prioridade", filtroPrioridade);
    }

    if (filtroStatus === "pendentes") {
      query = query.eq("concluida", false);
    }

    if (filtroStatus === "concluidas") {
      query = query.eq("concluida", true);
    }

    const { data, error } = await query;

    if (error) {
      setErro("Erro ao carregar tarefas: " + error.message);
      setTarefas([]);
    } else {
      setTarefas(data || []);
    }

    setLoading(false);
    setAtualizando(false);
  }, [filtroPrioridade, filtroStatus]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      buscarTarefas();
    }, [buscarTarefas])
  );

  // Atualiza a lista de tarefas ao puxar para baixo.
  /**
   * atualizarLista
   * Recarrega a lista de tarefas ao puxar para baixo.
   */
  async function atualizarLista() {
    setAtualizando(true);
    await buscarTarefas();
  }

  // Alterna o status de conclusão de uma tarefa.
  /**
   * alternarConcluida
   * Alterna o estado de conclusão de uma tarefa e atualiza o Supabase.
   */
  async function alternarConcluida(tarefa) {
    setErro(null);

    const { error } = await supabase
      .from("tarefas")
      .update({
        concluida: !tarefa.concluida,
      })
      .eq("id", tarefa.id);

    if (error) {
      setErro("Erro ao atualizar tarefa: " + error.message);
      return;
    }

    setTarefas((listaAtual) =>
      listaAtual.map((item) =>
        item.id === tarefa.id
          ? {
              ...item,
              concluida: !item.concluida,
            }
          : item
      )
    );
  }

  // Solicita confirmação antes de excluir uma tarefa.
  /**
   * confirmarExclusao
   * Mostra diálogo de confirmação antes de excluir uma tarefa.
   */
  function confirmarExclusao(tarefa) {
    Alert.alert(
      "Excluir tarefa",
      "Tem certeza que deseja excluir esta tarefa?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirTarefa(tarefa),
        },
      ]
    );
  }

  // Remove a tarefa do Supabase e atualiza a lista local.
  /**
   * excluirTarefa
   * Remove a tarefa selecionada do banco de dados e atualiza a lista local.
   */
  async function excluirTarefa(tarefa) {
    setErro(null);

    const { error } = await supabase
      .from("tarefas")
      .delete()
      .eq("id", tarefa.id);

    if (error) {
      setErro("Erro ao excluir tarefa: " + error.message);
      return;
    }

    setTarefas((listaAtual) =>
      listaAtual.filter((item) => item.id !== tarefa.id)
    );
  }

  // Reinicia os filtros de prioridade e status.
  /**
   * limparFiltros
   * Restaura os filtros de prioridade e status para todas as tarefas.
   */
  function limparFiltros() {
    setFiltroPrioridade("todas");
    setFiltroStatus("todas");
  }

  /**
   * renderTarefa
   * Renderiza o card individual de tarefa para a lista principal.
   */
  function renderTarefa({ item }) {
    const prioridade = getPrioridadeInfo(item.prioridade);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBox}>
              <Text
                variant="titleMedium"
                style={[
                  styles.titulo,
                  item.concluida && styles.tituloConcluido,
                ]}
              >
                {item.titulo}
              </Text>

              <Text variant="bodySmall" style={styles.data}>
                Criada em {formatarData(item.created_at)}
              </Text>
            </View>

            <IconButton
              icon={item.concluida ? "check-circle" : "checkbox-blank-circle-outline"}
              iconColor={item.concluida ? "#1976D2" : "#757575"}
              size={26}
              onPress={() => alternarConcluida(item)}
            />
          </View>

          {item.descricao ? (
            <Text
              variant="bodyMedium"
              style={[
                styles.descricao,
                item.concluida && styles.textoConcluido,
              ]}
            >
              {item.descricao}
            </Text>
          ) : null}

          {item.nome_local ? (
            <Text variant="bodySmall" style={styles.local}>
              Local: {item.nome_local}
            </Text>
          ) : null}

          {item.latitude !== null &&
          item.latitude !== undefined &&
          item.longitude !== null &&
          item.longitude !== undefined ? (
            <Text variant="bodySmall" style={styles.coordenadas}>
              Lat: {item.latitude} | Long: {item.longitude}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.chipBox}>
              <Chip
                compact
                style={[
                  styles.prioridadeChip,
                  {
                    backgroundColor: prioridade.cor,
                  },
                ]}
                textStyle={styles.prioridadeChipText}
              >
                {prioridade.label}
              </Chip>

              <Chip compact style={styles.statusChip}>
                {item.concluida ? "Concluída" : "Pendente"}
              </Chip>
            </View>

            <View style={styles.actions}>
              <IconButton
                icon="pencil"
                size={22}
                onPress={() => navigation.navigate("EditarTarefa", { tarefa: item })}
              />

              <IconButton
                icon="trash-can-outline"
                size={22}
                iconColor="#B3261E"
                onPress={() => confirmarExclusao(item)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando tarefas...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          size={26}
          onPress={() => navigation.navigate("Home")}
        />

        <View style={styles.headerTextBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Tarefas
          </Text>

          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Gerencie suas tarefas por prioridade e status.
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        <Text variant="titleSmall" style={styles.filterTitle}>
          Prioridade
        </Text>

        <SegmentedButtons
          value={filtroPrioridade}
          onValueChange={setFiltroPrioridade}
          buttons={[
            { value: "todas", label: "Todas" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Média" },
            { value: "baixa", label: "Baixa" },
          ]}
          style={styles.segmented}
        />

        <Text variant="titleSmall" style={styles.filterTitle}>
          Status
        </Text>

        <SegmentedButtons
          value={filtroStatus}
          onValueChange={setFiltroStatus}
          buttons={[
            { value: "todas", label: "Todas" },
            { value: "pendentes", label: "Pend." },
            { value: "concluidas", label: "Conc." },
          ]}
          style={styles.segmented}
        />

        <Button mode="text" onPress={limparFiltros}>
          Limpar filtros
        </Button>
      </View>

      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarefa}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: 100 + insets.bottom,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={atualizarLista} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhuma tarefa encontrada
            </Text>

            <Text variant="bodyMedium" style={styles.emptyText}>
              Crie uma nova tarefa usando o botão de adicionar.
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: 24 + insets.bottom,
          },
        ]}
        onPress={() => navigation.navigate("NovaTarefa")}
      />

      <Snackbar
        visible={!!erro}
        onDismiss={() => setErro(null)}
        duration={4000}
      >
        {erro}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#000000",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  headerTextBox: {
    flex: 1,
    paddingRight: 16,
  },

  headerTitle: {
    color: "#000000",
    fontWeight: "bold",
  },

  headerSubtitle: {
    color: "#000000",
    marginTop: 2,
  },

  filters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  filterTitle: {
    marginBottom: 6,
    color: "#000000",
  },

  segmented: {
    marginBottom: 12,
  },

  listContent: {
    padding: 16,
  },

  card: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitleBox: {
    flex: 1,
  },

  titulo: {
    fontWeight: "bold",
    color: "#000000",
  },

  tituloConcluido: {
    textDecorationLine: "line-through",
    color: "#000000",
  },

  data: {
    color: "#000000",
    marginTop: 2,
  },

  descricao: {
    color: "#000000",
    marginTop: 8,
  },

  textoConcluido: {
    color: "#000000",
  },

  local: {
    color: "#000000",
    marginTop: 8,
  },

  coordenadas: {
    color: "#000000",
    marginTop: 2,
  },

  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chipBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  prioridadeChip: {
    marginRight: 8,
  },

  prioridadeChipText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  statusChip: {
    backgroundColor: "#E3F2FD",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  emptyTitle: {
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },

  emptyText: {
    color: "#000000",
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#1976D2",
  },
});