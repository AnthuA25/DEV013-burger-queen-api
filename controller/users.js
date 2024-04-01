const { connect } = require("../connect");
const bcrypt = require("bcrypt");
module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const { _page, _limit } = req.query;
      const db = await connect();
      const collection = db.collection("users");
      const limit = parseInt(_limit) || 10;
      const page = parseInt(_page) || 1;
      const offset = (page - 1) * limit;
      const options = {
        projection: { _id: 1, email: 1, role: 1 },
      };
      const result = await collection
        .find({}, options)
        .skip(offset)
        .limit(limit)
        .toArray();

      if (result.length === 0) {
        return resp
          .status(404)
          .json({ message: "No hay usuarios disponibles" });
      } else {
        return resp.status(200).json(result);
      }
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  getUserById: async (req, resp) => {
    try {
      const { uid } = req.params;
      const db = await connect();
      const collection = db.collection("users");
      const filter = getIdOrEmail(uid);
      if (!validateOwnerOrAdmin(req, uid)) {
        console.log("roles", req.role);
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }
      if (!filter) {
        return resp.status(400).json({ error: "Identificador inválido" });
      }
      const cursor = await collection.findOne(filter);
      if (!cursor) {
        return resp.status(404).json({
          msg: "Usuario no encontrado, por favor intente de nuevo con un usuario válido.",
        });
      }
      return resp.status(200).json(cursor);
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  postUser: async (req, resp) => {
    try {
      const { email, password, role } = req.body;
      const db = await connect();
      const collection = db.collection("users");
      const listRole = ["admin", "waiter", "chef"];
      // Validaciones de campos obligatorios
      if (!email || !password) {
        return resp
          .status(400)
          .json({ msg: "Faltan ingresar un email o password válidos" });
      }
      // Validación de rol válido
      if (!listRole.includes(role)) {
        return resp.status(400).json({ error: "role is not valid" });
      }

      // Validación del formato de correo electrónico
      if (!isValidEmail(email)) {
        return resp
          .status(400)
          .json({ error: "El correo electrónico proporcionado no es válido" });
      }
      // Validación de la longitud mínima de la contraseña
      if (password.length < 4) {
        return resp
          .status(400)
          .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      }

      // Generación de hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("🚀 ~ app.post ~ hashedPassword:", hashedPassword);
       // Verificar si el correo ya está registrado o no
      const findEmail = await collection.findOne({ email: email });
      if (!findEmail) {
        const result = await collection.insertOne({
          email: email,
          password: hashedPassword,
          role: role,
        });
        const { insertedId } = result;
        console.log("🚀 ~ postUser: ~ insertedId:", insertedId);

        return resp
          .status(200)
          .json({ _id: new ObjectId(insertedId), email: email, role: role });
      } else {
        return resp.status(403).json({ msg: "Usuario ya registrado" });
      }
    } catch (error) {
      console.log("🚀 ~ app.post ~ error:", error);

      return resp.status(500).send("Error en el servidor");
    }
  },
};
const validateOwnerOrAdmin = (req, uid) => {
  if (req.role !== "admin") {
    if (uid !== req.uid && uid !== req.email) {
      return false;
    }
  }
  return true;
};

const getIdOrEmail = (uid) => {
  let filter;
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateId = ObjectId.isValid(uid);
  if (regexCorreo.test(uid)) {
    filter = { email: uid };
  } else {
    if (validateId) {
      filter = { _id: new ObjectId(uid) };
    }
  }
  return filter;
};

function isValidEmail(email) {
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexCorreo.test(email);
}
