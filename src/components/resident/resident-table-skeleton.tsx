import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ResidentTableSkeletonProps {
  title?: string;
  columns?: number;
  rows?: number;
  className?: string;
}

const widths = ["w-4/5", "w-3/4", "w-2/3", "w-1/2", "w-5/6"];

export function ResidentTableSkeleton({
  title,
  columns = 4,
  rows = 5,
  className,
}: ResidentTableSkeletonProps) {
  return (
    <Card className={cn("portal-card border-[var(--portal-outline)] shadow-none", className)}>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <TableHead key={`header-${columnIndex}`}>
                  <Skeleton className="h-2.5 w-2/3 rounded-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <TableCell key={`cell-${rowIndex}-${columnIndex}`}>
                    <Skeleton
                      className={cn("h-3 rounded-full", widths[(rowIndex + columnIndex) % widths.length])}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

