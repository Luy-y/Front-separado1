const API_URL = "https://testando-production-8a14.up.railway.app/turmas";

async function listarTurmas() {
    const res = await fetch(API_URL);
    const turmas = await res.json();

    const tabela = document.getElementById("tabelaTurmas");
    tabela.innerHTML = "";

    turmas.forEach(t => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${t.id_turmas}</td>
            <td>${t.nome_turma}</td>
            <td></td>
        `;

        const td = tr.querySelector("td:last-child");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () =>
            abrirEditar(t.id_turmas, t.nome_turma);

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirTurma(t.id_turmas);

        td.appendChild(btnEditar);
        td.appendChild(btnExcluir);

        tabela.appendChild(tr);
    });
}

async function adicionarTurma() {

    const nome_turma = document.getElementById("nomeAdd").value;

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({ nome_turma })
    });

    fecharModal("modalAdicionar");
    listarTurmas();
}

function abrirModalAdicionar() {
    document.getElementById("modalAdicionar").style.display = "flex";
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

async function abrirEditar(id, nome) {

    document.getElementById("idEdit").value = id;
    document.getElementById("nomeEdit").value = nome;

    document.getElementById("modalEditar").style.display = "flex";
}

async function salvarEdicao() {

    const id = document.getElementById("idEdit").value;
    const nome_turma = document.getElementById("nomeEdit").value;

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({ nome_turma })
    });

    fecharModal("modalEditar");
    listarTurmas();
}

async function excluirTurma(id) {
    if (!confirm("Deseja excluir esta turma?")) return;

    await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        }
    });

    listarTurmas();
}

function logout() {
    sessionStorage.clear();
    window.location.replace("../html/index.html");
}

listarTurmas();