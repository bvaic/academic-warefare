import { MongoClient } from "mongodb";
import "dotenv/config";

// ! must be URL-encoded as %21 in the connection string
const MONGO_URI = "mongodb://comet_user:pAsSw0rDDB69420%21@172.30.241.83:27017/comet_db?authSource=admin";

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  localAddress: "172.30.144.36",  // ZeroTier interface IP
});
let db;

export async function connectDB() {
  await client.connect();
  db = client.db(process.env.MONGO_DB);

  // Indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  console.log(`✅ MongoDB connected → comet_db @ 172.30.241.83:27017`);
  return db;
}

export function getDB() {
  if (!db) throw new Error("DB not initialised — call connectDB() first");
  return db;
}
