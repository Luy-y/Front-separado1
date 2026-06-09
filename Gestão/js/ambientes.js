const API_URL = "http://localhost:3000/ambientes";

async function listarAmbientes() {

    const res = await fetch(API_URL);
    const ambientes = await res.json();

    const tabela = document.getElementById("tabelaAmbientes");
    tabela.innerHTML = "";

    ambientes.forEach(a => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${a.id_ambientes}</td>
            <td>${a.nome}</td>
            <td>${a.descrição}</td>
            <td></td>
        `;

        const tdAcoes = tr.querySelector("td:last-child");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => abrirEditar(
            a.id_ambientes,
            a.nome,
            a.descrição
        );

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirAmbiente(a.id_ambientes);

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnExcluir);

        tabela.appendChild(tr);
    });
}

async function adicionarAmbiente() {

    const nome = document.getElementById("nomeAdd").value;
    const descricao = document.getElementById("descricaoAdd").value;

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({ nome, descricao })
    });

    fecharModal("modalAdicionar");
    listarAmbientes();
}

function abrirModalAdicionar() {
    document.getElementById("modalAdicionar").style.display = "flex";
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

function abrirEditar(id, nome, descricao) {

    document.getElementById("idEdit").value = id;
    document.getElementById("nomeEdit").value = nome;
    document.getElementById("descricaoEdit").value = descricao;

    document.getElementById("modalEditar").style.display = "flex";
}

async function salvarEdicao() {

    const id = document.getElementById("idEdit").value;

    const nome = document.getElementById("nomeEdit").value;
    const descricao = document.getElementById("descricaoEdit").value;

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({ nome, descricao })
    });

    fecharModal("modalEditar");
    listarAmbientes();
}

async function excluirAmbiente(id) {

    if (!confirm("Deseja excluir este ambiente?")) return;

    await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        }
    });

    listarAmbientes();
}

function logout() { 
    sessionStorage.clear(); 
    window.location.replace("../html/index.html"); 
}

listarAmbientes();