document.addEventListener("DOMContentLoaded", () => {

    const tipo = localStorage.getItem("tipo_usuario");

    if (!tipo) {
        window.location.href = "../html/index.html";
        return;
    }

    if (tipo === "Porteiro") {

        const ocultar = [
            "menuUsuarios",
            "menuInstrutores",
            "menuTurmas",
            "menuAmbientes",
            "menuRelatorios",
            "menuOcupacao"
        ];

        ocultar.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }
});