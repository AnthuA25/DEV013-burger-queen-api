const { connect } = require("../connect");
const { ObjectId } = require("mongodb");

module.exports = {
  postProducts: async (req, resp) => {
    const { name, price, image, type } = req.body;
    const db = await connect();
    const collection = db.collection("products");
    const dateEntry = new Date();
    const result1 = await collection.insertOne({
      name,
      price,
      image,
      type,
      dateEntry,
    });
    resp.json(result1);
  },
};
