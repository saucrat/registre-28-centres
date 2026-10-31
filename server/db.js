import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "registre28";

/** @type {MongoClient | null} */
let client = null;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

export async function getCollections() {
  const db = await getDb();
  return {
    db,
    beneficiaries: db.collection("beneficiaries"),
    trainers: db.collection("trainers"),
    meta: db.collection("meta"),
  };
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
  }
}
