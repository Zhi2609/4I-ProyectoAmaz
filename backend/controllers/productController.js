const db = require("../lib/db.js");

const crearProducto = (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  db.query(
    "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)",
    [nombre, descripcion, precio, stock],
    (err) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ msg: "Producto agregado al inventario" });
    },
  );
};

const actualizarProducto = (req, res) => {
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
};

const eliminarProducto = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ msg: "Producto eliminado con éxito" });
  });
};

const listarProductos = (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(results);
  });
};

const buscarProductos = (req, res) => {
  const query = req.query.q || "";
  db.query(
    "SELECT * FROM productos WHERE nombre LIKE ? OR descripcion LIKE ?",
    [`%${query}%`, `%${query}%`],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.status(200).send(results);
    }
  );
};

module.exports = {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  listarProductos,
  buscarProductos
};
