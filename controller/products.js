const { connect } = require("../connect");
const { ObjectId } = require("mongodb");

module.exports = {
  getProducts: async (req, resp) => {
    try {
      const db = await connect();
      const collection = db.collection("products");
      const products = await collection.find({}).toArray();
      if (products.length === 0) {
        return resp.status(404).json({ error: "No se encontraron productos" });
      }  
      console.log("🚀 ~ getProducts: ~ result:", products);
      return resp.status(200).json(products);
    } catch (error) {
      return resp.status(500).json({error:"Error en el servidor"});
    }
  },
  getProductById: async (req, resp) => {
    try {
      const { productId } = req.params;
      const db = await connect();
      const collection = db.collection("products");

      if (!ObjectId.isValid(productId)) {
        return resp.status(404).json({ error: "El ID del producto proporcionado no es válido" });
      }
  
      const cursor = await collection.findOne({ _id: new ObjectId(productId) });
      if (!cursor) {
        return resp.status(404).json({
          msg: "Producto no encontrado en la base de datos",
        });
      }
      return resp.status(200).json(cursor);
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  postProducts: async (req, resp) => {
    try {
      const { name, price, image, type } = req.body;
      if (!name || !price) {
        return resp.status(400).json({ message: "empty fields" });
      }
      if (typeof price !== 'number') {
        return resp.status(400).json({ error: "El precio debe ser un número válido" });
      }
  
      const db = await connect();
      const collection = db.collection("products");
      const dateEntry = new Date();
      // const findProduct = await collection.findOne( { name: name} );
      // if (findProduct){
      //   return resp.status(403).json({message : 'Ya existe un producto con este nombre'})
      // }
      const cursor = await collection.insertOne({
        name,
        price,
        image,
        type,
        dateEntry,
      });
      const { insertedId } = cursor;
      return resp.status(200).json({
        _id: new ObjectId(insertedId),
        name: name,
        price: price,
        image: image,
        type: type,
      });
    } catch (error) {
      return resp.status(500).send("Error en el servidor");
    }
  },
  putProductById: async (req, resp) => {
    try {
      const { productId } = req.params;
      if (!ObjectId.isValid(productId)) {
        return resp.status(404).json({ error: "El ID del producto proporcionado no es válido" });
      }
      const { name, price, image, type } = req.body;
      if (typeof price !== "number") {
        return resp.status(400).json({ error: "El precio debe ser un número" });
      }

      const db = await connect();
      const collection = db.collection("products");
      const findProduct = await collection.findOne({
        _id: new ObjectId(productId),
      });
      if (!findProduct) {
        return resp.status(404).json({
          msg: "El producto con ID proporcionado no existe en la base de datos",
        });
      }

     
      const filter = { _id: new ObjectId(productId) };
      const cursor = await collection.updateOne(filter, {
        $set: {
          name,
          price,
          image,
          type,
        },
      });
      if (cursor.modifiedCount === 0) {
        return resp.status(404).json({
          error: "No se modifico ningun dato del producto",
        });
      }
      const viewProduct = await collection.findOne(filter);
      return resp.status(200).json(viewProduct);
    } catch (error) {
      console.log("🚀 ~ putProductById: ~ error:", error);
      return resp.json({ msg: "Error en el servidor" });
    }
  },
  deleteProductById: async (req, resp) => {
    try {
      const { productId } = req.params;
      if (!ObjectId.isValid(productId)) {
        return resp.status(404).json({ error: "El ID del producto proporcionado no es válido" });
      }
      const db = await connect();
      const collection = db.collection("products");
      const findProduct = await collection.findOne({
        _id: new ObjectId(productId),
      });
      if (!findProduct) {
        return resp.status(404).json({
          msg: "El producto con ID proporcionado no existe en la base de datos",
        });
      }
      const result = await collection.deleteOne({
        _id: new ObjectId(productId),
      });
      return resp.json(result);
    } catch (error) {
      return resp.json({ msg: "Error en el servidor" });
    }
  },
};
