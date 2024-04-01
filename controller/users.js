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
  putByUser: async (req, resp) => {
    try {
      const { uid } = req.params;
      const { email, password, role } = req.body;
      
      // Conexión a la base de datos y obtención de la colección usuarios
      const db = await connect();
      const collection = db.collection("users");

      // Verificación de permisos del usuario actual
      if (!validateOwnerOrAdmin(req, uid)) {
        return resp.status(403).json({
          error: "El usuario no tiene permisos para actualizar",
        });
      }

      // Verificar el ID de usuario proporcionado
      const filter = getIdOrEmail(uid);
      if (!filter) {
        return resp
          .status(400)
          .json({ error: "El ID de usuario proporcionado no es válido" });
      }


      // Verificación de si existe un usuario en la BD
      const existingUser = await collection.findOne(filter);
      if (!existingUser) {
        return resp.status(404).json({
          msg: "El usuario con el ID proporcionado no existe en la base de datos",
        });
      }

      // Validación de información enviada para modificar
      if (Object.keys(req.body).length === 0) {
        return resp
          .status(400)
          .json({ error: "No se envio ninguna información para modificar" });
      }

      // Hashing si la constraseña se proporciono
      let hashedPassword;
      if (password) {
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        hashedPassword = await bcrypt.hash(password, salt);
      }
      //  Verificación de cambios en el rol de usuario
      if (role !== existingUser.role) {
        if (role === "admin" && !isAdmin(req)) {
          return resp.status(403).json({
            msg: "El usuario no tiene permisos para cambiar el rol",
          });
        }
      }
      console.log("🚀 ~ putByUser: ~ existingUser.role:", existingUser.role)
      console.log("🚀 ~ putByUser: ~ role:", role)
      console.log("isadmin",isAdmin(req))
      const updateDoc = await collection.updateOne(filter, {
        $set: {
          email: email || existingUser.email,
          password: hashedPassword || existingUser.password,
          role: role || existingUser.role,
        },
      });
      console.log(
        "🚀 ~ putByUser: ~ updateDoc.modifiedCount:",
        updateDoc.modifiedCount
      );

      // Verificación de cambios realizados
      if (updateDoc.modifiedCount === 0) {
        return resp.status(400).json({ error: "No se realizo ningún cambio" });
      }
      // envio de la inforamción actualizada
      // const viewUpdate = await collection.findOne(filter);
      return resp.json(updateDoc);
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  deleteByUser: async (req, resp) => {
    try {
      const { uid } = req.params;
      const db = await connect();
      const collection = db.collection("users");
      const filter = getIdOrEmail(uid);

      // Verificar permisos del usuario actual
      if (!validateOwnerOrAdmin(req, uid)) {
        return resp.status(403).json({
          error: "El usuario no tiene permisos para ver esta información",
        });
      }
      // Verificar si el ID de usuario proporcionado es válido
      if (!filter) {
        return resp
          .status(400)
          .json({ error: "El ID de usuario proporcionado no es válido" });
      }
      // Buscar el usuario en la base de datos
      const getUser = await collection.findOne(filter);
      if (!getUser) {
        return resp.status(404).json({ error: "El Id del usuario no existe" });
      }
      // Eliminar el usuario de la base de datos
      const cursor = await collection.deleteOne(filter);

      return resp
        .status(200)
        .json({ msg: "Usuario eliminado", usuario: cursor });
    } catch (error) {
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
