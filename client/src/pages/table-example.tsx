import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Table as TableIcon } from "lucide-react";

// Example data type
type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
  date: string;
};

// Example data
const payments: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
    date: "2023-12-01",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@gmail.com",
    date: "2023-12-02",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@gmail.com",
    date: "2023-12-03",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@gmail.com",
    date: "2023-12-04",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
    date: "2023-12-05",
  },
  {
    id: "7ma83ae",
    amount: 125,
    status: "pending",
    email: "john.doe@example.com",
    date: "2023-12-06",
  },
  {
    id: "9qecj4p",
    amount: 450,
    status: "success",
    email: "jane.smith@example.com",
    date: "2023-12-07",
  },
  {
    id: "2ws0derv",
    amount: 299,
    status: "processing",
    email: "bob.wilson@example.com",
    date: "2023-12-08",
  },
  {
    id: "4i9m5gr8",
    amount: 199,
    status: "failed",
    email: "alice.brown@example.com",
    date: "2023-12-09",
  },
  {
    id: "1euv43u",
    amount: 599,
    status: "success",
    email: "charlie.davis@example.com",
    date: "2023-12-10",
  },
];

// Define columns
const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Transaction ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = {
        pending: "secondary",
        processing: "default",
        success: "success",
        failed: "destructive",
      }[status] as any;
      
      return (
        <Badge variant={variant}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <div className="text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
];

export default function TableExamplePage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TableIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                TanStack Table Example
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                A demonstration of TanStack Table with sorting, filtering, and selection
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About TanStack Table</CardTitle>
            <CardDescription>
              TanStack Table (formerly React Table) is a powerful, lightweight, and extensible data grid library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This example demonstrates the following features:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Column sorting - Click on column headers to sort</li>
              <li>Row selection - Use checkboxes to select rows</li>
              <li>Pagination - Navigate through pages of data</li>
              <li>Column visibility - Hide/show columns using the dropdown</li>
              <li>Global filtering - Search across all columns</li>
            </ul>
          </CardContent>
        </Card>

        {/* Simple Table Example */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Data Table</CardTitle>
            <CardDescription>
              A simple table with basic features enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={payments}
              searchKey="email"
              searchPlaceholder="Filter emails..."
              showPagination={true}
              pageSize={5}
            />
          </CardContent>
        </Card>

        {/* Table without Column Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Table without Column Visibility Toggle</CardTitle>
            <CardDescription>
              Same data, but without the column visibility dropdown
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={payments}
              searchKey="email"
              searchPlaceholder="Search by email..."
              showColumnVisibility={false}
              showPagination={true}
              pageSize={5}
            />
          </CardContent>
        </Card>

        {/* Table without Pagination */}
        <Card>
          <CardHeader>
            <CardTitle>Table without Pagination</CardTitle>
            <CardDescription>
              All data displayed at once
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={payments.slice(0, 5)}
              showPagination={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}