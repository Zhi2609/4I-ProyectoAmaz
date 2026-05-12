const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/users.js");

// Importación de Controladores
const productController = require("../controllers/productController.js");
const userController = require("../controllers/userController.js");
const orderController = require("../controllers/orderController.js");

// --- RUTAS DE AUTENTICACIÓN ---
router.post("/sign-up", userController.signUp);
router.post("/login", userController.login);

// --- RUTAS DE PRODUCTOS (Públicas) ---
router.get("/productos", productController.listarProductos); 
router.get("/productos/buscar", productController.buscarProductos);

// --- RUTAS DE PEDIDOS (Clientes) ---
router.get("/pedidos", userMiddleware.isLoggedIn, orderController.obtenerPedidos);
router.post("/pedidos", userMiddleware.isLoggedIn, orderController.crearPedido);

// --- RUTAS ADMINISTRATIVAS ---
router.get("/clientes", userMiddleware.isLoggedIn, userMiddleware.isAdmin, userController.obtenerClientes);
router.post("/productos", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.crearProducto);
router.put("/productos/:id", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.actualizarProducto);
router.delete("/productos/:id", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.eliminarProducto);

module.exports = router;