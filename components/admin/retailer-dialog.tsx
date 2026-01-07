"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RetailerSchema } from "@/app/admin/products/schemas";
import { createRetailer, updateRetailer } from "@/app/admin/retailers/actions";
import { Retailer } from "@/lib/types";
import { COUNTRIES } from "@/lib/constants";

interface RetailerDialogProps {
  retailer?: Retailer;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function RetailerDialog({
  retailer,
  children,
  onOpenChange,
}: RetailerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!retailer;

  const form = useForm<z.infer<typeof RetailerSchema>>({
    resolver: zodResolver(RetailerSchema),
    defaultValues: {
      name: retailer?.name || "",
      baseUrl: retailer?.base_url || "",
      logoUrl: retailer?.logo_url || "",
      countryCode: retailer?.country_code || "Global",
      isActive: retailer ? retailer.is_active : true,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !isEdit) {
      form.reset();
    }
    onOpenChange?.(newOpen);
  };

  const onSubmit = async (values: z.infer<typeof RetailerSchema>) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.baseUrl) formData.append("baseUrl", values.baseUrl);
      if (values.logoUrl) formData.append("logoUrl", values.logoUrl);
      if (values.countryCode)
        formData.append("countryCode", values.countryCode);
      formData.append("isActive", String(values.isActive));

      let result;
      if (isEdit && retailer?.id) {
        formData.append("id", retailer.id);
        result = await updateRetailer(
          { success: false, message: "" },
          formData,
        );
      } else {
        result = await createRetailer(
          { success: false, message: "" },
          formData,
        );
      }

      if (result.success) {
        toast.success(result.message);
        handleOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Retailer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Retailer" : "Add Retailer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update retailer details."
              : "Add a new retailer partner."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Amazon, Sephora, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL (Home Page)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://.../logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Retailer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
