import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { FAB, IconButton, Snackbar, Text, useTheme } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";

import { buscarLocalizacaoAtual, REGIAO_PADRAO } from "../services/location";
import { supabase } from "../services/supabase";
import { getCorMarcador } from "../services/tarefasUtils";

/**
 * Maps
 * Tela de mapa com marcadores de tarefas geolocalizadas.
 */
export default function Maps() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [region, setRegion] = useState(REGIAO_PADRAO);
  const [posicaoAtual, setPosicaoAtual] = useState(null);

  /**
   * buscarTarefas
   * Busca todas as tarefas do usuário para exibir no mapa.
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
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("tarefas")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      setErro("Erro ao carregar tarefas: " + error.message);
      setTarefas([]);
    } else {
      setTarefas(data || []);
    }

    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      buscarTarefas();
    }, [buscarTarefas])
  );

  useEffect(() => {
    async function carregarLocalizacao() {
      const localizacao = await buscarLocalizacaoAtual();

      if (localizacao) {
        setPosicaoAtual(localizacao);
        setRegion({
          ...localizacao,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    }

    carregarLocalizacao();
  }, []);

  /**
   * centralizarNoUsuario
   * Centraliza o mapa na localização atual do usuário.
   */
  function centralizarNoUsuario() {
    if (!posicaoAtual) {
      Alert.alert("Localização", "Não foi possível localizar o dispositivo neste momento.");
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...posicaoAtual,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      800
    );
  }

  /**
   * abrirDetalhes
   * Navega para a tela de detalhes da tarefa selecionada no mapa.
   */
  function abrirDetalhes(tarefa) {
    navigation.navigate("DetalhesTarefa", { tarefa });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />

        <Text variant="headlineSmall" style={styles.headerTitle}>
          Mapa
        </Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        initialRegion={region}
        showsUserLocation={Boolean(posicaoAtual)}
        onRegionChangeComplete={setRegion}
      >
        {tarefas
          .filter((tarefa) => tarefa.latitude !== null && tarefa.longitude !== null)
          .map((tarefa) => (
            <Marker
              key={tarefa.id}
              coordinate={{
                latitude: Number(tarefa.latitude),
                longitude: Number(tarefa.longitude),
              }}
              pinColor={getCorMarcador(tarefa.prioridade)}
              onPress={() => abrirDetalhes(tarefa)}
            />
          ))}
      </MapView>

      {carregando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Carregando mapa...</Text>
        </View>
      ) : null}

      <FAB
        icon="crosshairs-gps"
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={centralizarNoUsuario}
      />

      <Snackbar visible={!!erro} onDismiss={() => setErro(null)} duration={4000}>
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
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginLeft: 4,
  },
  map: {
    flex: 1,
  },
  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    zIndex: 2,
  },
  loadingText: {
    marginTop: 12,
    color: "#000000",
  },
  fab: {
    position: "absolute",
    right: 16,
    backgroundColor: "#1976D2",
  },
});
