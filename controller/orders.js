const { connect } = require("../connect");
const { ObjectId } = require("mongodb");

module.exports = {
  postOrders: async (req, resp) => {
    try {
      const { client, products } = req.body;
      if (!client || !products){
        return resp.status(400).json({ error: " Missing fields" });
      }
      const status = "pending";
      const db = await connect();
      const collectionOrder = db.collection("orders");
      const collecionProduct = db.collection("products");
      // const collectionUser = db.collection("users");
      const dateEntry = new Date();

      // if (!cursorUser) {
      //   return resp.status(400).json({ error: "Usuario no encontrado" });
      // }

      const productList = [];
      for (const element of products) {
        // console.log("🚀 ~ postOrders: ~ products:", products);
        const cursorProduct = await collecionProduct.findOne({
          _id: new ObjectId(element.productId),
        });
        // console.log("🚀 ~ postOrders: ~ cursorProduct:", cursorProduct);
        if (!cursorProduct) {
          return resp.status(400).json({ error: "Product doesn't exist" });
        }
        productList.push({
          product: cursorProduct,
          qty: element.qty,
        });
      }

      const cursorOrder = await collectionOrder.insertOne({
        userId: new ObjectId(req.uid),
        client: client,
        products: productList,
        status: status,
        dateEntry: dateEntry,
      });
      return resp.status(200).json(cursorOrder);
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  getOrders: async (req, resp) => {
    try {
      const db = await connect();
      const collection = db.collection("orders");
      const result = await collection.find({}).toArray();
      if (result.length === 0) {
        return resp.status(404).json({ error: "No se encontraron ordenes" });
      }
      return resp.status(200).json(result);
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  getOrderById: async (req, resp) => {
    try {
      const { orderId } = req.params;
      const db = await connect();
      const collection = db.collection("orders");
      if (!ObjectId.isValid(orderId)) {
        return resp
          .status(404)
          .json({ error: "El ID de la orden proporcionado no es válido" });
      }
      const cursor = await collection.findOne({ _id: new ObjectId(orderId) });
      if (!cursor) {
        return resp.status(404).json({ error: "Pedido no encontrado" });
      }
      console.log("🚀 ~ getOrderById: ~ cursor:", cursor);
      return resp.status(200).json(cursor);
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  putOrderById: async (req, resp) => {
    try {
      const { orderId } = req.params;
      const db = await connect();
      const collecion = db.collection("orders");
      const validateId = ObjectId.isValid(orderId);
      if (!validateId) {
        return resp.status(404).json({ msg: "El ID de usuario proporcionado no es válido" });
      }

      const findOrder = await collecion.findOne({ _id: new ObjectId(orderId) });
      console.log("🚀 ~ putOrderById: ~ findOrder:", findOrder);

      if (!findOrder) {
        return resp.status(404).json({
          msg: "La orden con el ID proporcionado no existe en la base de datos",
        });
      }
      const { status: currentStatus } = findOrder;
      const { status: requestedStatus } = req.body;

      const validStatus = ["pending","preparing","delivering","delivered","canceled",];
      if (!validStatus.includes(requestedStatus)) {
        return resp.status(400).json({ error: "Estado no válido" });
      }

      // Validar cambios de estado permitidos
      if (currentStatus === "pending" && requestedStatus !== "preparing") {
        return resp.status(400).json({ error: "No se puede cambiar a este estado" });
      } else if (currentStatus === "preparing" && requestedStatus !== "delivering") {
        return resp.status(400).json({ error: "No se puede cambiar a este estado" });
      } else if (currentStatus === "delivering" && requestedStatus !== "delivered") {
        return resp.status(400).json({ error: "No se puede cambiar a este estado" });
      } else if (currentStatus === "canceled") {
        return resp.status(400).json({ error: "La orden está cancelada, no se puede actualizar" });
      }

      const cursor = await collecion.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: requestedStatus } }
      );
      return resp.json(cursor);
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  deleteOrderById: async (req, resp) => {
    try {
      const { orderId } = req.params;
      const db = await connect();
      const collection = db.collection("orders");
      if (!ObjectId.isValid(orderId)) {
        return resp
          .status(404)
          .json({ error: "El ID de la orden proporcionado no es válido" });
      }
      const findOrders = await collection.findOne({
        _id: new ObjectId(orderId),
      });
      if (!findOrders) {
        return resp.status(404).json({ msg: "El Id de la orden no existe" });
      }
      const orderDeleted = await collection.deleteOne({
        _id: new ObjectId(orderId),
      });
      if (orderDeleted.deletedCount === 0) {
        return resp.status(400).json({ error: "No se pudo eliminar la orden" });
      }
      return resp.status(200).json(orderDeleted);
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
