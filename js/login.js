async function efetuarLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const response = await fetch('https://front-separado1.vercel.app/autenticacao/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {

            localStorage.setItem('usuario_logado', 'true');
            localStorage.setItem('tipo_usuario', data.user.tipo);

            if (data.user.tipo === 'ADM') {
                window.location.href = '../html/usuarios.html';
            } 
            else if (data.user.tipo === 'Porteiro') {
                window.location.href = '../html/registros.html';
            } 
            else {
                alert("Tipo de usuário inválido!");
            }

        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error("Erro ao conectar com a API:", error);
        alert("Erro ao conectar com o servidor.");
    }
}