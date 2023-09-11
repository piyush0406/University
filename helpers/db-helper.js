import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const password = process.env.MONGO_ATLAS_PW;
const MONGOB_URI = `mongodb+srv://mhpl:${password}@cluster0.xfapz.mongodb.net/`;

let db_connection = null;
const ConnectToDatabase = async () => {
  try {
    if (db_connection) return db_connection;
    db_connection = await MongoClient.connect(MONGOB_URI);

    console.log("connected to mongo🚀🚀🚀🚀");
    return db_connection;
  } catch (error) {
    console.log({ error });
  }
};

export { ConnectToDatabase };
