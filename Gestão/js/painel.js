const API = "http://localhost:3000/relatorios/ocupacao-hoje";

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

    curso = curso.toLowerCase();

    if (curso.includes("desenvolvimento")) return "💻";
    if (curso.includes("mec")) return "⚙️";
    if (curso.includes("elet")) return "🔧";
    if (curso.includes("log")) return "📊";
    if (curso.includes("seg")) return "🦺";
    if (curso.includes("info")) return "🖥️";

    return "📘";
}

async function carregarOcupacao() {

    try {

        const turno = getTurnoAtual();

        const status = document.getElementById("statusTurno");

        const tabela = document.getElementById("tabelaOcupacao");

        if (!turno) {

            status.textContent = "Fora do horário de funcionamento";

            tabela.innerHTML =
                `<tr><td colspan="5">Sem ocupação no momento</td></tr>`;

            return;
        }

        status.textContent = `Turno atual: ${turno}`;

        const res = await fetch(API);

        const dados = await res.json();

        tabela.innerHTML = "";

        if (!dados.registros || dados.registros.length === 0) {

            tabela.innerHTML =
                `<tr><td colspan="5">Sem ocupação no momento</td></tr>`;

            return;
        }

        dados.registros.forEach(r => {

            const tr = document.createElement("tr");

            const icone = getIcone(r.curso_nome || "");

            tr.innerHTML = `
                <td class="turma">
                    <div class="box-turma">
                        <div class="icone">${icone}</div>
                        <span>${r.nome_turma}</span>
                    </div>
                </td>

                <td>${r.curso_nome || "-"}</td>

                <td>${r.instrutor_nome || "-"}</td>

                <td>
                    <span class="sala">
                        ${r.ambiente_nome || "-"}
                    </span>
                </td>

                <td>
                    ${formatarHora(r.data_inicio)}
                    -
                    ${formatarHora(r.data_fim)}
                </td>
            `;

            tabela.appendChild(tr);
        });

    } catch (err) {

        console.error("Erro ao carregar ocupação:", err);

        document.getElementById("tabelaOcupacao").innerHTML = `
            <tr>
                <td colspan="5">
                    Erro ao carregar dados
                </td>
            </tr>
        `;
    }
}

/* ⏰ relógio */
setInterval(formatarData, 1000);

/* 🔄 atualização da tabela */
setInterval(carregarOcupacao, 30000);

formatarData();
carregarOcupacao();