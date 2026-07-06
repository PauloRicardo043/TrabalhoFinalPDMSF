import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Button, FAB, Text, TextInput, List, useTheme } from "react-native-paper";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";

import { buscarLocalizacaoAtual, REGIAO_PADRAO } from "../services/location";
import { supabase } from "../services/supabase";
import { adicionarLocalFavorito, obterLocaisFavoritos, removerLocalFavorito } from "../services/locationsStorage";

/**
 * SelecionarLocal
 * Tela de seleção de local no mapa, com opção de salvar favoritos e confirmar coordenadas.
 */
export default function SelecionarLocal() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [coordenada, setCoordenada] = useState(
    route.params?.coordenadaInicial || REGIAO_PADRAO
  );
  const [region, setRegion] = useState({
    ...coordenada,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [nomeLocal, setNomeLocal] = useState(route.params?.nomeLocal || "");
  const [locaisFavoritos, setLocaisFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [userId, setUserId] = useState(null);
  const retornoKey = route.params?.retornoKey;

  useEffect(() => {
    async function carregarLocalInicial() {
      setCarregando(true);

      const localizacao = await buscarLocalizacaoAtual();

      if (localizacao) {
        setPosicaoAtual(localizacao);
        setCoordenada(localizacao);
        setRegion({
          ...localizacao,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setMensagem(null);
      } else {
        setMensagem("Permissão de localização negada. Você pode escolher um ponto no mapa.");
      }

      setCarregando(false);
    }

    async function carregarUsuarioAtual() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!error && session?.user?.id) {
        setUserId(session.user.id);
      }
    }

    carregarLocalInicial();
    carregarUsuarioAtual();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    carregarLocaisFavoritos();
  }, [userId]);

  /**
   * carregarLocaisFavoritos
   * Carrega os locais favoritos do armazenamento local.
   */
  async function carregarLocaisFavoritos() {
    if (!userId) {
      return;
    }

    const locais = await obterLocaisFavoritos(userId);
    setLocaisFavoritos(locais);
  }

  /**
   * centralizarLocalizacao
   * Centraliza o mapa na posição atual do dispositivo ou no ponto selecionado.
   */
  function centralizarLocalizacao() {
    const destino = posicaoAtual || coordenada;

    if (!destino) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...destino,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      800
    );
  }

  /**
   * salvarFavorito
   * Salva o local atualmente selecionado como favorito no armazenamento local.
   */
  async function salvarFavorito() {
    if (!userId) {
      setMensagem("Usuário não autenticado. Faça login para salvar um favorito.");
      return;
    }

    if (!nomeLocal.trim()) {
      setMensagem("Informe um nome para o local favorito.");
      return;
    }

    try {
      await adicionarLocalFavorito(
        nomeLocal.trim(),
        coordenada.latitude,
        coordenada.longitude,
        userId
      );
      await carregarLocaisFavoritos();
      setMensagem("Local salvo como favorito.");
    } catch (error) {
      setMensagem(error.message || "Erro ao salvar local favorito.");
    }
  }

  /**
   * selecionarFavorito
   * Ajusta o mapa e o nome do local para o favorito selecionado.
   */
  function selecionarFavorito(local) {
    setCoordenada({ latitude: local.latitude, longitude: local.longitude });
    setRegion({
      latitude: local.latitude,
      longitude: local.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
    setNomeLocal(local.name);
  }

  /**
   * excluirFavorito
   * Remove um local favorito salvo pelo usuário.
   */
  async function excluirFavorito(id) {
    await removerLocalFavorito(id, userId);
    carregarLocaisFavoritos();
  }

  /**
   * confirmarLocal
   * Envia o local selecionado de volta para a tela de nova tarefa sem reiniciar o formulário.
   */
  function confirmarLocal() {
    if (retornoKey) {
      navigation.dispatch(
        CommonActions.setParams({
          params: {
            localSelecionado: {
              latitude: coordenada.latitude,
              longitude: coordenada.longitude,
            },
            nomeLocal: nomeLocal.trim(),
          },
          source: retornoKey,
        })
      );
      navigation.goBack();
      return;
    }

    navigation.navigate("NovaTarefa", {
      localSelecionado: {
        latitude: coordenada.latitude,
        longitude: coordenada.longitude,
      },
      nomeLocal: nomeLocal.trim(),
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Button icon="arrow-left" mode="text" onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </View>

      <View style={styles.favoriteForm}>
        <TextInput
          label="Nome do local"
          value={nomeLocal}
          onChangeText={setNomeLocal}
          mode="outlined"
          style={styles.favoriteInput}
          placeholder="Ex: Casa, Trabalho, Supermercado"
        />

        <Button mode="contained" onPress={salvarFavorito} style={styles.saveFavoriteButton}>
          Salvar local favorito
        </Button>
      </View>

      {locaisFavoritos.length > 0 ? (
        <List.Section title="Locais favoritos" style={styles.favoritesSection}>
          {locaisFavoritos.map((local) => (
            <List.Item
              key={local.id}
              title={local.name}
              description={`${local.latitude.toFixed(5)}, ${local.longitude.toFixed(5)}`}
              left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
              right={() => (
                <Button compact onPress={() => excluirFavorito(local.id)}>
                  Excluir
                </Button>
              )}
              onPress={() => selecionarFavorito(local)}
            />
          ))}
        </List.Section>
      ) : null}

      {carregando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Buscando sua localização...</Text>
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation={Boolean(posicaoAtual)}
        onRegionChangeComplete={setRegion}
        onPress={(evento) => {
          const novoPonto = evento.nativeEvent.coordinate;
          setCoordenada(novoPonto);
        }}
      >
        <Marker
          coordinate={coordenada}
          draggable
          onDragEnd={(evento) => setCoordenada(evento.nativeEvent.coordinate)}
        />
      </MapView>

      {mensagem ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{mensagem}</Text>
        </View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}> 
        <Button mode="contained" onPress={confirmarLocal} style={styles.confirmButton}>
          Confirmar Local
        </Button>
      </View>

      <FAB
        icon="crosshairs-gps"
        style={styles.fab}
        onPress={centralizarLocalizacao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    zIndex: 2,
  },
  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  loadingText: {
    marginTop: 12,
    color: "#000000",
  },
  map: {
    flex: 1,
  },
  messageBox: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  messageText: {
    color: "#000000",
  },
  favoriteForm: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  favoriteInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  saveFavoriteButton: {
    borderRadius: 999,
  },
  favoritesSection: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
  },
  confirmButton: {
    borderRadius: 999,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 100,
    backgroundColor: "#1976D2",
  },
});
