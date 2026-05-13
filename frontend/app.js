const API_URL = "http://localhost:3000/api";
let currentUser = null;
let cart = [];

// ==========================================
// MANEJO DE VISTAS (Navegación SPA)
// ==========================================
function showView(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");

  // Mostrar/Ocultar botones de navegación según la sesión
  const token = localStorage.getItem("token");
  document.getElementById("nav-logout").classList.toggle("hidden", !token);
  document.getElementById("nav-cart").classList.toggle("hidden", !token);
}

// ==========================================
// REGISTRO DE USUARIOS
// ==========================================

const formTitle = document.getElementById('form-title');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');

let isLoginView = true;

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginView = !isLoginView;

    if (isLoginView) {
        formTitle.textContent = 'Iniciar Sesión';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-link">Regístrate aquí</a>';
    } else {
        formTitle.textContent = 'Crear Nueva Cuenta';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-link">Inicia sesión aquí</a>';
    }

    document.getElementById('toggle-link').addEventListener('click', arguments.callee);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch('http://localhost:3000/api/sign-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
            registerForm.reset();
            document.getElementById('toggle-link').click(); 
        } else {
            alert(`Error: ${data.msg}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor.');
    }
});

// ==========================================
// AUTENTICACIÓN (LOGIN)
// ==========================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;

      showView("catalog-view");
      loadProducts(); // Cargar productos al entrar
    } else {
      alert(data.msg);
    }
  } catch (error) {
    alert("Error al conectar con el servidor");
  }
});

// ==========================================
// CATÁLOGO DE PRODUCTOS
// ==========================================
async function loadProducts(query = "") {
  const endpoint = query ? `/productos/buscar?q=${query}` : "/productos";
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const products = await response.json();

    const grid = document.getElementById("products-grid");
    grid.innerHTML = ""; // Limpiar catálogo

    products.forEach((p) => {
      grid.innerHTML += `
                <div class="product-card">
                    <h3>${p.nombre}</h3>
                    <p class="desc">${p.descripcion}</p>
                    <p class="price">$${p.precio}</p>
                    <button class="btn-secondary" onclick="addToCart(${p.id}, '${p.nombre}', ${p.precio})">
                        Añadir al Carrito
                    </button>
                </div>
            `;
    });
  } catch (error) {
    console.error("Error cargando productos", error);
  }
}

// Buscador
document.getElementById("search-btn").addEventListener("click", () => {
  const query = document.getElementById("search-input").value;
  loadProducts(query);
});

// ==========================================
// CARRITO Y COMPRAS
// ==========================================
function addToCart(id, nombre, precio) {
  cart.push({ id, nombre, precio_unitario: precio, cantidad: 1 });
  document.getElementById("cart-count").textContent = `(${cart.length})`;
  alert(`${nombre} añadido al carrito`);
}

async function placeOrder() {
  if (cart.length === 0) return alert("El carrito está vacío");

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: cart }),
    });

    if (response.ok) {
      alert("¡Compra realizada!");
      cart = []; // Vaciar carrito
      document.getElementById("cart-count").textContent = "(0)";
      loadOrders(); // Ir a ver los pedidos
    }
  } catch (error) {
    alert("Error al procesar la compra");
  }
}

// ==========================================
// HISTORIAL DE PEDIDOS
// ==========================================
async function loadOrders() {
  const token = localStorage.getItem("token");
  showView("orders-view");

  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await response.json();

    const container = document.getElementById("orders-container");
    container.innerHTML = orders.length ? "" : "<p>No tienes pedidos aún.</p>";

    orders.forEach((o) => {
      container.innerHTML += `
                <div class="card" style="margin-bottom: 10px;">
                    <p><strong>Pedido #${o.pedido_id}</strong> - ${new Date(o.fecha_creacion).toLocaleDateString()}</p>
                    <p>Producto: ${o.producto_nombre} | Cantidad: ${o.cantidad} | Total: $${o.precio_unitario * o.cantidad}</p>
                    <hr>
                </div>
            `;
    });
  } catch (error) {
    console.error("Error cargando pedidos", error);
  }
}

document.getElementById("nav-logout").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});
