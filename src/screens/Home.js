import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  FAB,
  IconButton,
  Chip,
  ActivityIndicator,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../services/supabase";
import { formatarData, getPrioridadeInfo } from "../services/tarefasUtils";
import { contarNaoLidas } from "../services/notificacoes";

/**
 * Home
 * Tela inicial do usuário com resumo de tarefas recentes e navegação.
 */
export default function Home() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [naoLidas, setNaoLidas] = useState(0);
  const [nomeUsuario, setNomeUsuario] = useState("");

  // Busca as tarefas mais recentes do usuário autenticado.
  /**
   * buscarUltimasTarefas
   * Busca as tarefas mais recentes do usuário autenticado para exibição no dashboard.
   */
  async function buscarUltimasTarefas() {
    setErro(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setErro("Usuário não autenticado.");
      setNomeUsuario("");
      setLoading(false);
      return;
    }

    setNomeUsuario(
      session.user.user_metadata?.full_name || session.user.email || "Usuário"
    );

    const { data, error } = await supabase
      .from("tarefas")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      setErro("Erro ao carregar tarefas: " + error.message);
      setTarefas([]);
    } else {
      setTarefas(data || []);
    }

    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      buscarUltimasTarefas();
      contarNaoLidas().then(setNaoLidas);
    }, [])
  );

  useEffect(() => {
    contarNaoLidas().then(setNaoLidas);
  }, []);

  // Abre a tela para criar uma nova tarefa.
  /**
   * abrirNovaTarefa
   * Navega para a tela de criação de nova tarefa.
   */
  function abrirNovaTarefa() {
    navigation.navigate("NovaTarefa");
  }

  /**
   * navegarPara
   * Navega para a tela solicitada no fluxo protegido.
   */
  function navegarPara(tela) {
    navigation.navigate(tela);
  }

  // Faz logout do usuário e retorna para a tela de autenticação.
  /**
   * sair
   * Faz logout no Supabase e redireciona para a tela de login.
   */
  async function sair() {
    await supabase.auth.signOut();

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  }

  // Renderiza cada tarefa em um card com informações de prioridade e status.
  /**
   * renderTarefa
   * Renderiza o card de uma tarefa incluída na lista de tarefas recentes.
   */
  function renderTarefa(tarefa) {
    const prioridade = getPrioridadeInfo(tarefa.prioridade);

    return (
      <Card key={tarefa.id} style={styles.taskCard}>
        <Card.Content style={styles.taskContent}>
          <View style={styles.taskMain}>
            <Text
              variant="titleMedium"
              style={[
                styles.taskTitle,
                tarefa.concluida && styles.taskTitleDone,
              ]}
              numberOfLines={1}
            >
              {tarefa.titulo}
            </Text>

            {tarefa.descricao ? (
              <Text variant="bodySmall" style={styles.taskDescription} numberOfLines={2}>
                {tarefa.descricao}
              </Text>
            ) : null}

            {tarefa.nome_local ? (
              <Text variant="bodySmall" style={styles.taskLocation} numberOfLines={1}>
                Local: {tarefa.nome_local}
              </Text>
            ) : null}

            <Text variant="bodySmall" style={styles.taskDate}>
              Criada em {formatarData(tarefa.created_at)}
            </Text>

            <View style={styles.chipRow}>
              <Chip
                compact
                style={[styles.priorityChip, { backgroundColor: prioridade.cor }]}
                textStyle={styles.priorityChipText}
              >
                {prioridade.label}
              </Chip>

              <Chip compact style={styles.statusChip}>
                {tarefa.concluida ? "Concluída" : "Pendente"}
              </Chip>
            </View>
          </View>

            <IconButton
              icon="chevron-right"
              size={24}
              // Navega para a tab 'Tarefas' e abre o screen 'EditarTarefa' dentro da stack,
              // garantindo que a Bottom Tab permaneça visível.
              onPress={() => navigation.navigate("Tarefas", { screen: "EditarTarefa", params: { tarefa } })}
            />
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={[styles.container, styles.screenBackground]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: 120 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              {nomeUsuario ? `Olá, ${nomeUsuario}` : "Bem-vindo ao RotinaApp"}
            </Text>

            <Text variant="bodyMedium" style={styles.welcomeText}>
              Organize tarefas por localização e receba lembretes quando estiver próximo do local cadastrado.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTextBox}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Últimas tarefas
            </Text>

            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Veja as 5 tarefas mais recentes cadastradas.
            </Text>
          </View>

          <FAB
            icon="plus"
            size="small"
            style={styles.addButton}
            onPress={abrirNovaTarefa}
          />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando tarefas...</Text>
          </View>
        ) : tarefas.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhuma tarefa cadastrada
              </Text>

              <Text variant="bodyMedium" style={styles.emptyText}>
                Use o botão de adicionar para criar sua primeira tarefa.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          tarefas.map(renderTarefa)
        )}
      </ScrollView>

      {/* Bottom Tab é exibido pelo navigator principal; removido menu manual duplicado. */}

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

  screenBackground: {
    backgroundColor: "#EAF4FF",
  },

  content: {
    paddingHorizontal: 20,
  },

  welcomeCard: {
    borderRadius: 24,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },

  welcomeTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 8,
  },

  welcomeText: {
    color: "#000000",
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTextBox: {
    flex: 1,
    marginRight: 12,
  },

  sectionTitle: {
    fontWeight: "bold",
    color: "#000000",
  },

  sectionSubtitle: {
    color: "#000000",
    marginTop: 2,
  },

  addButton: {
    backgroundColor: "#1976D2",
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },

  loadingText: {
    marginTop: 12,
    color: "#000000",
  },

  emptyCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  emptyTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 6,
  },

  emptyText: {
    color: "#000000",
  },

  taskCard: {
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
  },

  taskContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  taskMain: {
    flex: 1,
  },

  taskTitle: {
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },

  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#000000",
  },

  taskDescription: {
    color: "#000000",
    marginBottom: 4,
  },

  taskLocation: {
    color: "#000000",
    marginBottom: 4,
  },

  taskDate: {
    color: "#000000",
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  priorityChip: {
    height: 28,
    marginRight: 8,
  },

  priorityChipText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  statusChip: {
    height: 28,
    backgroundColor: "#E3F2FD",
  },
  // Menu inferior agora gerenciado pelo Bottom Tab Navigator global.
});