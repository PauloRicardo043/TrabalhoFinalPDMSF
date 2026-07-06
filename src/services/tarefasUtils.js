export const prioridades = {
  alta: {
    label: "Alta",
    cor: "#D32F2F",
  },
  media: {
    label: "Média",
    cor: "#F9A825",
  },
  baixa: {
    label: "Baixa",
    cor: "#1976D2",
  },
};

/**
 * getPrioridadeInfo
 * Retorna label e cor de prioridade com base no valor informado.
 */
export function getPrioridadeInfo(prioridade) {
  return prioridades[prioridade] || prioridades.media;
}

/**
 * getCorMarcador
 * Retorna a cor do marcador do mapa para uma prioridade de tarefa.
 */
export function getCorMarcador(prioridade) {
  switch (prioridade) {
    case "alta":
      return "red";
    case "media":
      return "yellow";
    case "baixa":
      return "green";
    default:
      return "blue";
  }
}

/**
 * formatarData
 * Formata uma data para o padrão pt-BR ou retorna string vazia se inválida.
 */
export function formatarData(data) {
  if (!data) return "";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR");
}
