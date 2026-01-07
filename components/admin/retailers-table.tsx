"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Edit, Loader2, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { toggleRetailerStatus } from "@/app/admin/retailers/actions";
import { RetailerDialog } from "@/components/admin/retailer-dialog";
import { Retailer } from "@/lib/types";

interface RetailersTableProps {
  retailers: Retailer[];
}

export function RetailersTable({
  retailers: initialRetailers,
}: RetailersTableProps) {
  const [retailers, setRetailers] = useState(initialRetailers);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRetailers(initialRetailers);
  }, [initialRetailers]);

  // NOTE: We are client-side filtering here for simplicity since list is likely small (< 100)

  // Derived state for filtering
  const filteredRetailers = retailers.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.country_code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setRetailers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !currentStatus } : r)),
    );

    const res = await toggleRetailerStatus(id, currentStatus);
    if (res.success) {
      toast.success("Status updated");
    } else {
      // Revert on failure
      setRetailers((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: currentStatus } : r)),
      );
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search retailers..."
          className="w-[300px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="text-sm text-muted-foreground">
          {filteredRetailers.length} retailers
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRetailers.map((retailer) => (
              <TableRow key={retailer.id}>
                <TableCell>
                  {retailer.logo_url ? (
                    <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted p-1">
                      <img
                        src={retailer.logo_url}
                        alt={retailer.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {retailer.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{retailer.name}</div>
                </TableCell>
                <TableCell>
                  {retailer.base_url ? (
                    <a
                      href={retailer.base_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <LinkIcon className="mr-1 h-3 w-3" />
                      Link
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{retailer.country_code}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={retailer.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleStatus(retailer.id, !checked)
                    } // toggle expects current status, logic handled there
                  />
                </TableCell>
                <TableCell className="text-right">
                  <RetailerDialog retailer={retailer}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </RetailerDialog>
                </TableCell>
              </TableRow>
            ))}
            {filteredRetailers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No retailers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
