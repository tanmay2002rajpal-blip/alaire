const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env" });

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "alaire");
  
  console.log("Hero Slides:", await db.collection("hero_slides").countDocuments());
  console.log("Active Hero Slides:", await db.collection("hero_slides").countDocuments({ is_active: true }));
  console.log("Products:", await db.collection("products").countDocuments());
  console.log("Active Products:", await db.collection("products").countDocuments({ is_active: true }));
  console.log("Categories:", await db.collection("categories").countDocuments());
  console.log("Active Categories:", await db.collection("categories").countDocuments({ is_active: true }));
  
  await client.close();
}
check().catch(console.error);
