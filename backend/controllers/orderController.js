const db = require("../lib/db.js");

const getUserOrders = async (req, res) => {
  const userId = req.userData.userId;
  try {
    const [results] = await db.query(
      `SELECT p.id as pedido_id, p.estado, p.fecha_creacion,
              pp.cantidad, pp.precio_unitario, pr.nombre as producto_nombre
       FROM pedidos p
       JOIN pedido_productos pp ON p.id = pp.pedido_id
       JOIN productos pr ON pp.producto_id = pr.id
       WHERE p.usuario_id = ? AND p.estado != 'carrito'
       ORDER BY p.fecha_creacion DESC`,
      [userId]
    );
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const create = async (req, res) => {
  const userId = req.userData.userId;
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).send({ msg: "El carrito esta vacio" });
  }
  try {
    for (const item of items) {
      const [stockRows] = await db.query("SELECT stock FROM productos WHERE id = ?", [item.id]);
      if (!stockRows.length || stockRows[0].stock < item.cantidad) {
        return res.status(400).send({ msg: "Stock insuficiente para " + (item.nombre || "un producto") });
      }
    }
    const [orderResult] = await db.query(
      'INSERT INTO pedidos (usuario_id, estado) VALUES (?, "pagado")',
      [userId]
    );
    const pedidoId = orderResult.insertId;
    const values = items.map((item) => [pedidoId, item.id, item.cantidad, item.precio_unitario]);
    await db.query(
      "INSERT INTO pedido_productos (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?",
      [values]
    );
    for (const item of items) {
      await db.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [item.cantidad, item.id]);
    }
    res.status(201).send({ msg: "Compra realizada con exito", pedidoId });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

module.exports = { getUserOrders, create };