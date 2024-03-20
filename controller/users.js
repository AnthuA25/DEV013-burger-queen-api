const { connect } = require("../connect");
const bcrypt = require("bcrypt");
module.exports = {
  getUsers: async (req, resp, next) => {
    const db = await connect();
    const collection = db.collection("users");
    const options = {
      projection: { _id: 1, email: 1, role: 1 },
    };
    const result = await collection.find({}, options).toArray();
    resp.json(result);
  },
  postUser: async (req, resp) => {
    try {
      const { email, password, role } = req.body;
      const db = await connect();
      const listRole = ["admin", "waiter", "chef"];
      if (!listRole.includes(role))
        resp.status(400).json({ error: "role is not valid" });
      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log("🚀 ~ app.post ~ hashedPassword:", hashedPassword);
      const collection = db.collection("users");
      const findEmail = await collection.findOne({ email: email });
      if (!findEmail) {
        const result = await collection.insertOne({
          email: email,
          password: hashedPassword,
          role: role,
        });
        resp.status(201).json(result);
      }
      // } else {
      //   resp.send("El usuario ya existe");
      // }
    } catch (error) {
      console.log("🚀 ~ app.post ~ error:", error);

      return resp.status(500).send("Error en el servidor");
    }
  },
};
