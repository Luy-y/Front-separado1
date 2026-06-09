const API_URL = "https://testando-production-8a14.up.railway.app/usuarios";

async function listarUsuarios() {

    const res = await fetch(API_URL);
    const usuarios = await res.json();

    const tabela = document.getElementById("tabelaUsuarios");
    tabela.innerHTML = "";

    usuarios.forEach(user => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.nome}</td>
            <td>${user.email}</td>
            <td>${user.telefone}</td>
            <td>${user.tipo}</td>
            <td></td>
        `;

        const tdAcoes = tr.querySelector("td:last-child");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => abrirEditar(
            user.id,
            user.nome,
            user.email,
            user.telefone,
            user.tipo
        );

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirUsuario(user.id);

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnExcluir);

        tabela.appendChild(tr);
    });
}

async function adicionarUsuario() {

    const nome = document.getElementById("nomeAdd").value;
    const email = document.getElementById("emailAdd").value;
    const telefone = document.getElementById("telefoneAdd").value;
    const tipo = document.getElementById("tipoAdd").value;
    const senha = document.getElementById("senhaAdd").value;

    if (senha.length !== 6) {
        alert("A senha deve ter exatamente 6 caracteres!");
        return;
    }

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify({ nome, email, telefone, tipo, senha })
    });

    if (!res.ok) {
        return; // remove alert de erro
    }

    fecharModal("modalAdicionar");
    listarUsuarios();
}

function abrirModalAdicionar() {

    document.getElementById("nomeAdd").value = "";
    document.getElementById("emailAdd").value = "";
    document.getElementById("telefoneAdd").value = "";
    document.getElementById("tipoAdd").value = "ADM";
    document.getElementById("senhaAdd").value = "";

    document.getElementById("modalAdicionar").style.display = "flex";
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

function abrirEditar(id, nome, email, telefone, tipo) {

    document.getElementById("idEdit").value = id;
    document.getElementById("nomeEdit").value = nome;
    document.getElementById("emailEdit").value = email;
    document.getElementById("telefoneEdit").value = telefone;
    document.getElementById("tipoEdit").value = tipo;

    document.getElementById("senhaEdit").value = "";

    document.getElementById("modalEditar").style.display = "flex";
}

async function salvarEdicao() {

    const id = document.getElementById("idEdit").value;

    const nome = document.getElementById("nomeEdit").value;
    const email = document.getElementById("emailEdit").value;
    const telefone = document.getElementById("telefoneEdit").value;
    const tipo = document.getElementById("tipoEdit").value;
    const senha = document.getElementById("senhaEdit").value;

    const dados = { nome, email, telefone, tipo };

    if (senha && senha.trim() !== "") {
        dados.senha = senha;
    }

    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        },
        body: JSON.stringify(dados)
    });

    if (!res.ok) {
        return; // remove alert de erro
    }

    fecharModal("modalEditar");
    listarUsuarios();
}

async function excluirUsuario(id) {

    if (!confirm("Deseja excluir este usuário?")) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "tipo_usuario": localStorage.getItem("tipo_usuario")
        }
    });

    if (!res.ok) {
        return; // remove alert de erro
    }

    listarUsuarios();
}

function logout() { 
    sessionStorage.clear(); 
    window.location.replace("../html/index.html"); 
}

listarUsuarios();