import * as Location from "expo-location";

export const LOCAL_PADRAO = {
  latitude: -23.5505,
  longitude: -46.6333,
};

export const REGIAO_PADRAO = {
  ...LOCAL_PADRAO,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/**
 * pedirPermissaoLocalizacao
 * Solicita permissão de localização ao usuário.
 */
export async function pedirPermissaoLocalizacao() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * buscarLocalizacaoAtual
 * Retorna a posição atual do dispositivo quando a permissão é concedida.
 */
export async function buscarLocalizacaoAtual() {
  const temPermissao = await pedirPermissaoLocalizacao();

  if (!temPermissao) {
    return null;
  }

  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
