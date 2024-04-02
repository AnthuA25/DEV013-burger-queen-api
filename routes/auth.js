const { connect } = require("../connect");
const jwt = require("jsonwebtoken");
const config = require("../config");
const bcrypt = require("bcrypt");

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp) => {
    try {
      const { email, password } = req.body;
      // console.log("🚀 ~ app.post ~ password:", password)
      // console.log("🚀 ~ app.post ~ email:", email)

       // Validar email y password
       if (!email || !password) {
        return resp.status(400).json({
          error: "Email and password are required",
        });
      }
      const db = await connect();
      const collection = db.collection("users");

      const user = await collection.findOne({ email });
      if (!user) {
        return resp.status(404).json({
          error:
            "Usuario no encontrado, por favor intente de nuevo con un usuario válido",
        });
      }
      const compare = await bcrypt.compare(password, user.password);
      const { _id, role} = user;
      if (compare) {
        const accessToken = jwt.sign({ _id: _id, email:email, role: role}, secret);
        return resp.status(200).json({ user:{
          _id:_id,
          email:email,
        }, accessToken:accessToken });
      } else {
        return resp.status(404).json({
          error: "contraseña incorrecta",
        });
      }

      // next(400);
    } catch (error) {
      console.error("Error", error);
      return resp.status(500).json({ error: "Error en el servidor" });
    }
  });

  return nextMain();
};
