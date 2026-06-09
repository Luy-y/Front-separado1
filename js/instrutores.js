const API_URL = "https://front-separado1.vercel.app/instrutores";

// ================= LISTAR =================
async function listarInstrutores() {

    try {
        const res = await fetch(API_URL);
        const instrutores = await res.json();

        const tabela = document.getElementById("tabelaInstrutores");
        tabela.innerHTML = "";

        instrutores.forEach(i => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${i.id_instrutor}</td>
                <td>${i.nome}</td>
                <td>${i.email || '-'}</td>
                <td>${i.telefone || '-'}</td>
                <td></td>
            `;

            const tdAcoes = tr.querySelector("td:last-child");

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.onclick = () => abrirEditar(
                i.id_instrutor,
                i.nome,
                i.email,
                i.telefone
            );

            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = () => excluirInstrutor(i.id_instrutor);

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);

            tabela.appendChild(tr);
        });

    } catch (erro) {
        alert("Erro ao carregar instrutores");
        console.error(erro);
    }
}

// ================= ADICIONAR =================
async function adicionarInstrutor() {

    const nome = document.getElementById("nomeAdd").value.trim();
    const email = document.getElementById("emailAdd").value.trim();
    const telefone = document.getElementById("telefoneAdd").value.trim();

    if (!nome) {
        alert("Nome é obrigatório");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "tipo_usuario": localStorage.getItem("tipo_usuario")
            },
            body: JSON.stringify({ nome, email, telefone })
        });

        const dados = await res.json();

        if (!res.ok) {
            alert(dados.erro || "Erro ao cadastrar");
            return;
        }

        fecharModal("modalAdicionar");

        // limpar campos
        document.getElementById("nomeAdd").value = "";
        document.getElementById("emailAdd").value = "";
        document.getElementById("telefoneAdd").value = "";

        listarInstrutores();

    } catch (erro) {
        alert("Erro na requisição");
        console.error(erro);
    }
}

// ================= MODAIS =================
function abrirModalAdicionar() {
    document.getElementById("modalAdicionar").style.display = "flex";
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

// ================= EDITAR =================
function abrirEditar(id, nome, email, telefone) {

    document.getElementById("idEdit").value = id;
    document.getElementById("nomeEdit").value = nome;
    document.getElementById("emailEdit").value = email || "";
    document.getElementById("telefoneEdit").value = telefone || "";

    document.getElementById("modalEditar").style.display = "flex";
}

async function salvarEdicao() {

    const id = document.getElementById("idEdit").value;

    const nome = document.getElementById("nomeEdit").value.trim();
    const email = document.getElementById("emailEdit").value.trim();
    const telefone = document.getElementById("telefoneEdit").value.trim();

    if (!nome) {
        alert("Nome é obrigatório");
        return;
    }

    const dados = { nome };

    if (email) dados.email = email;
    if (telefone) dados.telefone = telefone;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "tipo_usuario": localStorage.getItem("tipo_usuario")
            },
            body: JSON.stringify(dados)
        });

        const resposta = await res.json();

        if (!res.ok) {
            alert(resposta.erro || "Erro ao atualizar");
            return;
        }

        fecharModal("modalEditar");
        listarInstrutores();

    } catch (erro) {
        alert("Erro ao atualizar");
        console.error(erro);
    }
}

// ================= EXCLUIR =================
async function excluirInstrutor(id) {

    if (!confirm("Deseja excluir este instrutor?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "tipo_usuario": localStorage.getItem("tipo_usuario")
            }
        });

        const resposta = await res.json();

        if (!res.ok) {
            alert(resposta.erro || "Não foi possível excluir");
            return;
        }

        listarInstrutores();

    } catch (erro) {
        alert("Erro ao excluir");
        console.error(erro);
    }
}

// ================= LOGOUT =================
function logout() {
    sessionStorage.clear();
    window.location.replace("../html/index.html");
}

// ================= INIT =================
listarInstrutores();