const API_URL = "https://front-separado1.vercel.app/registros";
const API_AMBIENTES = "https://front-separado1.vercel.app/ambientes";
const API_INSTRUTORES = "https://front-separado1.vercel.app/instrutores";
const API_TURMAS = "https://front-separado1.vercel.app/turmas";

let ambientesMap = {};
let instrutoresMap = {};
let turmasMap = {};

function formatarData(data) {
    if (!data) return "";

    const d = new Date(data);

    return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function carregarAmbientes() {
    const res = await fetch(API_AMBIENTES);
    const data = await res.json();

    const add = document.getElementById("ambienteAdd");
    const edit = document.getElementById("ambienteEdit");

    add.innerHTML = "";
    edit.innerHTML = "";

    data.forEach(i => {

        ambientesMap[i.id_ambientes] = i.nome;

        const o1 = document.createElement("option");
        o1.value = i.id_ambientes;
        o1.textContent = i.nome;

        const o2 = o1.cloneNode(true);

        add.appendChild(o1);
        edit.appendChild(o2);
    });
}

async function carregarInstrutores() {
    const res = await fetch(API_INSTRUTORES);
    const data = await res.json();

    const add = document.getElementById("instrutorAdd");
    const edit = document.getElementById("instrutorEdit");

    add.innerHTML = "";
    edit.innerHTML = "";

    data.forEach(i => {

        instrutoresMap[i.id_instrutor] = i.nome;

        const o1 = document.createElement("option");
        o1.value = i.id_instrutor;
        o1.textContent = i.nome;

        const o2 = o1.cloneNode(true);

        add.appendChild(o1);
        edit.appendChild(o2);
    });
}

async function carregarTurmas() {
    const res = await fetch(API_TURMAS);
    const data = await res.json();

    const add = document.getElementById("turmaAdd");
    const edit = document.getElementById("turmaEdit");

    add.innerHTML = "";
    edit.innerHTML = "";

    data.forEach(i => {

        turmasMap[i.id_turmas] = i.nome_turma;

        const o1 = document.createElement("option");
        o1.value = i.id_turmas;
        o1.textContent = i.nome_turma;

        const o2 = o1.cloneNode(true);

        add.appendChild(o1);
        edit.appendChild(o2);
    });
}

async function listarRegistros() {

    const res = await fetch(API_URL);
    const registros = await res.json();

    const tabela = document.getElementById("tabelaRegistros");
    tabela.innerHTML = "";

    registros.forEach(r => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.id_registro}</td>
            <td>${ambientesMap[r.id_ambiente] || r.id_ambiente}</td>
            <td>${instrutoresMap[r.id_instrutor] || r.id_instrutor}</td>
            <td>${turmasMap[r.id_turma] || r.id_turma}</td>
            <td>${formatarData(r.data_inicio)}</td>
            <td>${formatarData(r.data_fim)}</td>
            <td></td>
        `;

        const tdAcoes = tr.querySelector("td:last-child");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => abrirEditar(
            r.id_registro,
            r.id_ambiente,
            r.id_instrutor,
            r.id_turma,
            r.data_inicio,
            r.data_fim
        );

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirRegistro(r.id_registro);

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnExcluir);

        tabela.appendChild(tr);
    });
}

async function adicionarRegistro() {

    const id_ambiente = document.getElementById("ambienteAdd").value;
    const id_instrutor = document.getElementById("instrutorAdd").value;
    const id_turma = document.getElementById("turmaAdd").value;
    const data_inicio = document.getElementById("dataInicioAdd").value;
    const data_fim = document.getElementById("dataFimAdd").value;

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({
            id_ambiente,
            id_instrutor,
            id_turma,
            data_inicio,
            data_fim
        })
    });

    fecharModal("modalAdicionar");
    listarRegistros();
}

async function abrirEditar(id, ambiente, instrutor, turma, dataInicio, dataFim) {

    await carregarAmbientes();
    await carregarInstrutores();
    await carregarTurmas();

    document.getElementById("idEdit").value = id;
    document.getElementById("ambienteEdit").value = ambiente;
    document.getElementById("instrutorEdit").value = instrutor;
    document.getElementById("turmaEdit").value = turma;
    document.getElementById("dataInicioEdit").value = dataInicio;
    document.getElementById("dataFimEdit").value = dataFim;

    document.getElementById("modalEditar").style.display = "flex";
}

async function salvarEdicao() {

    const id = document.getElementById("idEdit").value;

    const id_ambiente = document.getElementById("ambienteEdit").value;
    const id_instrutor = document.getElementById("instrutorEdit").value;
    const id_turma = document.getElementById("turmaEdit").value;
    const data_inicio = document.getElementById("dataInicioEdit").value;
    const data_fim = document.getElementById("dataFimEdit").value;

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({
            id_ambiente,
            id_instrutor,
            id_turma,
            data_inicio,
            data_fim
        })
    });

    fecharModal("modalEditar");
    listarRegistros();
}

async function excluirRegistro(id) {

    if (!confirm("Deseja excluir este registro?")) return;

    await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        }
    });

    listarRegistros();
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

function abrirModalAdicionar() {
    carregarAmbientes();
    carregarInstrutores();
    carregarTurmas();
    document.getElementById("modalAdicionar").style.display = "flex";
}

function logout() { 
    localStorage.clear(); 
    window.location.replace("../html/index.html"); 
}

async function init() {
    await carregarAmbientes();
    await carregarInstrutores();
    await carregarTurmas();
    await listarRegistros();
}

init();