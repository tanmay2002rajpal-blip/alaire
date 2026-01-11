'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Package,
  Users,
  LogIn,
  Activity,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { gsap } from 'gsap';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  admin_name: string | null;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const getActivityIcon = (entityType: string | null, action: string) => {
  const iconClass = "w-5 h-5";

  if (action.toLowerCase().includes('login') || action.toLowerCase().includes('logout')) {
    return <LogIn className={iconClass} />;
  }

  switch (entityType?.toLowerCase()) {
    case 'order':
      return <ShoppingCart className={iconClass} />;
    case 'product':
      return <Package className={iconClass} />;
    case 'customer':
    case 'user':
      return <Users className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

const formatActivityDescription = (activity: ActivityItem): string => {
  const { action, entity_type, entity_id, details, admin_name } = activity;

  // Map of raw action names to human-readable descriptions
  const actionMap: Record<string, string> = {
    'login': 'logged in',
    'logout': 'logged out',
    'login_failed': 'Failed login attempt',
    'login_success': 'logged in successfully',
    'password_reset': 'reset their password',
    'password_change': 'changed their password',
    'profile_update': 'updated their profile',
    'create': 'created',
    'update': 'updated',
    'delete': 'deleted',
    'order_created': 'New order placed',
    'order_updated': 'Order status updated',
    'order_shipped': 'Order shipped',
    'order_delivered': 'Order delivered',
    'order_cancelled': 'Order cancelled',
    'order_refunded': 'Order refunded',
    'product_created': 'New product added',
    'product_updated': 'Product updated',
    'product_deleted': 'Product deleted',
    'category_created': 'New category created',
    'category_updated': 'Category updated',
    'category_deleted': 'Category deleted',
    'coupon_created': 'New coupon created',
    'coupon_updated': 'Coupon updated',
    'coupon_deleted': 'Coupon deleted',
    'customer_created': 'New customer registered',
    'customer_updated': 'Customer profile updated',
    'stock_updated': 'Stock levels updated',
    'low_stock_alert': 'Low stock alert triggered',
    'settings_updated': 'Settings changed',
    'team_member_invited': 'Team member invited',
    'team_member_removed': 'Team member removed',
  };

  // Get the base action description
  const actionLower = action.toLowerCase();
  let baseAction = actionMap[actionLower] || actionMap[action] || action.replace(/_/g, ' ');

  // Handle login/logout actions with admin name
  if (actionLower === 'login' || actionLower === 'login_success' || actionLower === 'logout') {
    return admin_name ? `${admin_name} ${baseAction}` : `User ${baseAction}`;
  }

  // Handle failed login with IP info if available
  if (actionLower === 'login_failed') {
    if (details?.ip) {
      return `${baseAction} from IP: ${details.ip.substring(0, 12)}...`;
    }
    return baseAction;
  }

  // Add entity information if available
  if (entity_type && entity_id) {
    const entityName = entity_type.charAt(0).toUpperCase() + entity_type.slice(1);

    // Use specific details if available
    if (details) {
      if (details.order_number) {
        return `${baseAction} - Order #${details.order_number}`;
      }
      if (details.product_name) {
        return `${baseAction} - "${details.product_name}"`;
      }
      if (details.category_name) {
        return `${baseAction} - "${details.category_name}"`;
      }
      if (details.customer_email) {
        return `${baseAction} - ${details.customer_email}`;
      }
      if (details.coupon_code) {
        return `${baseAction} - Code: ${details.coupon_code}`;
      }
    }

    return `${baseAction} - ${entityName} #${entity_id.substring(0, 8)}`;
  }

  // If we have additional context from details, add it
  if (details) {
    if (details.message) {
      return `${baseAction}: ${details.message}`;
    }
    if (details.name) {
      return `${baseAction} - "${details.name}"`;
    }
  }

  return baseAction;
};

const getActivityColor = (entityType: string | null, action: string): string => {
  if (action.toLowerCase().includes('delete')) {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }

  switch (entityType?.toLowerCase()) {
    case 'order':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'product':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'customer':
    case 'user':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemsRef.current.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(itemsRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [activities]);

  const displayActivities = activities.slice(0, 10);
  const hasMore = activities.length > 10;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activity
          </CardTitle>
          {hasMore && (
            <Link href="/admin/activity-log">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-gray-600 hover:text-gray-900 -mr-2"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6" ref={containerRef}>
        {displayActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-3 bottom-3 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

            {/* Activity items */}
            <div className="space-y-4">
              {displayActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  ref={(el) => {
                    if (el) itemsRef.current[index] = el;
                  }}
                  className="relative flex gap-4 group"
                >
                  {/* Icon */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-center
                      w-12 h-12 rounded-full border-2
                      transition-all duration-300
                      group-hover:scale-110 group-hover:shadow-md
                      ${getActivityColor(activity.entity_type, activity.action)}
                    `}
                  >
                    {getActivityIcon(activity.entity_type, activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-gray-900 mb-1 leading-relaxed">
                      {formatActivityDescription(activity)}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {activity.admin_name && (
                        <>
                          <span className="font-medium text-gray-700">
                            {activity.admin_name}
                          </span>
                          <span className="text-gray-300">•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true
                        })}
                      </span>
                    </div>

                    {/* Additional details */}
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
                        {activity.details.status && (
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Status:</span>
                            <span className="capitalize">{activity.details.status}</span>
                          </span>
                        )}
                        {activity.details.amount && (
                          <span className="inline-flex items-center gap-1 ml-3">
                            <span className="font-medium">Amount:</span>
                            <span>${activity.details.amount}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasMore && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link href="/admin/activity-log">
              <Button
                variant="outline"
                className="w-full text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View All Activity
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
