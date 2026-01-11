'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  admin_name: string | null;
  created_at: string;
}

interface OrderTimelineProps {
  history: OrderHistoryEntry[];
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-500',
    badgeVariant: 'secondary' as const,
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  processing: {
    icon: Package,
    color: 'bg-blue-500',
    badgeVariant: 'default' as const,
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-500',
    badgeVariant: 'secondary' as const,
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  delivered: {
    icon: CheckCircle2,
    color: 'bg-green-500',
    badgeVariant: 'default' as const,
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-500',
    badgeVariant: 'destructive' as const,
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  refunded: {
    icon: RotateCcw,
    color: 'bg-gray-500',
    badgeVariant: 'outline' as const,
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
} as const;

const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleDateString('en-US', options).replace(',', ' at');
};

export function OrderTimeline({ history }: OrderTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<(HTMLDivElement | null)[]>([]);

  // Sort history by created_at descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  useEffect(() => {
    if (entriesRef.current.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        entriesRef.current.filter(Boolean),
        {
          opacity: 0,
          x: -30,
          scale: 0.95,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }, timelineRef);

    return () => ctx.revert();
  }, [history]);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm text-gray-500">No status history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={timelineRef} className="relative space-y-6 px-2">
          {/* Timeline connecting line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200" />

          {sortedHistory.map((entry, index) => {
            const config = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] || {
              icon: Clock,
              color: 'bg-gray-500',
              badgeVariant: 'outline' as const,
              textColor: 'text-gray-700',
              bgColor: 'bg-gray-50',
              borderColor: 'border-gray-200',
            };
            const Icon = config.icon;

            return (
              <div
                key={entry.id}
                ref={(el) => {
                  entriesRef.current[index] = el;
                }}
                className="relative flex gap-4 group"
              >
                {/* Timeline dot with icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-md transition-transform group-hover:scale-110',
                      config.color
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {/* Connecting line fade effect */}
                  {index === sortedHistory.length - 1 && (
                    <div className="absolute left-1/2 top-full h-6 w-0.5 -translate-x-1/2 bg-gradient-to-b from-gray-200 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div
                    className={cn(
                      'rounded-lg border p-4 transition-all group-hover:shadow-md',
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    {/* Header with status badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant={config.badgeVariant}
                        className="capitalize"
                      >
                        {entry.status}
                      </Badge>
                      <time className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(entry.created_at)}
                      </time>
                    </div>

                    {/* Admin info */}
                    {entry.admin_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        Updated by{' '}
                        <span className="font-medium">{entry.admin_name}</span>
                      </p>
                    )}

                    {/* Note */}
                    {entry.note && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700 italic">
                          "{entry.note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
