const { MongoClient } = require("mongodb");
const config = require("./config");

// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;
const client = new MongoClient(dbUrl);


async function connect() {
  // TODO: Database Connection
  try{
    await client.connect();
    const db = client.db("burgerQueenApi");
    console.log("conexion correcta")
    return db;
  }catch(error){
    console.log("Error en la conexión", error)
  }
}

module.exports = { connect };
