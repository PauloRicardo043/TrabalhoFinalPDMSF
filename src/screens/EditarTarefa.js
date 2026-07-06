import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
  useTheme,
  IconButton,
  Switch,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../services/supabase";

/**
 * EditarTarefa
 * Tela para editar ou excluir uma tarefa existente.
 */
export default function EditarTarefa() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tarefa = route.params?.tarefa;

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [concluida, setConcluida] = useState(false);
  const [nomeLocal, setNomeLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // Carrega os dados da tarefa selecionada para edição.
  useEffect(() => {
    if (!tarefa) {
      setErro("Tarefa não encontrada.");
      return;
    }

    setTitulo(tarefa.titulo || "");
    setDescricao(tarefa.descricao || "");
    setPrioridade(tarefa.prioridade || "media");
    setConcluida(Boolean(tarefa.concluida));
    setNomeLocal(tarefa.nome_local || "");
    setLatitude(
      tarefa.latitude !== null && tarefa.latitude !== undefined
        ? String(tarefa.latitude)
        : ""
    );
    setLongitude(
      tarefa.longitude !== null && tarefa.longitude !== undefined
        ? String(tarefa.longitude)
        : ""
    );
  }, [tarefa]);

  // Converte as coordenadas informadas para valores numéricos.
  /**
   * converterCoordenada
   * Converte uma string de coordenada em número decimal válido.
   */
  function converterCoordenada(valor) {
    if (!valor.trim()) return null;

    const numero = Number(valor.replace(",", "."));

    if (Number.isNaN(numero)) {
      return null;
    }

    return numero;
  }

  // Atualiza os dados da tarefa no Supabase.
  /**
   * atualizarTarefa
   * Atualiza os dados da tarefa no Supabase e retorna à lista.
   */
  async function atualizarTarefa() {
    if (!tarefa?.id) {
      setErro("Tarefa inválida.");
      return;
    }

    if (!titulo.trim()) {
      setErro("Informe o título da tarefa.");
      return;
    }

    const latitudeConvertida = converterCoordenada(latitude);
    const longitudeConvertida = converterCoordenada(longitude);

    if (latitude.trim() && latitudeConvertida === null) {
      setErro("Latitude inválida.");
      return;
    }

    if (longitude.trim() && longitudeConvertida === null) {
      setErro("Longitude inválida.");
      return;
    }

    if ((latitude.trim() && !longitude.trim()) || (!latitude.trim() && longitude.trim())) {
      setErro("Informe latitude e longitude juntas.");
      return;
    }

    setLoading(true);
    setErro(null);

    const { error } = await supabase
      .from("tarefas")
      .update({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prioridade,
        concluida,
        nome_local: nomeLocal.trim() || null,
        latitude: latitudeConvertida,
        longitude: longitudeConvertida,
      })
      .eq("id", tarefa.id);

    if (error) {
      setErro("Erro ao atualizar tarefa: " + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigation.navigate("Tarefas");
  }

  // Solicita confirmação antes de remover a tarefa.
  /**
   * confirmarExclusao
   * Exibe o diálogo de exclusão antes de remover a tarefa.
   */
  function confirmarExclusao() {
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
          onPress: excluirTarefa,
        },
      ]
    );
  }

  // Exclui a tarefa do banco e retorna para a lista.
  /**
   * excluirTarefa
   * Exclui a tarefa do banco e navega de volta para a lista.
   */
  async function excluirTarefa() {
    if (!tarefa?.id) {
      setErro("Tarefa inválida.");
      return;
    }

    setLoading(true);
    setErro(null);

    const { error } = await supabase
      .from("tarefas")
      .delete()
      .eq("id", tarefa.id);

    if (error) {
      setErro("Erro ao excluir tarefa: " + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigation.navigate("Tarefas");
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          size={26}
          onPress={() => navigation.goBack()}
        />

        <View style={styles.headerTextBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Editar tarefa
          </Text>

          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Atualize os dados da tarefa selecionada.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label="Título"
          value={titulo}
          onChangeText={setTitulo}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.label}>
          Prioridade
        </Text>

        <SegmentedButtons
          value={prioridade}
          onValueChange={setPrioridade}
          buttons={[
            { value: "alta", label: "Alta" },
            { value: "media", label: "Média" },
            { value: "baixa", label: "Baixa" },
          ]}
          style={styles.segmented}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchTextBox}>
            <Text variant="titleSmall" style={styles.switchTitle}>
              Tarefa concluída
            </Text>

            <Text variant="bodySmall" style={styles.switchSubtitle}>
              Marque quando a atividade já tiver sido realizada.
            </Text>
          </View>

          <Switch value={concluida} onValueChange={setConcluida} />
        </View>

        <TextInput
          label="Nome do local"
          value={nomeLocal}
          onChangeText={setNomeLocal}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <TextInput
          label="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={atualizarTarefa}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Salvar alterações
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.secondaryButton}
        >
          Cancelar
        </Button>

        <Button
          mode="text"
          textColor="#B3261E"
          onPress={confirmarExclusao}
          disabled={loading}
          style={styles.deleteButton}
        >
          Excluir tarefa
        </Button>
      </ScrollView>

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

  content: {
    padding: 20,
  },

  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  label: {
    color: "#000000",
    marginBottom: 8,
  },

  segmented: {
    marginBottom: 16,
  },

  switchRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  switchTitle: {
    color: "#000000",
    fontWeight: "bold",
  },

  switchSubtitle: {
    color: "#000000",
    marginTop: 2,
  },

  button: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 4,
    backgroundColor: "#1976D2",
  },

  secondaryButton: {
    marginTop: 12,
    borderRadius: 999,
  },

  deleteButton: {
    marginTop: 16,
  },
});