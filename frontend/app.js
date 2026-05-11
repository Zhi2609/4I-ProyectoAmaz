const API_URL = "http://localhost:3000/api";

const formTitle = document.getElementById("form-title");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toggleLink = document.getElementById("toggle-link");
const toggleText = document.getElementById("toggle-text");

let isLoginView = true;

toggleLink.addEventListener("click", (e) => {
  e.preventDefault(); 

  isLoginView = !isLoginView; 

  if (isLoginView) {
    formTitle.textContent = "Iniciar Sesión";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    toggleText.innerHTML =
      '¿No tienes cuenta? <a href="#" id="toggle-link">Regístrate aquí</a>';
  } else {
    formTitle.textContent = "Crear Nueva Cuenta";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    toggleText.innerHTML =
      '¿Ya tienes cuenta? <a href="#" id="toggle-link">Inicia sesión aquí</a>';
  }

  document
    .getElementById("toggle-link")
    .addEventListener("click", arguments.callee);
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;
  const passwordConfirm = document.getElementById("reg-password-confirm").value;

  if (password !== passwordConfirm) {
    alert("Las contraseñas no coinciden. Por favor, verifica.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
      registerForm.reset();
      document.getElementById("toggle-link").click();
    } else {
      alert(`Error: ${data.msg}`);
    }
  } catch (error) {
    console.error("Error en la petición:", error);
    alert(
      "Error al conectar con el servidor. Verifica que tu backend esté corriendo.",
    );
  }
});
