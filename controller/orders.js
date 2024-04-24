const { connect } = require("../connect");
const { ObjectId } = require("mongodb");
const { isAdmin } = require("../middleware/auth");

module.exports = {
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
      if (!ObjectId.isValid(orderId)) {
        return resp
        .status(404)
        .json({ error: "El ID de la orden proporcionado no es válido" });
      }
      const db = await connect();
      const collection = db.collection("orders");
      const cursor = await collection.findOne({ _id: new ObjectId(orderId) });
      if (!cursor) {
        return resp.status(404).json({ error: "Pedido no encontrado" });
      } else {
        return resp.status(200).json(cursor);
      }
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  postOrder: async (req, resp) => {
    try {
      const { userId, client, products } = req.body;
      if (
        !userId ||
        !client ||
        !Array.isArray(products) ||
        products.length === 0
      ) {
        return resp.status(400).json({ error: " Missing fields" });
      }
      // const status = "pending";
      const db = await connect();
      const collectionOrder = db.collection("orders");
      const collecionProduct = db.collection("products");
      const collectionUser = db.collection("users");
      if (!ObjectId.isValid(userId)) {
        return resp.status(400).json({ error: "User Id is not valid" });
      }
      // const dateEntry = new Date();
      const cursorUser = await collectionUser.findOne({
        _id: new ObjectId(userId),
      });
      if (!cursorUser) {
        return resp.status(400).json({ error: "Usuario no encontrado" });
      }

      const status = "pending";
      const dateEntry = new Date();
      const productList = [];

      for (const element of products) {
        // console.log("🚀 ~ postOrders: ~ products:", products);
        if (!ObjectId.isValid(element.productId)) {
          return resp
            .status(400)
            .json({ error: "El ID de producto proporcionado no es válido" });
        }
        if (!element.productId || !element.qty) {
          return resp
            .status(400)
            .json({ error: "Each product should have 'productId' and 'qty'" });
        }
        const cursorProduct = await collecionProduct.findOne({
          _id: new ObjectId(element.productId),
        });
        console.log("🚀 ~ postOrders: ~ cursorProduct:", cursorProduct);
        if (!cursorProduct) {
          return resp.status(400).json({ error: "Product doesn't exist" });
        }
        productList.push({
          qty: element.qty,
          product: {...cursorProduct},
        });
      }
      const orderFind = await collectionOrder.findOne({ client });

      if (orderFind) {
        return resp
          .status(403)
          .json({ error: "Ya existe una orden para este usuario." });
      }

      // const productList = products.map(element => ({
      //   product: element.productId,
      //   qty: element.qty,
      // }));
      const cursorOrder = await collectionOrder.insertOne({
        // userId: new ObjectId(req.uid),
        userId: new ObjectId(userId),
        client: client,
        products: productList,
        status: status,
        dateEntry: dateEntry,
      });
      const { insertedId } = cursorOrder;
      return resp.status(200).json({ _id: new ObjectId(insertedId),client,products:productList,status});
    } catch (error) {
      return resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  putOrderById: async (req, resp) => {
    try {
      const { orderId } = req.params;
      const { status: requestedStatus } = req.body;
      // if (!userId || !client || !Array.isArray(products) || !requestedStatus) {
      //   return resp.status(400).json({ error: "Campos requeridos faltantes" });
      // }
      const db = await connect();
      const collection = db.collection("orders");
      const validateId = ObjectId.isValid(orderId);
      if (!validateId) {
        return resp
          .status(404)
          .json({ msg: "El ID de usuario proporcionado no es válido" });
      }
      const findOrder = await collection.findOne({
        _id: new ObjectId(orderId),
      });
      console.log("🚀 ~ putOrderById: ~ findOrder:", findOrder);
      if (!findOrder) {
        return resp.status(404).json({
          msg: "La orden con el ID proporcionado no existe en la base de datos",
        });
      }
      const { status: currentStatus } = findOrder;
      // const { status: requestedStatus } = req.body;
      const validStatus = [
        "pending",
        "preparing",
        "delivering",
        "delivered",
        "canceled",
      ];
      if (!validStatus.includes(requestedStatus)) {
        return resp.status(400).json({ error: "Estado no válido" });
      }
      // Validar cambios de estado permitidos
      if (currentStatus === "pending" && requestedStatus !== "preparing") {
        return resp
          .status(400)
          .json({ error: "No se puede cambiar a este estado" });
      } else if (
        currentStatus === "preparing" &&
        requestedStatus !== "delivering"
      ) {
        return resp
          .status(400)
          .json({ error: "No se puede cambiar a este estado" });
      } else if (
        currentStatus === "delivering" &&
        requestedStatus !== "delivered"
      ) {
        return resp
          .status(400)
          .json({ error: "No se puede cambiar a este estado" });
      } else if (
        currentStatus === "delivered" ||
        currentStatus === "canceled"
      ) {
        return resp.status(400).json({
          error: "La orden está en un estado final, no se puede actualizar",
        });
      }

      const cursor = await collection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: requestedStatus } }
      );
      const viewUpdate = await collection.findOne({
        _id: new ObjectId(orderId),
      });
      console.log("🚀 ~ putOrderById: ~ viewUpdate:", viewUpdate);
      return resp.status(200).json(viewUpdate);
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
      console.log("rol", req.uid);
      if (req.uid !== "admin") {
        return resp
          .status(403)
          .json({ error: "Solo los administradores pueden eliminar órdenes" });
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
