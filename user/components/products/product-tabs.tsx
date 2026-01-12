"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductDetail {
  id: string
  tab_name: string
  content: string | null
  position: number
}

interface ProductTabsProps {
  details: ProductDetail[]
}

export function ProductTabs({ details }: ProductTabsProps) {
  if (!details || details.length === 0) {
    return null
  }

  const sortedDetails = [...details].sort((a, b) => a.position - b.position)

  return (
    <Tabs defaultValue={sortedDetails[0]?.tab_name} className="w-full">
      <TabsList className="w-full justify-start border-b bg-transparent p-0">
        {sortedDetails.map((detail) => (
          <TabsTrigger
            key={detail.id}
            value={detail.tab_name}
            className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent"
          >
            {detail.tab_name}
          </TabsTrigger>
        ))}
      </TabsList>

      {sortedDetails.map((detail) => (
        <TabsContent
          key={detail.id}
          value={detail.tab_name}
          className="mt-6 whitespace-pre-wrap text-muted-foreground"
        >
          {detail.content || "No information available."}
        </TabsContent>
      ))}
    </Tabs>
  )
}
