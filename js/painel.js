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

function formatarHora(data) {
    const d = new Date(data);

    return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

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

/* 🎨 Ícones por curso */
function getIcone(curso) {

    curso = (curso || "").toLowerCase();

    if (curso.includes("desenvolvimento")) return "💻";
    if (curso.includes("mec")) return "⚙️";
    if (curso.includes("elet")) return "🔧";
    if (curso.includes("log")) return "📊";
    if (curso.includes("seg")) return "🦺";
    if (curso.includes("info")) return "🖥️";

    return "📘";
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
/* Aplica o status (livre / ocupado / indisponivel) numa sala do SVG */
function definirStatusLab(labId, status) {

    const grupo = document.getElementById(labId);

    if (!grupo) return;

    grupo.classList.remove("livre", "ocupado", "indisponivel");
    grupo.classList.add(status);

    const label = document.getElementById(`status-${labId}`);

    if (!label) return;

    const textos = {
        livre: "LIVRE",
        ocupado: "OCUPADO",
        indisponivel: "INDISPONÍVEL"
    };

    label.textContent = textos[status] || "";
}

/* Monta o código legível (ex: LAB203B -> 203 B) */
function codigoLegivel(labId) {
    return labId.replace("LAB", "").replace(/(\d+)([AB])/, "$1 $2");
}

/* Atualiza o painel lateral com os detalhes das salas ocupadas agora */
function renderizarListaOcupados(ocupados) {

    const listaEl = document.getElementById("listaOcupados");

    if (!listaEl) return;

    const ids = Object.keys(ocupados);

    if (ids.length === 0) {
        listaEl.innerHTML =
            '<p class="sem-ocupacao">Nenhuma sala ocupada neste momento.</p>';
        return;
    }

    listaEl.innerHTML = ids.map(id => {

        const r = ocupados[id];
        const icone = getIcone(r.curso_nome);

        return `
            <div class="item-ocupado">
                <div class="icone">${icone}</div>
                <div class="info">
                    <strong>${codigoLegivel(id)} — ${r.nome_turma || "-"}</strong>
                    <span>${r.curso_nome || "-"}</span>
                    <span>${r.instrutor_nome || "-"}</span>
                    <span>${formatarHora(r.data_inicio)} - ${formatarHora(r.data_fim)}</span>
                </div>
            </div>
        `;
    }).join("");
}

/* ===========================================================
   OCUPAÇÃO
=========================================================== */

async function carregarOcupacao() {

    const turno = getTurnoAtual();

    const status = document.getElementById("statusTurno");
    const listaEl = document.getElementById("listaOcupados");

    /* fora do horário de funcionamento: tudo cinza */
    if (!turno) {

        status.textContent = "Fora do horário de funcionamento";

        LABS.forEach(id => definirStatusLab(id, "indisponivel"));

        if (listaEl) {
            listaEl.innerHTML =
                '<p class="sem-ocupacao">Painel fora do horário de funcionamento.</p>';
        }

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

        /* aplica o status em cada sala do SVG */
        LABS.forEach(id => {
            definirStatusLab(id, ocupados[id] ? "ocupado" : "livre");
        });

        renderizarListaOcupados(ocupados);

    } catch (err) {

        console.error("Erro ao carregar ocupação:", err);

        status.textContent = `Turno atual: ${turno} (erro ao atualizar dados)`;

        if (listaEl) {
            listaEl.innerHTML =
                '<p class="erro-ocupacao">Erro ao carregar dados de ocupação.</p>';
        }
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
