const express = require("express");
const router = express.Router();
const userMiddleware = require("../middleware/users.js");

const productController = require("../controllers/productController.js");
const userController = require("../controllers/userController.js");
const orderController = require("../controllers/orderController.js");

router.post("/auth/registro", userMiddleware.validateRegister, userController.register);
router.post("/auth/login", userController.login);

router.get("/productos", productController.getAll);
router.get("/productos/buscar", productController.search);

router.get("/pedidos", userMiddleware.isLoggedIn, orderController.getUserOrders);
router.post("/pedidos", userMiddleware.isLoggedIn, orderController.create);

router.get("/admin/usuarios", userMiddleware.isLoggedIn, userMiddleware.isAdmin, userController.getAll);
router.get("/admin/productos", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.getAllAdmin);
router.post("/admin/productos", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.create);
router.put("/admin/productos/:id", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.update);
router.delete("/admin/productos/:id", userMiddleware.isLoggedIn, userMiddleware.isAdmin, productController.remove);

module.exports = router;