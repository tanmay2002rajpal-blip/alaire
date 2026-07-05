"use server"

import { getProductVariantSales } from "@/lib/queries/analytics"
import { getSession } from "@/lib/auth/jwt"

export async function getVariantSalesAction(productId: string) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  return getProductVariantSales(productId)
}
