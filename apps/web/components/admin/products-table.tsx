"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Edit, Loader2, MoreHorizontal, Search, Trash } from "lucide-react";

import { Button } from "@lila/ui";
import { Input } from "@lila/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import {
  deleteProduct,
  toggleProductStatus,
} from "@/app/admin/products/actions";
import { ProductDialog } from "@/components/admin/product-dialog";
import { Retailer, ProductPurchaseOption } from "@/lib/types";

interface Product {
  product_slug: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image_url?: string;
  disabled_at?: string | null;
  created_at?: string;
  // New fields optional for table view but needed for Dialog passthrough
  rating?: number;
  review_count?: number;
  attributes?: string[];
  benefits?: string[];
  active_ingredients?: string[];
  concerns?: string[];
  // Added for dialog
  product_purchase_options?: ProductPurchaseOption[];
}

interface ProductsTableProps {
  products: Product[];
  count: number;
  page: number;
  limit: number;
  retailers: Retailer[];
}

export function ProductsTable({
  products,
  count,
  page,
  limit,
  retailers,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const totalPages = Math.ceil(count / limit);

  const handleSearch = (term: string) => {
    setSearch(term);
    // Debounce logic could be added here, but simple Enter or wait is fine for now?
    // Let's rely on Enter key or button or effect.
    // For simplicity: Update URL on Enter key or separate button?
    // Or specific Effect.
  };

  const updateQueryParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === "") params.delete(key);
      else params.set(key, String(value));
    });
    router.push(`?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const res = await deleteProduct(itemToDelete.product_slug);
    setIsDeleting(false);
    setItemToDelete(null);
    if (res.success) {
      toast.success("Product deleted");
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleStatus = async (slug: string, currentStatus: boolean) => {
    const res = await toggleProductStatus(slug, currentStatus);
    if (res.success) {
      toast.success("Status updated");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="w-[300px] pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateQueryParams({ search: search, page: 1 });
                }
              }}
            />
          </div>
        </div>
        {/* Pagination Stats? */}
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of{" "}
          {count} entries
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.product_slug}>
                <TableCell>
                  {product.image_url ? (
                    <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.brand}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!product.disabled_at}
                    onCheckedChange={(checked) =>
                      handleToggleStatus(product.product_slug, checked)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ProductDialog product={product} retailers={retailers}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </ProductDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setItemToDelete(product)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQueryParams({ page: page - 1 })}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQueryParams({ page: page + 1 })}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <strong>
                {" "}
                {itemToDelete?.brand} - {itemToDelete?.name}{" "}
              </strong>
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
