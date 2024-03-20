const { connect } = require("../connect");
const jwt = require("jsonwebtoken");
const config = require("../config");
const bcrypt = require("bcrypt");

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp) => {
    try {
      // TODO: Authenticate the user
      // It is necessary to confirm if the email and password
      // match a user in the database
      // If they match, send an access token created with JWT
      const { email, password } = req.body;
      const db = await connect();
      const collection = db.collection("users");
      const user = await collection.findOne({ email });
      const compare = await bcrypt.compare(password, user.password);
      if (!email && !password) {
        resp.status(400).json({ error: "Enter a password and email" });
      }
      if (compare) {
        const { _id, role } = user;
        const accesToken = jwt.sign({ _id: _id, role: role }, secret);
        resp.json({ ok: "Ingreso", token: accesToken });
      }
      // next(400);
    } catch (error) {
      console.error("Error", error);
      // next(500);
    }
  });

  return nextMain();
};
