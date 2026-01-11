import Link from 'next/link';
import { ArrowLeft, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderNotFound() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Order Not Found</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-6">
              <PackageX className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>Order Not Found</CardTitle>
          <CardDescription>
            The order you are looking for does not exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/orders">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
