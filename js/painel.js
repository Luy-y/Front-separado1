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

        ajustarTamanhoMapa();

    } catch (err) {
        console.error("Erro ao carregar o mapa SVG:", err);

        container.innerHTML =
            '<p class="carregando-svg">Não foi possível carregar o mapa.</p>';
    }
}

/* ===========================================================
   DIMENSIONAMENTO DO MAPA (JS, medindo pixels reais)
   -----------------------------------------------------------
   Em vez de depender de CSS (width/height/aspect-ratio em cascata
   por vários níveis de flexbox, o que pode falhar silenciosamente
   em navegadores mais antigos usados em players de sinalização),
   medimos o espaço real disponível em #mapaSvgContainer e calculamos
   o maior tamanho possível do SVG que ainda cabe inteiro ali dentro,
   preservando a proporção do viewBox. É a mesma lógica de um
   "object-fit: contain", mas aplicada via atributos reais do SVG.
=========================================================== */

/* fração do espaço disponível que o mapa deve preencher (0.97 = 97%) */
const PREENCHIMENTO_MAPA = 0.97;

function ajustarTamanhoMapa() {

    const svg = document.querySelector("#mapaSvgContainer svg");
    const container = document.getElementById("mapaSvgContainer");

    if (!svg || !container) return;

    // dimensões intrínsecas do desenho, lidas diretamente do viewBox do SVG
    const vb = svg.viewBox && svg.viewBox.baseVal;

    if (!vb || !vb.width || !vb.height) return;

    // espaço real disponível, em pixels, medido no DOM
    const larguraDisponivel = container.clientWidth;
    const alturaDisponivel = container.clientHeight;

    if (!larguraDisponivel || !alturaDisponivel) return;

    // maior escala possível sem cortar nenhuma parte do desenho (equivalente a "contain")
    const escala = Math.min(
        larguraDisponivel / vb.width,
        alturaDisponivel / vb.height
    ) * PREENCHIMENTO_MAPA;

    const larguraFinal = vb.width * escala;
    const alturaFinal = vb.height * escala;

    // aplicado como estilo inline: tem prioridade sobre qualquer regra do painel.css
    svg.style.width = `${larguraFinal}px`;
    svg.style.height = `${alturaFinal}px`;
}

/* Reaplica o cálculo sempre que o container mudar de tamanho
   (redimensionamento da janela, mudança de resolução do telão etc.) */
if (typeof ResizeObserver !== "undefined") {
    const observadorMapa = new ResizeObserver(() => ajustarTamanhoMapa());
    document.addEventListener("DOMContentLoaded", () => {
        const container = document.getElementById("mapaSvgContainer");
        if (container) observadorMapa.observe(container);
    });
}

/* fallback para navegadores sem ResizeObserver (comuns em players de sinalização antigos) */
window.addEventListener("resize", ajustarTamanhoMapa);

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
   OCUPAÇÃO
=========================================================== */

async function carregarOcupacao() {

    const turno = getTurnoAtual();

    const status = document.getElementById("statusTurno");

    /* fora do horário de funcionamento: tudo cinza */
    if (!turno) {

        status.textContent = "Fora do horário de funcionamento";

        LABS.forEach(id => definirStatusLab(id, "indisponivel"));

        return;
    }

    status.textContent = `Turno atual: ${turno}`;

    try {

        const res = await fetch(API);

        if (!res.ok) throw new Error("HTTP " + res.status);

        const dados = await res.json();

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

    } catch (err) {

        console.error("Erro ao carregar ocupação:", err);

        status.textContent = `Turno atual: ${turno} (erro ao atualizar dados)`;
    }
}

/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */

async function iniciar() {

    formatarData();

    await carregarMapaSvg();   // garante que as salas (ids) já existem no DOM
    await carregarOcupacao();  // só então aplica os status
}

/* ⏰ relógio */
setInterval(formatarData, 1000);

/* 🔄 atualização da ocupação */
setInterval(carregarOcupacao, 30000);

iniciar();
