const db = require("../lib/db.js");

const getAll = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM productos");
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM productos");
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const search = async (req, res) => {
  const query = req.query.q || "";
  try {
    const [results] = await db.query(
      "SELECT * FROM productos WHERE nombre LIKE ? OR descripcion LIKE ?",
      [`%${query}%`, `%${query}%`]
    );
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const create = async (req, res) => {
  const { nombre, descripcion, precio, stock, imagen } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).send({ msg: "Nombre y precio son obligatorios" });
  }
  try {
    await db.query(
      "INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)",
      [nombre, descripcion, precio, stock || 0, imagen || null]
    );
    res.status(201).send({ msg: "Producto agregado al inventario" });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const update = async (req, res) => {
  const { nombre, descripcion, precio, stock, imagen } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ? WHERE id = ?",
      [nombre, descripcion, precio, stock, imagen || null, id]
    );
    res.status(200).send({ msg: "Producto actualizado con exito" });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    res.status(200).send({ msg: "Producto eliminado con exito" });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

module.exports = {
  getAll,
  getAllAdmin,
  search,
  create,
  update,
  remove
};