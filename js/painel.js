const API = "https://api-production-19484.up.railway.app/relatorios/ocupacao-hoje";

/* IDs de todos os laboratórios monitorados (devem existir no SVG com esse mesmo id) */
const LABS = [
    "LAB201A",
    "LAB202A",
    "LAB203A",
    "LAB204A",
    "LAB205A",
    "LAB206A",
    "LAB207A",
    "LAB208A",
    "LAB209A",
    "LAB203B",
    "LAB204B",
    "LAB205B",
    "ELETRICA",
    "ELETROHIDRO",   // era ELETROELETRONICA — não existia no SVG
    "INDUSTRIAL",
    "COSTURA",
    "PREDIAL",       // não estava no array
    "MODELAGEM",     // não estava no array
    "LABMAKER"
    // REFRIGERACAO removido — sem sala correspondente no SVG
];

function formatarData() {
    const agora = new Date();

    const data = agora.toLocaleDateString("pt-BR");

    const diaSemana = agora.toLocaleDateString("pt-BR", {
        weekday: "long"
    });

    const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    document.getElementById("dataAtual").textContent = data;

    document.getElementById("diaSemana").textContent =
        diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    document.getElementById("horaAtual").textContent = hora;
}

/* 🔥 TURNO */
function getTurnoAtual() {
    const agora = new Date();

    const h = agora.getHours();
    const m = agora.getMinutes();

    const minutos = h * 60 + m;

    if (minutos >= (12 * 60 + 55) && minutos <= (17 * 60 + 50)) {
        return "Tarde";
    }

    if (minutos >= (17 * 60 + 55) && minutos <= (23 * 60)) {
        return "Noite";
    }

    return null;
}

/* ===========================================================
   MAPA (SVG)
=========================================================== */

/* Carrega o arquivo img/planta.svg e injeta no DOM, já que via
   <img src="..."> não seria possível estilizar/colorir as salas. */
async function carregarMapaSvg() {

    const container = document.getElementById("mapaSvgContainer");

    try {
        const res = await fetch("img/planta.svg");

        if (!res.ok) throw new Error("HTTP " + res.status);

        const svgText = await res.text();

        container.innerHTML = svgText;

    } catch (err) {
        console.error("Erro ao carregar o mapa SVG:", err);

        container.innerHTML =
            '<p class="carregando-svg">Não foi possível carregar o mapa.</p>';
    }
}

/* Converte "201 A", "Sala 203B", "LAB 205 A" etc. no id usado no SVG (ex: LAB201A) */
function normalizarAmbiente(nome) {
    if (!nome) return null;

    // Tenta padrão numérico: "201 A", "LAB 203B", etc.
    const m = nome.toUpperCase().match(/(\d{3})\s*([AB])\b/);
    if (m) return `LAB${m[1]}${m[2]}`;

    // Tenta match direto pelo nome (COSTURA, LABMAKER, ELETROHIDRO, etc.)
    const nomeLimpo = nome.toUpperCase().replace(/\s+/g, "");
    const mapaFixos = {
        "COSTURA":          "COSTURA",
        "LABMAKER":         "LABMAKER",
        "ELETROHIDRO":      "ELETROHIDRO",
        "ELETROELETRONICA": "ELETROHIDRO",  // alias da API
        "ELETRICA":         "ELETRICA",
        "INDUSTRIAL":       "INDUSTRIAL",
        "PREDIAL":          "PREDIAL",
        "MODELAGEM":        "MODELAGEM",
        "REFRIGERACAO":     null,            // sem sala no SVG
    };

    for (const [chave, id] of Object.entries(mapaFixos)) {
        if (nomeLimpo.includes(chave)) return id;
    }

    return null;
}

/* Aplica o status (livre / ocupado / indisponivel) numa sala do SVG,
   incluindo o nome do instrutor responsável quando a sala está ocupada */
function definirStatusLab(labId, status, instrutorNome) {

    const grupo = document.getElementById(labId);

    if (!grupo) return;

    grupo.classList.remove("livre", "ocupado", "indisponivel");
    grupo.classList.add(status);

    const label = document.getElementById(`status-${labId}`);

    if (label) {
        const textos = {
            livre: "LIVRE",
            ocupado: "OCUPADO",
            indisponivel: "INDISPONÍVEL"
        };

        label.textContent = textos[status] || "";
    }

    const instrutorEl = document.getElementById(`instrutor-${labId}`);

    if (instrutorEl) {
        instrutorEl.textContent = instrutorNome || "";
    }
}

/* ===========================================================
   OCUPAÇÃO (agora via SSE)
=========================================================== */

let eventSource = null;

/* Processa os dados recebidos (seja via SSE, seja de um fallback)
   e aplica o status em cada sala do mapa */
function processarOcupacao(dados) {

    const turno = getTurnoAtual();

    const status = document.getElementById("statusTurno");

    /* fora do horário de funcionamento: tudo cinza */
    if (!turno) {

        status.textContent = "Fora do horário de funcionamento";

        LABS.forEach(id => definirStatusLab(id, "indisponivel"));

        return;
    }

    status.textContent = `Turno atual: ${turno}`;

    const agora = new Date();

    /* mapa labId -> registro, somente das aulas em andamento AGORA */
    const ocupados = {};

    (dados.registros || []).forEach(r => {

        const inicio = new Date(r.data_inicio);
        const fim = new Date(r.data_fim);

        if (agora >= inicio && agora <= fim) {

            const labId = normalizarAmbiente(r.ambiente_nome);

            if (labId) ocupados[labId] = r;
        }
    });

    /* aplica o status em cada sala do SVG, junto com o instrutor responsável */
    LABS.forEach(id => {
        const registro = ocupados[id];
        definirStatusLab(id, registro ? "ocupado" : "livre", registro ? registro.instrutor_nome : "");
    });
}

/* Abre (ou reabre) a conexão SSE com o backend */
function conectarStreamOcupacao() {

    const status = document.getElementById("statusTurno");

    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource(API);

    eventSource.onmessage = (event) => {
        try {
            const dados = JSON.parse(event.data);

            if (dados.erro) {
                console.error("Erro reportado pelo servidor:", dados.erro);
                status.textContent = "Erro ao atualizar dados";
                return;
            }

            processarOcupacao(dados);

        } catch (err) {
            console.error("Erro ao processar evento SSE:", err);
        }
    };

    eventSource.onerror = (err) => {
        console.error("Erro na conexão SSE:", err);

        status.textContent = "Reconectando ao servidor...";

        // EventSource já tenta reconectar sozinho por padrão,
        // mas fechamos e recriamos manualmente por segurança
        eventSource.close();

        setTimeout(conectarStreamOcupacao, 5000);
    };
}

/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */

async function iniciar() {

    formatarData();

    await carregarMapaSvg();          // garante que as salas (ids) já existem no DOM
    conectarStreamOcupacao();         // abre o stream e aplica os status conforme chegam
}

/* ⏰ relógio */
setInterval(formatarData, 1000);

/* 🔄 revalida o turno a cada 30s, mesmo sem novo evento do servidor
   (útil pra pintar tudo de cinza no exato instante em que o turno acaba) */
setInterval(() => {
    if (!getTurnoAtual()) {
        document.getElementById("statusTurno").textContent = "Fora do horário de funcionamento";
        LABS.forEach(id => definirStatusLab(id, "indisponivel"));
    }
}, 30000);

iniciar();