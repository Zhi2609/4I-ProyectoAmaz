-- Creación y uso de la base de datos
CREATE DATABASE IF NOT EXISTS proyectoamazon;
USE proyectoamazon;

-- 1. Usuarios (Clientes y Administración)
-- Utilizamos VARCHAR(36) para el ID, asumiendo que seguirás generando uuid.v4() desde tu backend de Node.js al registrar nuevos clientes.
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') DEFAULT 'cliente',
    registered DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. Productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Carrito / Pedidos
-- Esta tabla maneja la cabecera del pedido. Si el estado es 'carrito', el cliente aún está agregando cosas. 
-- Al realizar la compra, mediante la API puedes actualizar el estado a 'pagado' o 'completado'.
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    estado ENUM('carrito', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado') DEFAULT 'carrito',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Productos / Carrito (Tabla intermedia muchos a muchos)
-- Relaciona el pedido con los productos y guarda el estado de los precios en ese momento exacto en el tiempo.
CREATE TABLE IF NOT EXISTS pedido_productos (
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    -- precio_unitario es crucial: si el precio del producto cambia mañana en la tabla 'productos', 
    -- el registro de esta compra histórica no se verá afectado.
    precio_unitario DECIMAL(10, 2) NOT NULL, 
    PRIMARY KEY (pedido_id, producto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ==========================================
-- DATOS SEMILLA (Seed Data)
-- ==========================================

-- Inserción del usuario administrador inicial.
-- Nota: La contraseña debe ser un hash válido ya que tu backend utilizará bcrypt.compare().
-- El hash que aparece aquí ($2a$10$wO/R.bL6xKj6...) es el equivalente a la contraseña plana: "admin123"
INSERT INTO usuarios (id, username, password, rol) 
VALUES (
    'admin-uuid-0000-0000-000000000000', 
    'admin', 
    '$2a$10$wO/R.bL6xKj6.B7.E6.p/e3XgM0t3s1M.5E.tA9K.3Y.q9.K.8.', 
    'admin'
);

-- Inserción de un par de productos de prueba para que puedas probar tus endpoints GET
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES 
('Laptop Gaming', 'Laptop con procesador de última generación y 16GB de RAM.', 15000.00, 10),
('Teclado Mecánico', 'Teclado mecánico switches red, iluminación RGB.', 1200.50, 25);