const API_URL = "https://api-production-32be.up.railway.app/registros";
const API_AMBIENTES = "https://api-production-32be.up.railway.app/ambientes";
const API_INSTRUTORES = "https://api-production-32be.up.railway.app/instrutores";
const API_TURMAS = "https://api-production-32be.up.railway.app/turmas";


function formatarData(data) {
    if (!data) return "";

    const d = new Date(data);

    return d.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* 🔥 CORREÇÃO DO PROBLEMA DE UTC */
function formatISOLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes())
    );
}

/* 🔥 CORRIGIDO (SEM toISOString) */
function getHoje() {
    const hoje = new Date();

    const inicio = new Date(hoje);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(hoje);
    fim.setHours(23, 59, 59, 999);

    return {
        inicio: formatISOLocal(inicio),
        fim: formatISOLocal(fim)
    };
}

async function carregarAmbientes() {
    const res = await fetch(API_AMBIENTES);
    const dados = await res.json();

    const select = document.getElementById("filtroAmbiente");
    select.innerHTML = `<option value="">Ambiente</option>`;

    dados.forEach(i => {
        const option = document.createElement("option");
        option.value = i.id_ambientes;
        option.textContent = i.nome;
        select.appendChild(option);
    });
}

async function carregarInstrutores() {
    const res = await fetch(API_INSTRUTORES);
    const dados = await res.json();

    const select = document.getElementById("filtroInstrutor");
    select.innerHTML = `<option value="">Instrutor</option>`;

    dados.forEach(i => {
        const option = document.createElement("option");
        option.value = i.id_instrutor;
        option.textContent = i.nome;
        select.appendChild(option);
    });
}

async function carregarTurmas() {
    const res = await fetch(API_TURMAS);
    const dados = await res.json();

    const select = document.getElementById("filtroTurma");
    select.innerHTML = `<option value="">Turma</option>`;

    dados.forEach(i => {
        const option = document.createElement("option");
        option.value = i.id_turmas;
        option.textContent = i.nome_turma;
        select.appendChild(option);
    });
}

async function buscar() {
    const data_inicio = document.getElementById("dataInicio").value;
    const data_fim = document.getElementById("dataFim").value;

    const ambiente = document.getElementById("filtroAmbiente").value;
    const instrutor = document.getElementById("filtroInstrutor").value;
    const turma = document.getElementById("filtroTurma").value;

    const res = await fetch(`${API_URL}/gerar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            data_inicio,
            data_fim,
            ambiente,
            instrutor,
            turma
        })
    });

    const dados = await res.json();
    renderTabela(dados);
}

function renderTabela(dados) {
    const tabela = document.getElementById("tabelaRelatorios");
    tabela.innerHTML = "";

    if (!dados.registros || dados.registros.length === 0) {
        tabela.innerHTML = `<tr><td colspan="5">Nenhum resultado</td></tr>`;
        return;
    }

    dados.registros.forEach(r => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${formatarData(r.data_inicio)}</td>
            <td>${formatarData(r.data_fim)}</td>
            <td>${r.ambiente_nome}</td>
            <td>${r.instrutor_nome}</td>
            <td>${r.nome_turma}</td>
        `;

        tabela.appendChild(tr);
    });
}

async function exportarRelatorio() {
    const data_inicio = document.getElementById("dataInicio").value;
    const data_fim = document.getElementById("dataFim").value;

    const ambiente = document.getElementById("filtroAmbiente").value;
    const instrutor = document.getElementById("filtroInstrutor").value;
    const turma = document.getElementById("filtroTurma").value;

    try {
        const res = await fetch(`${API_URL}/exportar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data_inicio,
                data_fim,
                ambiente,
                instrutor,
                turma
            })
        });

        const data = await res.json();

        if (!data.arquivo) {
            alert(data.mensagem);
            return;
        }

        const link = document.createElement("a");
        link.href = `http://localhost:3000/relatorios/arquivo/${data.arquivo}`;
        link.download = data.arquivo;
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro ao exportar relatório");
    }
}

function init() {
    const { inicio, fim } = getHoje();

    document.getElementById("dataInicio").value = inicio;
    document.getElementById("dataFim").value = fim;

    carregarAmbientes();
    carregarInstrutores();
    carregarTurmas();

    buscar();

    document.getElementById("dataInicio").addEventListener("change", buscar);
    document.getElementById("dataFim").addEventListener("change", buscar);
    document.getElementById("filtroAmbiente").addEventListener("change", buscar);
    document.getElementById("filtroInstrutor").addEventListener("change", buscar);
    document.getElementById("filtroTurma").addEventListener("change", buscar);
}

function logout() {
    sessionStorage.clear();
    window.location.replace("../html/index.html");
}

init();