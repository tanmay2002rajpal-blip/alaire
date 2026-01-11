"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { IndianRupee, ShoppingCart, Package, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface StatsCardsProps {
  todayRevenue: number;
  revenueChange: number;
  pendingOrders: number;
  lowStockItems: number;
  newCustomers: number;
}

export function StatsCards({
  todayRevenue,
  revenueChange,
  pendingOrders,
  lowStockItems,
  newCustomers,
}: StatsCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll(".stats-card");

    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      }
    );
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendColor = (value: number): string => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div
      ref={containerRef}
      className="@container grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* Today's Revenue */}
      <Card className="stats-card @container">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Today&apos;s Revenue
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
          <CardDescription className="mt-1 flex items-center gap-1">
            <span className={getTrendColor(revenueChange)}>
              {formatPercentage(revenueChange)}
            </span>
            <span className="text-muted-foreground">from yesterday</span>
          </CardDescription>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Link href="/orders?status=pending" className="stats-card">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <CardDescription className="mt-1">
              Awaiting processing
            </CardDescription>
          </CardContent>
        </Card>
      </Link>

      {/* Low Stock Items */}
      <Link href="/inventory?filter=low-stock" className="stats-card">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
              <Package className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <CardDescription className="mt-1">
              Needs restocking
            </CardDescription>
          </CardContent>
        </Card>
      </Link>

      {/* New Customers */}
      <Card className="stats-card @container">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newCustomers}</div>
          <CardDescription className="mt-1">This week</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
