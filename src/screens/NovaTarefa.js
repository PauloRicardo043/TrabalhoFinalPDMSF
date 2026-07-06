import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback, Modal, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
  useTheme,
  IconButton,
  List,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { supabase } from "../services/supabase";
import { obterLocaisFavoritos, salvarFavoritoNoBanco } from "../services/locationsStorage";
import { buscarLocalizacaoAtual, REGIAO_PADRAO } from "../services/location";
import { verificarProximidadeTarefas } from "../services/proximidade";

/**
 * NovaTarefa
 * Tela de criação de nova tarefa com campos de título, descrição, prioridade e localização.
 */
export default function NovaTarefa() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [nomeLocal, setNomeLocal] = useState("");
  const [coordenada, setCoordenada] = useState(REGIAO_PADRAO);
  const [region, setRegion] = useState({
    ...REGIAO_PADRAO,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritosAberto, setModalFavoritosAberto] = useState(false);
  const [salvandoFavorito, setSalvandoFavorito] = useState(false);
  const [userId, setUserId] = useState(null);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(true);
  const mapRef = useRef(null);

  // Inicializa o usuário e a localização padrão ao carregar a tela.
  useEffect(() => {
    async function inicializar() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        setUserId(session.user.id);
      }

      const localizacao = await buscarLocalizacaoAtual();

      if (localizacao) {
        setCoordenada(localizacao);
        setRegion({
          ...localizacao,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      setCarregandoLocalizacao(false);
    }

    inicializar();
  }, []);

  useEffect(() => {
    if (!modalFavoritosAberto || !userId) {
      return;
    }

    carregarFavoritosUsuario();
  }, [modalFavoritosAberto, userId]);

  /**
   * abrirModalFavoritos
   * Exibe a lista de locais favoritos do usuário autenticado.
   */
  async function abrirModalFavoritos() {
    setModalFavoritosAberto(true);
  }

  /**
   * atualizarCoordenada
   * Atualiza o marcador e a região do mapa com a coordenada selecionada.
   */
  function atualizarCoordenada(novaCoordenada) {
    setCoordenada(novaCoordenada);
    setRegion({
      ...novaCoordenada,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  }

  /**
   * centralizarMapa
   * Centraliza o mapa no ponto atualmente selecionado.
   */
  function centralizarMapa() {
    mapRef.current?.animateToRegion({
      ...coordenada,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  }

  /**
   * fecharModalFavoritos
   * Fecha o modal de seleção de favoritos.
   */
  function fecharModalFavoritos() {
    setModalFavoritosAberto(false);
  }

  /**
   * carregarFavoritosUsuario
   * Carrega os favoritos do usuário autenticado para exibir no modal.
   */
  async function carregarFavoritosUsuario() {
    if (!userId) {
      return;
    }

    const lista = await obterLocaisFavoritos(userId);
    setFavoritos(lista);
  }

  /**
   * salvarLocalNosFavoritos
   * Salva o local atualmente selecionado como favorito. Primeiro valida duplicidade
   * consultando favoritos do usuário (localmente e no Supabase via salvarFavoritoNoBanco).
   * Em caso de sucesso atualiza a lista `favoritos` para refletir imediatamente.
   */
  async function salvarLocalNosFavoritos() {
    if (!userId) {
      Alert.alert("Atenção", "Usuário não autenticado. Faça login para salvar favoritos.");
      return;
    }

    if (!coordenada?.latitude || !coordenada?.longitude) {
      Alert.alert("Atenção", "Escolha um local no mapa antes de salvar.");
      return;
    }

    if (!nomeLocal || !nomeLocal.trim()) {
      Alert.alert("Atenção", "Informe um nome para o local favorito.");
      return;
    }

    setSalvandoFavorito(true);

    try {
      // Verifica duplicidade localmente primeiro
      const locaisAtuais = await obterLocaisFavoritos(userId);
      const existeLocal = locaisAtuais.some((l) => l.name && l.name.toLowerCase() === nomeLocal.trim().toLowerCase());

      if (existeLocal) {
        Alert.alert("Atenção", "Já existe um local favorito com esse nome.");
        setSalvandoFavorito(false);
        return;
      }

      // Tenta salvar no Supabase (ou fallback local dentro da função)
      const salvo = await salvarFavoritoNoBanco(nomeLocal.trim(), coordenada.latitude, coordenada.longitude, userId);

      // Atualiza lista local imediatamente
      const atualizados = [
        // Normalize a estrutura retornada (pode vir do Supabase ou do AsyncStorage)
        {
          id: salvo.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: salvo.name || nomeLocal.trim(),
          latitude: salvo.latitude || coordenada.latitude,
          longitude: salvo.longitude || coordenada.longitude,
          userId,
          created_at: salvo.created_at || new Date().toISOString(),
        },
        ...favoritos,
      ];

      setFavoritos(atualizados.filter((f, i, arr) => arr.findIndex(a => a.name === f.name && a.userId === f.userId) === i));

      Alert.alert("Sucesso", "Local favorito salvo com sucesso.");
    } catch (error) {
      if (error?.code === "DUPLICADO") {
        Alert.alert("Atenção", "Já existe um local favorito com esse nome.");
      } else {
        Alert.alert("Erro", error.message || "Erro ao salvar favorito.");
      }
    } finally {
      setSalvandoFavorito(false);
    }
  }

  /**
   * selecionarFavorito
   * Preenche o local e posiciona o marcador com base no favorito selecionado.
   */
  function selecionarFavorito(favorito) {
    setNomeLocal(favorito.name);
    atualizarCoordenada({
      latitude: favorito.latitude,
      longitude: favorito.longitude,
    });
    fecharModalFavoritos();
  }

  // Salva a tarefa no Supabase com latitude e longitude quando disponíveis.
  async function salvarTarefa() {
    if (!titulo.trim()) {
      setErro("Informe o título da tarefa.");
      return;
    }

    if (!coordenada?.latitude || !coordenada?.longitude) {
      setErro("Escolha um local no mapa antes de salvar.");
      return;
    }

    setLoading(true);
    setErro(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setErro("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("tarefas").insert([
      {
        user_id: session.user.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prioridade,
        concluida: false,
        nome_local: nomeLocal.trim() || null,
        latitude: coordenada.latitude,
        longitude: coordenada.longitude,
      },
    ]);

    if (error) {
      setErro("Erro ao criar tarefa: " + error.message);
      setLoading(false);
      return;
    }

    // Após criar a tarefa, verifica proximidade imediatamente para disparar
    // notificação caso o usuário já esteja dentro do raio configurado.
    try {
      await verificarProximidadeTarefas();
    } catch (e) {
      console.warn("Erro ao verificar proximidade após criar tarefa:", e.message || e);
    }

    setLoading(false);
    navigation.navigate("Tarefas");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
          <IconButton
            icon="arrow-left"
            size={26}
            onPress={() => navigation.goBack()}
          />
        <View style={styles.headerTextBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Nova tarefa
          </Text>

          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Cadastre uma tarefa vinculada a um local.
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

        <TextInput
          label="Nome do local"
          value={nomeLocal}
          onChangeText={setNomeLocal}
          mode="outlined"
          style={styles.input}
          placeholder="Exemplo: Mercado, escola, farmácia"
        />

        <Button
          mode="outlined"
          onPress={abrirModalFavoritos}
          style={styles.selectButton}
        >
          Locais Favoritos
        </Button>

        <Text variant="titleSmall" style={styles.label}>
          Localização no mapa
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            initialRegion={region}
            showsUserLocation={true}
            onPress={(evento) => atualizarCoordenada(evento.nativeEvent.coordinate)}
            onRegionChangeComplete={setRegion}
          >
            <Marker
              coordinate={coordenada}
              draggable
              onDragEnd={(evento) => atualizarCoordenada(evento.nativeEvent.coordinate)}
            />
          </MapView>
        </View>

        <View style={styles.coordinateRow}>
          <View style={styles.coordinateBox}>
            <Text variant="bodySmall" style={styles.coordinateLabel}>
              Latitude
            </Text>
            <Text variant="bodyMedium" style={styles.coordinateValue}>
              {coordenada.latitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.coordinateBox}>
            <Text variant="bodySmall" style={styles.coordinateLabel}>
              Longitude
            </Text>
            <Text variant="bodyMedium" style={styles.coordinateValue}>
              {coordenada.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={salvarLocalNosFavoritos}
          disabled={!coordenada?.latitude || !coordenada?.longitude || salvandoFavorito}
          loading={salvandoFavorito}
          style={styles.selectButton}
        >
          Salvar Local nos Favoritos
        </Button>

        <Button
          mode="contained"
          onPress={salvarTarefa}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Salvar tarefa
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.secondaryButton}
        >
          Cancelar
        </Button>
      </ScrollView>

      <Modal
        visible={modalFavoritosAberto}
        animationType="slide"
        transparent
        onRequestClose={fecharModalFavoritos}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Locais Favoritos
            </Text>

            {favoritos.length === 0 ? (
              <Text style={styles.modalText}>
                Nenhum favorito encontrado.
              </Text>
            ) : (
              <ScrollView style={styles.modalList}>
                {favoritos.map((favorito) => (
                  <List.Item
                    key={favorito.id}
                    title={favorito.name}
                    description={`${favorito.latitude.toFixed(5)}, ${favorito.longitude.toFixed(5)}`}
                    onPress={() => selecionarFavorito(favorito)}
                    left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
                  />
                ))}
              </ScrollView>
            )}

            <Button mode="contained" onPress={fecharModalFavoritos} style={styles.modalCloseButton}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={!!erro}
        onDismiss={() => setErro(null)}
        duration={4000}
      >
        {erro}
      </Snackbar>
    </View>
    </TouchableWithoutFeedback>
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

  selectButton: {
    marginBottom: 16,
    borderRadius: 999,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },

  modalTitle: {
    marginBottom: 12,
    fontWeight: "bold",
  },

  modalText: {
    marginBottom: 20,
    color: "#000000",
  },

  modalList: {
    marginBottom: 16,
  },

  modalCloseButton: {
    borderRadius: 999,
  },

  label: {
    color: "#000000",
    marginBottom: 8,
  },

  segmented: {
    marginBottom: 16,
  },

  /* Estilos do mapa e exibição de coordenadas.
     - mapContainer: área fixa para garantir exibição do MapView.
     - map: expande para preencher a área do container.
     - coordinateRow/Box: layout para exibir latitude/longitude somente leitura. */
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#EDEDED",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  coordinateBox: {
    flex: 1,
    marginRight: 8,
  },
  coordinateLabel: {
    color: "#000000",
  },
  coordinateValue: {
    color: "#000000",
    fontWeight: "bold",
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
});