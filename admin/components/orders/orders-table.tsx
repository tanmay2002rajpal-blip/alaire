"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  MoreHorizontal,
  Eye,
  Truck,
  FileText,
  ExternalLink,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderUser {
  name: string;
  email: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  user: OrderUser | null;
  items_count: number;
}

interface OrdersTableProps {
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  selectedOrders?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

type SortField = "order_number" | "total" | "status" | "created_at" | "items_count";
type SortDirection = "asc" | "desc";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
} as const;

export function OrdersTable({
  orders,
  onStatusChange,
  selectedOrders = [],
  onSelectionChange,
}: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const rowsRef = useRef<(HTMLTableRowElement | null)[]>([]);

  // GSAP entrance animation
  useEffect(() => {
    const rows = rowsRef.current.filter(Boolean);
    if (rows.length > 0) {
      gsap.fromTo(
        rows,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [orders]);

  // Sorting logic
  const sortedOrders = [...orders].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];

    // Handle date sorting
    if (sortField === "created_at") {
      aValue = new Date(a.created_at).getTime();
      bValue = new Date(b.created_at).getTime();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
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
      onSelectionChange(checked ? orders.map((order) => order.id) : []);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedOrders, orderId]
        : selectedOrders.filter((id) => id !== orderId);
      onSelectionChange(newSelection);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant="secondary" className={cn("font-medium", config.color)}>
        {config.label}
      </Badge>
    );
  };

  const allSelected =
    orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && !allSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all orders"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("order_number")}
                className="h-auto p-0 hover:bg-transparent"
              >
                Order #
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">Customer</TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                onClick={() => handleSort("items_count")}
                className="h-auto p-0 hover:bg-transparent"
              >
                Items
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("total")}
                className="h-auto p-0 hover:bg-transparent"
              >
                Total
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("status")}
                className="h-auto p-0 hover:bg-transparent"
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <Button
                variant="ghost"
                onClick={() => handleSort("created_at")}
                className="h-auto p-0 hover:bg-transparent"
              >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            sortedOrders.map((order, index) => (
              <TableRow
                key={order.id}
                ref={(el) => { rowsRef.current[index] = el }}
                className="group transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOrder(order.id, checked as boolean)
                    }
                    aria-label={`Select order ${order.order_number}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {order.order_number}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {order.user ? (
                    <div className="space-y-0.5">
                      <div className="font-medium">{order.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.user.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Guest
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {order.items_count}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
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
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/orders/${order.id}`}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {order.status !== "shipped" &&
                        order.status !== "delivered" &&
                        order.status !== "cancelled" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                onStatusChange?.(order.id, "shipped")
                              }
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Mark as Shipped
                            </DropdownMenuItem>
                          </>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          // Handle print invoice
                          window.print();
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Print Invoice
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
