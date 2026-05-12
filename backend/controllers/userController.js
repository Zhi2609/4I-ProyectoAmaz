const db = require("../lib/db.js");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const signUp = (req, res) => {
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
          if (err) return res.status(500).send({ msg: err });
          db.query(
            `INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, 'cliente')`,
            [uuidv4(), username, hash],
            (err) => {
              if (err) return res.status(400).send({ msg: err });
              return res
                .status(201)
                .send({ msg: "Usuario registrado con éxito" });
            },
          );
        });
      }
    },
  );
};

const login = (req, res) => {
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
};

const obtenerClientes = (req, res) => {
  db.query(
    'SELECT id, username, registered FROM usuarios WHERE rol = "cliente"',
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.status(200).send(results);
    },
  );
};

module.exports = {
    signUp,
    login,
    obtenerClientes,
};
