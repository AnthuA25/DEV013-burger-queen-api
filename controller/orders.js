const { connect } = require("../connect");
const { ObjectId } = require("mongodb");

module.exports = {
  postOrders: async (req, resp) => {
    try {
      const { userId, client, products, status } = req.body;
      const db = await connect();
      const collectionOrder = db.collection("orders");
      const collecionProduct = db.collection("products");
      const collectionUser = db.collection("users");
      const dateEntry = new Date();

      const statusOrden = ["pending", "canceled", "delivering", "delivered"];
      if (!statusOrden.includes(status))
        resp.status(400).json({ error: "status is not valid" });
      const cursorUser = await collectionUser.findOne({
        _id: new ObjectId(userId),
      });
      console.log("🚀 ~ postOrders: ~ cursorUser:", cursorUser);
      if (!cursorUser) {
        return resp.status(404).json({ error: "Usuario no encontrado" });
      }

      const productList = [];
      for (const element of products) {
        console.log("🚀 ~ postOrders: ~ products:", products);
        const cursorProduct = await collecionProduct.findOne({
          _id: new ObjectId(element.productId),
        });
        console.log("🚀 ~ postOrders: ~ cursorProduct:", cursorProduct);
        if (cursorProduct) {
          productList.push({
            product: cursorProduct,
            qty: element.qty,
          });
        } else {
          resp.status(404).json({ error: "Product doesn't exist" });
        }
      }

      const cursorOrder = await collectionOrder.insertOne({
        userId: cursorUser._id,
        client: client,
        products: productList,
        status: status,
        dateEntry: dateEntry,
      });
      resp.json(cursorOrder);
    } catch (error) {
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  getOrders: async (req, resp) => {
    try {
      const db = await connect();
      const collection = db.collection("orders");
      const result = await collection.find({}).toArray();
      resp.status(200).json({ok:"successful operation",orders:result})
    } catch (error) {
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
