"use server"

import { getProductVariantSales } from "@/lib/queries/analytics"

export async function getVariantSalesAction(productId: string) {
  return getProductVariantSales(productId)
}
