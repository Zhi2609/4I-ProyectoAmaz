const db = require("../lib/db.js");

const obtenerPedidos = (req, res) => {
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
};

const crearPedido = (req, res) => {
  const userId = req.userData.userId;
  const { items } = req.body;
  if (!items || items.length === 0)
    return res.status(400).send({ msg: "El carrito está vacío" });

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
};

module.exports = {
    obtenerPedidos,
    crearPedido,
};
