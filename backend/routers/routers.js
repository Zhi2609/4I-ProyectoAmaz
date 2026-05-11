const express = require("express");
const router = express.Router();
const db = require("../lib/db.js");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const userMiddleware = require("../middleware/user.js");

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

router.post("/sign-up", (req, res) => {
  const { username, password } = req.body;
  db.query(
    `SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)`,
    [username],
    (err, result) => {
      if (result && result.length) {
        return res
          .status(409)
          .send({ msg: "Este nombre de usuario ya está en uso" });
      } else {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({ msg: err });
          } else {
            db.query(
              `INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, 'cliente')`,
              [uuidv4(), username, hash],
              (err, result) => {
                if (err) {
                  return res.status(400).send({ msg: err });
                }
                return res
                  .status(201)
                  .send({ msg: "Usuario registrado con éxito" });
              },
            );
          }
        });
      }
    },
  );
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    `SELECT * FROM usuarios WHERE username = ?`,
    [username],
    (err, result) => {
      if (err) return res.status(400).send({ msg: err });
      if (!result.length)
        return res.status(401).send({ msg: "Credenciales inválidas" });

      bcrypt.compare(password, result[0].password, (bErr, bResult) => {
        if (bResult) {
          const token = jwt.sign(
            {
              username: result[0].username,
              userId: result[0].id,
              rol: result[0].rol,
            },
            "SECRETKEY",
            { expiresIn: "7d" },
          );
          return res.status(200).send({
            msg: "Logueado con éxito",
            token,
            user: {
              id: result[0].id,
              username: result[0].username,
              rol: result[0].rol,
            },
          });
        }
        return res.status(401).send({ msg: "Credenciales inválidas" });
      });
    },
  );
});

// ==========================================
// RUTAS DE PRODUCTOS (Públicas / Clientes)
// ==========================================

router.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(results);
  });
});

router.get("/productos/buscar", (req, res) => {
  const query = req.query.q || "";
  db.query(
    "SELECT * FROM productos WHERE nombre LIKE ? OR descripcion LIKE ?",
    [`%${query}%`, `%${query}%`],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.status(200).send(results);
    },
  );
});

// ==========================================
// RUTAS DE PEDIDOS (Clientes - Protegidas)
// ==========================================

router.get("/pedidos", userMiddleware.isLoggedIn, (req, res) => {
  const userId = req.userData.userId;
  const sql = `
        SELECT p.id as pedido_id, p.estado, p.fecha_creacion, 
               pp.cantidad, pp.precio_unitario, pr.nombre as producto_nombre
        FROM pedidos p
        JOIN pedido_productos pp ON p.id = pp.pedido_id
        JOIN productos pr ON pp.producto_id = pr.id
        WHERE p.usuario_id = ?
        ORDER BY p.fecha_creacion DESC
    `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(results);
  });
});

router.post("/pedidos", userMiddleware.isLoggedIn, (req, res) => {
  const userId = req.userData.userId;
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).send({ msg: "El carrito está vacío" });
  }

  db.query(
    'INSERT INTO pedidos (usuario_id, estado) VALUES (?, "pagado")',
    [userId],
    (err, result) => {
      if (err) return res.status(500).send(err);

      const pedidoId = result.insertId;
      const values = items.map((item) => [
        pedidoId,
        item.id,
        item.cantidad,
        item.precio_unitario,
      ]);

      db.query(
        "INSERT INTO pedido_productos (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?",
        [values],
        (err) => {
          if (err) return res.status(500).send(err);
          res.status(201).send({ msg: "Compra realizada con éxito", pedidoId });
        },
      );
    },
  );
});

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

router.get(
  "/clientes",
  userMiddleware.isLoggedIn,
  userMiddleware.isAdmin,
  (req, res) => {
    db.query(
      'SELECT id, username, registered FROM usuarios WHERE rol = "cliente"',
      (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
      },
    );
  },
);

router.post(
  "/productos",
  userMiddleware.isLoggedIn,
  userMiddleware.isAdmin,
  (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    db.query(
      "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)",
      [nombre, descripcion, precio, stock],
      (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ msg: "Producto agregado al inventario" });
      },
    );
  },
);

router.put(
  "/productos/:id",
  userMiddleware.isLoggedIn,
  userMiddleware.isAdmin,
  (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    const { id } = req.params;
    db.query(
      "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?",
      [nombre, descripcion, precio, stock, id],
      (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ msg: "Producto actualizado con éxito" });
      },
    );
  },
);

router.delete(
  "/productos/:id",
  userMiddleware.isLoggedIn,
  userMiddleware.isAdmin,
  (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ msg: "Producto eliminado con éxito" });
    });
  },
);

module.exports = router;
