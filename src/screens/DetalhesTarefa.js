import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getPrioridadeInfo } from "../services/tarefasUtils";

export default function DetalhesTarefa() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tarefa = route.params?.tarefa;

  if (!tarefa) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <Text style={styles.emptyText}>Tarefa não encontrada.</Text>
      </View>
    );
  }

  const prioridade = getPrioridadeInfo(tarefa.prioridade);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Detalhes da tarefa
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.tarefaTitle}>
              {tarefa.titulo}
            </Text>

            <Text variant="bodyMedium" style={styles.texto}>
              {tarefa.descricao || "Nenhuma descrição informada."}
            </Text>

            <View style={styles.row}>
              <Text style={styles.label}>Prioridade</Text>
              <Chip style={[styles.chip, { backgroundColor: prioridade.cor }]}> 
                {prioridade.label}
              </Chip>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Chip style={styles.chipSecondary}>
                {tarefa.concluida ? "Concluída" : "Pendente"}
              </Chip>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Latitude</Text>
              <Text style={styles.valor}>{tarefa.latitude ?? "—"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Longitude</Text>
              <Text style={styles.valor}>{tarefa.longitude ?? "—"}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}> 
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontWeight: "bold",
    color: "#000000",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  tarefaTitle: {
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  texto: {
    color: "#000000",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    color: "#000000",
    fontWeight: "600",
  },
  valor: {
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  chip: {
    marginLeft: 8,
  },
  chipSecondary: {
    backgroundColor: "#E3F2FD",
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 40,
    textAlign: "center",
    color: "#000000",
  },
});
