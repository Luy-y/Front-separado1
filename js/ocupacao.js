const API = "https://testando-production-8a14.up.railway.app/ocupacao-hoje";

function formatarHora(data) {
    const d = new Date(data);

    return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


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

async function carregarOcupacao() {
    try {
        const turno = getTurnoAtual();
        const status = document.getElementById("statusTurno");

        if (!turno) {
            status.textContent = "Fora do horário de funcionamento";

            document.getElementById("tabelaOcupacao").innerHTML =
                `<tr><td colspan="5">Sem ocupação no momento</td></tr>`;

            return;
        }

        status.textContent = `Turno atual: ${turno}`;

        const res = await fetch(API);
        const dados = await res.json();

        const tabela = document.getElementById("tabelaOcupacao");
        tabela.innerHTML = "";

        if (!dados.registros || dados.registros.length === 0) {
            tabela.innerHTML = `<tr><td colspan="5">Sem ocupação no momento</td></tr>`;
            return;
        }

        dados.registros.forEach(r => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${formatarHora(r.data_inicio)}</td>
                <td>${formatarHora(r.data_fim)}</td>
                <td>${r.ambiente_nome}</td>
                <td>${r.instrutor_nome}</td>
                <td>${r.nome_turma}</td>
            `;

            tabela.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
    }
}

/* 🔁 atualiza automático */
setInterval(carregarOcupacao, 30000);

carregarOcupacao();