'use client';

import { useUser } from '@/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-500',
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-500',
    label: 'Approved',
  },
  denied: {
    icon: XCircle,
    color: 'bg-red-500',
    label: 'Denied',
  },
};

export function ApprovalStatusTable() {
  const { coinRequests, isProfileLoading, userError } = useUser();

  if (isProfileLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (userError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching History</AlertTitle>
        <AlertDescription>
          There was a problem loading your request history. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!coinRequests || coinRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        You have not made any coin requests yet.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Coin Requests</CardTitle>
        <p className="text-sm text-muted-foreground">
          Here is the history of your add and withdraw requests.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Coins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Decision Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coinRequests.map((req) => {
              const statusInfo = statusConfig[req.status];
              return (
                <TableRow key={req.id}>
                  <TableCell className="capitalize font-medium">
                    {req.type}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-semibold',
                      req.type === 'add' ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {req.type === 'add' ? '+' : '-'}
                    {req.amountCoins.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                           <Badge
                            className={cn(
                              'flex items-center gap-1.5 w-fit',
                              req.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 hover:bg-yellow-100',
                              req.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100',
                              req.status === 'denied' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-100'
                            )}
                          >
                            <statusInfo.icon className="h-3.5 w-3.5" />
                            {statusInfo.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{statusInfo.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {req.requestDate.toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {req.decisionDate
                      ? req.decisionDate.toDate().toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
