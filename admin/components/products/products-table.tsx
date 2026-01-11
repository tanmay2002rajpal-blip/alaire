"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Package,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  category_name: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

interface ProductsTableProps {
  products: Product[];
  onDelete?: (id: string) => void;
  selectedProducts?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

type SortField = "name" | "category_name" | "price" | "stock" | "created_at";
type SortDirection = "asc" | "desc";

export function ProductsTable({
  products,
  onDelete,
  selectedProducts = [],
  onSelectionChange,
}: ProductsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const tableRef = useRef<HTMLTableElement>(null);
  const rowsRef = useRef<(HTMLTableRowElement | null)[]>([]);

  // GSAP staggered entrance animation
  useEffect(() => {
    if (rowsRef.current.length > 0) {
      gsap.fromTo(
        rowsRef.current.filter(Boolean),
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [products]);

  // Sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? products.map((p) => p.id) : []);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedProducts, productId]
        : selectedProducts.filter((id) => id !== productId);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected =
    products.length > 0 && selectedProducts.length === products.length;
  const isSomeSelected = selectedProducts.length > 0 && !isAllSelected;

  // Use consistent formatting to prevent hydration mismatches
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="rounded-md border">
      <Table ref={tableRef}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all products"
                className={isSomeSelected ? "data-[state=checked]:bg-primary" : ""}
              />
            </TableHead>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="-ml-4 h-auto p-2 hover:bg-transparent"
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button
                variant="ghost"
                onClick={() => handleSort("category_name")}
                className="-ml-4 h-auto p-2 hover:bg-transparent"
              >
                Category
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("price")}
                className="-ml-4 h-auto p-2 hover:bg-transparent"
              >
                Price
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                onClick={() => handleSort("stock")}
                className="-ml-4 h-auto p-2 hover:bg-transparent"
              >
                Stock
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Package className="h-8 w-8" />
                  <p>No products found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedProducts.map((product, index) => (
              <TableRow
                key={product.id}
                ref={(el) => {
                  rowsRef.current[index] = el;
                }}
                className={
                  selectedProducts.includes(product.id)
                    ? "bg-muted/50"
                    : ""
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) =>
                      handleSelectProduct(product.id, checked as boolean)
                    }
                    aria-label={`Select ${product.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/products/${product.id}`}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-muted-foreground">
                    {product.category_name}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(product.price)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        product.stock < 10
                          ? "text-destructive font-medium"
                          : ""
                      }
                    >
                      {product.stock}
                    </span>
                    {product.stock < 10 && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                  >
                    {product.is_active ? "Active" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(product.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
