/* ═══════════════════════════════════════════════════════════════
   painel.js — v3
   Dados de ocupação exibidos DENTRO do SVG (sem cards laterais)
═══════════════════════════════════════════════════════════════ */

const API = "https://api-production-19484.up.railway.app/relatorios/ocupacao-hoje";

/* IDs de todos os laboratórios monitorados.
   Devem coincidir exatamente com os id="" no SVG. */
const LABS = [
    "LAB201A", "LAB202A", "LAB203A", "LAB204A", "LAB205A",
    "LAB206A", "LAB207A", "LAB208A", "LAB209A",
    "LAB203B", "LAB204B", "LAB205B",
    "ELETRICA", "ELETROHIDRO",
    "INDUSTRIAL", "PREDIAL", "MODELAGEM",
    "COSTURA", "LABMAKER"
];


/* ───────────────────────────────────────────────────────────────
   UTILITÁRIOS
─────────────────────────────────────────────────────────────── */

function formatarHora(dataStr) {
    return new Date(dataStr).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function truncar(txt, max = 24) {
    if (!txt) return "";
    return txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

function formatarData() {
    const agora = new Date();
    const data = agora.toLocaleDateString("pt-BR");
    const diaSemana = agora.toLocaleDateString("pt-BR", { weekday: "long" });
    const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    document.getElementById("dataAtual").textContent = data;
    document.getElementById("diaSemana").textContent =
        diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    document.getElementById("horaAtual").textContent = hora;
}

function getTurnoAtual() {
    const agora = new Date();
    const min = agora.getHours() * 60 + agora.getMinutes();

    if (min >= 12 * 60 + 55 && min <= 17 * 60 + 50) return "Tarde";
    if (min >= 17 * 60 + 55 && min <= 23 * 60)        return "Noite";
    return null;
}


/* ───────────────────────────────────────────────────────────────
   NORMALIZAÇÃO: nome do ambiente → id do SVG
─────────────────────────────────────────────────────────────── */

const MAPA_FIXOS = {
    "COSTURA":          "COSTURA",
    "LABMAKER":         "LABMAKER",
    "LAB MAKER":        "LABMAKER",
    "ELETROHIDRO":      "ELETROHIDRO",
    "ELETROELETRONICA": "ELETROHIDRO",   // alias que a API pode retornar
    "ELETRICA":         "ELETRICA",
    "ELÉTRICA":         "ELETRICA",
    "INDUSTRIAL":       "INDUSTRIAL",
    "PREDIAL":          "PREDIAL",
    "MODELAGEM":        "MODELAGEM",
    "REFRIGERACAO":     null,            // sem sala no SVG
};

function normalizarAmbiente(nome) {
    if (!nome) return null;

    // Tenta padrão numérico: "201 A", "LAB203B", "Sala 207 A" etc.
    const m = nome.toUpperCase().match(/(\d{3})\s*([AB])\b/);
    if (m) return `LAB${m[1]}${m[2]}`;

    // Tenta match por nome (remove espaços e acentos para comparar)
    const chave = nome.toUpperCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [k, id] of Object.entries(MAPA_FIXOS)) {
        const kNorm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (chave.includes(kNorm)) return id;
    }
    return null;
}


/* ───────────────────────────────────────────────────────────────
   MAPA SVG — carregamento e atualização de salas
─────────────────────────────────────────────────────────────── */

async function carregarMapaSvg() {
    const container = document.getElementById("mapaSvgContainer");
    try {
        const res = await fetch("img/planta.svg");
        if (!res.ok) throw new Error("HTTP " + res.status);
        container.innerHTML = await res.text();
    } catch (err) {
        console.error("Erro ao carregar o mapa SVG:", err);
        container.innerHTML = '<p class="carregando-svg">Não foi possível carregar o mapa.</p>';
    }
}

/* Aplica classe de status e atualiza os textos internos da sala */
function definirStatusLab(labId, status, registro = null) {
    const g = document.getElementById(labId);
    if (!g) return;

    /* ── classe CSS (controla cor/glow) ── */
    g.className.baseVal = g.className.baseVal
        .replace(/\b(livre|ocupado|indisponivel)\b/g, "")
        .trim() + " " + status;

    /* ── texto de status ── */
    const statusTextos = { livre: "LIVRE", ocupado: "OCUPADO", indisponivel: "INDISPONÍVEL" };
    const statusEl = document.getElementById(`status-${labId}`);
    if (statusEl) statusEl.textContent = statusTextos[status] ?? "";

    /* ── dados de ocupação (turma / instrutor / horário) ── */
    const estaOcupado = status === "ocupado" && registro;

    _setText(`turma-${labId}`,     estaOcupado ? truncar(registro.nome_turma    || "", 24) : "");
    _setText(`instrutor-${labId}`, estaOcupado ? truncar(registro.instrutor_nome || "", 26) : "");
    _setText(`horario-${labId}`,   estaOcupado
        ? `${formatarHora(registro.data_inicio)} – ${formatarHora(registro.data_fim)}`
        : "");

    // visibilidade dos textos de dados
    ["turma", "instrutor", "horario"].forEach(tipo => {
        const el = document.getElementById(`${tipo}-${labId}`);
        if (el) el.setAttribute("visibility", estaOcupado ? "visible" : "hidden");
    });
}

function _setText(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}


/* ───────────────────────────────────────────────────────────────
   OCUPAÇÃO — busca e atualização
─────────────────────────────────────────────────────────────── */

async function carregarOcupacao() {
    const turno    = getTurnoAtual();
    const statusEl = document.getElementById("statusTurno");

    if (!turno) {
        statusEl.textContent = "Fora do horário de funcionamento";
        LABS.forEach(id => definirStatusLab(id, "indisponivel"));
        return;
    }

    statusEl.textContent = `Turno atual: ${turno}`;

    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const dados = await res.json();

        const agora = new Date();

        /* monta mapa labId → registro (apenas aulas em andamento AGORA) */
        const ocupados = {};
        for (const r of (dados.registros || [])) {
            if (agora >= new Date(r.data_inicio) && agora <= new Date(r.data_fim)) {
                const labId = normalizarAmbiente(r.ambiente_nome);
                if (labId) ocupados[labId] = r;
            }
        }

        /* aplica status em todas as salas */
        LABS.forEach(id =>
            definirStatusLab(id, ocupados[id] ? "ocupado" : "livre", ocupados[id] ?? null)
        );

    } catch (err) {
        console.error("Erro ao carregar ocupação:", err);
        statusEl.textContent = `Turno atual: ${turno} — erro ao atualizar dados`;
    }
}


/* ───────────────────────────────────────────────────────────────
   INICIALIZAÇÃO
─────────────────────────────────────────────────────────────── */

async function iniciar() {
    formatarData();
    await carregarMapaSvg();    // precisa existir no DOM antes de setar status
    await carregarOcupacao();
}

setInterval(formatarData,     1_000);   // relógio ao vivo
setInterval(carregarOcupacao, 30_000);  // recarrega ocupação a cada 30s

iniciar();
