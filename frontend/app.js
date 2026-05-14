const API_URL = "http://localhost:3000/api";
let currentUser = null;
let cart = [];
let adminProducts = [];

function showView(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  document.querySelectorAll(".tab-content").forEach((t) => t.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));

  const token = localStorage.getItem("token");
  document.getElementById("nav-logout").classList.toggle("hidden", !token);
  document.getElementById("nav-cart").classList.toggle("hidden", !token);
  document.getElementById("nav-orders").classList.toggle("hidden", !token);
  const isAdmin = currentUser && currentUser.rol === "admin";
  document.getElementById("nav-admin").classList.toggle("hidden", !isAdmin);
}

function formatPrice(price) {
  return "$" + Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toggleLink = document.getElementById("toggle-link");
const toggleText = document.getElementById("toggle-text");

let isLoginView = true;

function toggleForms(e) {
  e.preventDefault();
  isLoginView = !isLoginView;
  document.getElementById("form-title").textContent = isLoginView ? "Iniciar Sesion" : "Crear Nueva Cuenta";
  loginForm.classList.toggle("hidden", !isLoginView);
  registerForm.classList.toggle("hidden", isLoginView);
  toggleText.innerHTML = isLoginView
    ? 'No tienes cuenta? <a href="#" id="toggle-link">Registrate aqui</a>'
    : 'Ya tienes cuenta? <a href="#" id="toggle-link">Inicia sesion aqui</a>';
  document.getElementById("toggle-link").addEventListener("click", toggleForms);
}

toggleLink.addEventListener("click", toggleForms);

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-password-confirm").value;
  if (password !== confirm) return alert("Las contrasenas no coinciden");
  if (username.length < 3) return alert("El usuario debe tener al menos 3 caracteres");
  if (password.length < 6) return alert("La contrasena debe tener al menos 6 caracteres");
  try {
    const res = await fetch(`${API_URL}/auth/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, password_repeat: confirm }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Cuenta creada con exito. Ahora puedes iniciar sesion.");
      registerForm.reset();
      document.getElementById("toggle-link").click();
    } else {
      alert("Error: " + data.msg);
    }
  } catch (err) {
    alert("Error al conectar con el servidor.");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      showView("catalog-view");
      loadProducts();
    } else {
      alert(data.msg);
    }
  } catch (err) {
    alert("Error al conectar con el servidor");
  }
});

async function loadProducts(query = "") {
  const endpoint = query ? `/productos/buscar?q=${encodeURIComponent(query)}` : "/productos";
  const grid = document.getElementById("products-grid");
  const loading = document.getElementById("loading-state");
  const empty = document.getElementById("empty-state");
  grid.innerHTML = "";
  loading.classList.remove("hidden");
  empty.classList.add("hidden");
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    const products = await res.json();
    loading.classList.add("hidden");
    if (!products.length) { empty.classList.remove("hidden"); return; }
    products.forEach((p) => {
      const stockClass = p.stock > 0 ? "in-stock" : "out-of-stock";
      const stockText = p.stock > 0 ? `En stock (${p.stock})` : "Agotado";
      const imgHtml = p.imagen
        ? `<img src="${p.imagen}" alt="${p.nombre}" class="product-img" onerror="this.style.display='none'" />`
        : `<div class="product-img-placeholder">Sin imagen</div>`;
      grid.innerHTML += `
        <div class="product-card">
          ${imgHtml}
          <h3>${p.nombre}</h3>
          <p class="desc">${p.descripcion || "Sin descripcion"}</p>
          <p class="price">${formatPrice(p.precio)}</p>
          <p class="stock ${stockClass}">${stockText}</p>
          <button class="btn-secondary" ${p.stock <= 0 ? "disabled" : ""} onclick="addToCart(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio})">
            ${p.stock > 0 ? "Anadir al Carrito" : "No disponible"}
          </button>
        </div>`;
    });
  } catch (err) {
    loading.textContent = "Error al cargar productos.";
    loading.classList.remove("hidden");
  }
}

document.getElementById("search-btn").addEventListener("click", () => {
  loadProducts(document.getElementById("search-input").value);
});
document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadProducts(e.target.value);
});

function addToCart(id, nombre, precio) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.cantidad++;
  else cart.push({ id, nombre, precio_unitario: precio, cantidad: 1 });
  updateCartBadge();
  alert(`${nombre} anadido al carrito`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  updateCartBadge();
}

function updateCartQty(index, delta) {
  const newQty = cart[index].cantidad + delta;
  if (newQty < 1) return;
  cart[index].cantidad = newQty;
  renderCart();
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById("cart-count").textContent = `(${total})`;
}

function renderCart() {
  const container = document.getElementById("cart-container");
  const footer = document.getElementById("cart-footer");
  const totalSpan = document.getElementById("cart-total-amount");
  if (!cart.length) {
    container.innerHTML = '<p class="empty-cart">Tu carrito esta vacio.</p>';
    footer.classList.add("hidden");
    return;
  }
  footer.classList.remove("hidden");
  let html = "";
  let total = 0;
  cart.forEach((item, index) => {
    const subtotal = item.precio_unitario * item.cantidad;
    total += subtotal;
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.nombre}</h4>
          <p class="cart-item-price">${formatPrice(item.precio_unitario)} c/u</p>
        </div>
        <div class="cart-item-controls">
          <button onclick="updateCartQty(${index}, -1)" ${item.cantidad <= 1 ? "disabled" : ""}>-</button>
          <span>${item.cantidad}</span>
          <button onclick="updateCartQty(${index}, 1)">+</button>
          <span class="cart-item-subtotal">${formatPrice(subtotal)}</span>
          <button class="btn-remove" onclick="removeFromCart(${index})" title="Eliminar">X</button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
  totalSpan.textContent = formatPrice(total);
}

document.getElementById("nav-cart").addEventListener("click", () => {
  renderCart();
  showView("cart-view");
});

document.getElementById("logo").addEventListener("click", () => {
  if (localStorage.getItem("token")) showView("catalog-view");
});

async function placeOrder() {
  if (!cart.length) return alert("El carrito esta vacio");
  try {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: cart }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Compra realizada con exito");
      cart = [];
      updateCartBadge();
      showView("orders-view");
      loadOrders();
    } else {
      alert("Error: " + (data.msg || "No se pudo procesar la compra"));
    }
  } catch (err) {
    alert("Error al procesar la compra");
  }
}

async function loadOrders() {
  const container = document.getElementById("orders-container");
  container.innerHTML = "<p style='text-align:center;padding:20px;'>Cargando pedidos...</p>";
  try {
    const res = await fetch(`${API_URL}/pedidos`, { headers: getAuthHeaders() });
    const orders = await res.json();
    if (!orders.length) { container.innerHTML = '<p class="empty-cart">No tienes pedidos aun.</p>'; return; }
    const grouped = {};
    orders.forEach((o) => {
      if (!grouped[o.pedido_id]) grouped[o.pedido_id] = { id: o.pedido_id, fecha: o.fecha_creacion, items: [] };
      grouped[o.pedido_id].items.push(o);
    });
    container.innerHTML = "";
    Object.values(grouped).forEach((pedido) => {
      const itemsHtml = pedido.items.map((i) =>
        `<div class="order-item">${i.producto_nombre} x ${i.cantidad} — ${formatPrice(i.precio_unitario * i.cantidad)}</div>`
      ).join("");
      container.innerHTML += `
        <div class="order-card">
          <p><strong>Pedido #${pedido.id}</strong> <span class="order-date">${new Date(pedido.fecha).toLocaleDateString()}</span></p>
          ${itemsHtml}
        </div>`;
    });
  } catch (err) {
    container.innerHTML = '<p class="empty-cart">Error al cargar pedidos.</p>';
  }
}

document.getElementById("nav-orders").addEventListener("click", () => {
  showView("orders-view");
  loadOrders();
});

document.getElementById("nav-logout").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

document.getElementById("nav-admin").addEventListener("click", () => {
  showView("admin-view");
  loadAdminProducts();
  loadAdminClients();
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("hidden"));
    btn.classList.add("active");
    const tabId = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
    document.getElementById(tabId).classList.remove("hidden");
  });
});

document.getElementById("btn-new-product").addEventListener("click", () => {
  document.getElementById("product-id").value = "";
  document.getElementById("product-form").reset();
  document.getElementById("form-product-title").textContent = "Agregar Producto";
  document.getElementById("product-form-container").classList.remove("hidden");
});

function hideProductForm() {
  document.getElementById("product-form-container").classList.add("hidden");
  document.getElementById("product-form").reset();
}

async function loadAdminProducts() {
  const grid = document.getElementById("admin-products-grid");
  grid.innerHTML = "<p style='text-align:center;padding:20px;'>Cargando...</p>";
  try {
    const res = await fetch(`${API_URL}/admin/productos`, { headers: getAuthHeaders() });
    if (!res.ok) { grid.innerHTML = "<p>Error al cargar productos.</p>"; return; }
    adminProducts = await res.json();
    if (!adminProducts.length) { grid.innerHTML = "<p>No hay productos.</p>"; return; }
    grid.innerHTML = "";
    adminProducts.forEach((p) => {
      const imgHtml = p.imagen
        ? `<img src="${p.imagen}" alt="${p.nombre}" class="product-img" onerror="this.style.display='none'" />`
        : `<div class="product-img-placeholder">Sin imagen</div>`;
      grid.innerHTML += `
        <div class="product-card admin-card">
          ${imgHtml}
          <h3>${p.nombre}</h3>
          <p class="desc">${p.descripcion || "-"}</p>
          <p class="price">${formatPrice(p.precio)}</p>
          <p class="stock">Stock: ${p.stock}</p>
          <div class="admin-card-actions">
            <button class="btn-secondary" onclick="editProduct(${p.id})">Editar</button>
            <button class="btn-remove" onclick="deleteProduct(${p.id})">Eliminar</button>
          </div>
        </div>`;
    });
  } catch (err) {
    grid.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

function editProduct(id) {
  const p = adminProducts.find((pr) => pr.id === id);
  if (!p) return;
  document.getElementById("product-id").value = p.id;
  document.getElementById("prod-nombre").value = p.nombre;
  document.getElementById("prod-desc").value = p.descripcion || "";
  document.getElementById("prod-precio").value = p.precio;
  document.getElementById("prod-stock").value = p.stock;
  document.getElementById("prod-imagen").value = p.imagen || "";
  document.getElementById("form-product-title").textContent = "Editar Producto";
  document.getElementById("product-form-container").classList.remove("hidden");
}

async function deleteProduct(id) {
  if (!confirm("Eliminar este producto?")) return;
  try {
    const res = await fetch(`${API_URL}/admin/productos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) loadAdminProducts();
    else {
      const data = await res.json();
      alert("Error: " + data.msg);
    }
  } catch (err) {
    alert("Error al eliminar producto");
  }
}

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("product-id").value;
  const body = {
    nombre: document.getElementById("prod-nombre").value,
    descripcion: document.getElementById("prod-desc").value,
    precio: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value) || 0,
    imagen: document.getElementById("prod-imagen").value,
  };
  const url = id ? `${API_URL}/admin/productos/${id}` : `${API_URL}/admin/productos`;
  const method = id ? "PUT" : "POST";
  try {
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      hideProductForm();
      loadAdminProducts();
      alert(id ? "Producto actualizado" : "Producto creado");
    } else {
      alert("Error: " + data.msg);
    }
  } catch (err) {
    alert("Error al guardar producto");
  }
});

async function loadAdminClients() {
  const container = document.getElementById("clients-table-container");
  container.innerHTML = "<p style='text-align:center;padding:20px;'>Cargando...</p>";
  try {
    const res = await fetch(`${API_URL}/admin/usuarios`, { headers: getAuthHeaders() });
    const clients = await res.json();
    if (!clients.length) { container.innerHTML = "<p>No hay clientes registrados.</p>"; return; }
    container.innerHTML = `
      <div class="table-container">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Usuario</th><th>Fecha de Registro</th></tr></thead>
          <tbody>${clients.map((c) =>
            `<tr><td>${c.id}</td><td>${c.username}</td><td>${new Date(c.registered).toLocaleDateString()}</td></tr>`
          ).join("")}</tbody>
        </table>
      </div>`;
  } catch (err) {
    container.innerHTML = "<p>Error al cargar clientes.</p>";
  }
}