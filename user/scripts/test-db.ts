import {
  getCategories,
  getCategoriesWithCounts,
} from "../lib/db/queries/categories";

async function main() {
  console.log("Fetching categories...");
  const cats = await getCategories();
  console.log("getCategories() returned:", cats.length, "items.");

  console.log("Fetching categories with counts...");
  try {
    const counts = await getCategoriesWithCounts();
    console.log("getCategoriesWithCounts() returned:", counts.length, "items.");
    console.log(counts[0]);
  } catch (error) {
    console.error("Error in getCategoriesWithCounts:", error);
  }
  process.exit(0);
}

main();
