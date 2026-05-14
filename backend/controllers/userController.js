const db = require("../lib/db.js");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [existing] = await db.query(
      "SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)",
      [username]
    );
    if (existing.length) {
      return res.status(409).send({ msg: "Este nombre de usuario ya esta en uso" });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, 'cliente')",
      [uuidv4(), username, hash]
    );
    res.status(201).send({ msg: "Usuario registrado con exito" });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [results] = await db.query("SELECT * FROM usuarios WHERE username = ?", [username]);
    if (!results.length) {
      return res.status(401).send({ msg: "Credenciales invalidas" });
    }
    const match = await bcrypt.compare(password, results[0].password);
    if (!match) {
      return res.status(401).send({ msg: "Credenciales invalidas" });
    }
    const token = jwt.sign(
      { username: results[0].username, userId: results[0].id, rol: results[0].rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).send({
      token,
      user: { id: results[0].id, username: results[0].username, rol: results[0].rol }
    });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, username, registered FROM usuarios WHERE rol = "cliente"');
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

module.exports = { register, login, getAll };