"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, Upload, X, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { createProduct, updateProduct, getSignedUploadUrl } from "@/app/admin/products/actions"
import { MultiSelectIngredients } from "@/components/admin/multi-select-ingredients"
import { MultiSelectString } from "@/components/admin/multi-select-string"
import { Retailer } from "@/lib/types"

// Known Values
const KNOWN_BENEFITS = [
    "Hydrating", "Barrier Repair", "Scar Healing", "Anti-Aging", 
    "Brightening", "Redness Reducing", "Dark Spots", "Reduces Large Pores", 
    "Good For Oily Skin", "Acne Fighting", "Skin Texture", "Reduces Irritation"
]

const KNOWN_CONCERNS = [
    "May Worsen Rosacea", "May Trigger Acne", "May Worsen Eczema", 
    "May Worsen Oily Skin", "May Worsen Dryness", "May Worsen Irritation"
]

const KNOWN_ATTRIBUTES = [
    "Alcohol-free", "EU-allergen-free", "Fungal-acne-safe", "Sulfate-free", 
    "Cruelty-free", "Reef-safe", "Silicone-free", "Fragrance-free", 
    "Paraben-free", "Vegan", "Oil-free"
]

// Schema
const purchaseOptionSchema = z.object({
    id: z.string().optional(),
    retailerId: z.string().min(1, "Retailer is required"),
    url: z.string().url("Must be a valid URL"),
    price: z.coerce.number().optional(),
    currency: z.string().default("USD"),
    priority: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
})

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    brand: z.string().min(1, "Brand is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    review_count: z.coerce.number().int().min(0).optional(),
    attributes: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    active_ingredients: z.array(z.string()).optional(),
    concerns: z.array(z.string()).optional(),
    purchaseOptions: z.array(purchaseOptionSchema).optional(),
})

interface Product {
    product_slug: string
    name: string
    brand: string
    category: string
    description?: string
    image_url?: string
    rating?: number
    review_count?: number
    attributes?: string[]
    benefits?: string[]
    active_ingredients?: string[]
    concerns?: string[]
    // We expect this to be populated if we edit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product_purchase_options?: any[] 
}

interface ProductDialogProps {
    product?: Product
    retailers: Retailer[]
    children?: React.ReactNode
    onOpenChange?: (open: boolean) => void
}

export function ProductDialog({ product, retailers, children, onOpenChange }: ProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null)

    const isEdit = !!product

    // Transform DB options to Form options
    const defaultOptions = product?.product_purchase_options?.map(opt => ({
        id: opt.id,
        retailerId: opt.retailer_id,
        url: opt.url,
        price: opt.price,
        currency: opt.currency || "USD",
        priority: opt.priority || 0,
        isActive: opt.is_active,
    })) || []

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: product?.name || "",
            brand: product?.brand || "",
            category: product?.category || "",
            description: product?.description || "",
            rating: product?.rating || 4.5,
            review_count: product?.review_count || 0,
            attributes: product?.attributes || [],
            benefits: product?.benefits || [],
            active_ingredients: product?.active_ingredients || [],
            concerns: product?.concerns || [],
            purchaseOptions: defaultOptions,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "purchaseOptions",
    })

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            if (!isEdit) {
                 form.reset()
                 setSelectedFile(null)
                 setPreviewUrl(null)
            }
        }
        onOpenChange?.(newOpen)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            let finalImageUrl = product?.image_url

            if (selectedFile) {
                const tempSlug = `${values.brand}-${values.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                const ext = selectedFile.name.split(".").pop()
                const fileName = `${tempSlug}.${ext}`

                const signResult = await getSignedUploadUrl(fileName, selectedFile.type)

                if ('error' in signResult) {
                    toast.error("Failed to prepare upload")
                    setLoading(false)
                    return
                }

                const { signedUrl, publicUrl } = signResult

                if (!signedUrl) {
                    toast.error("Failed to prepare upload")
                    setLoading(false)
                    return
                }

                const uploadRes = await fetch(signedUrl, {
                    method: "PUT",
                    body: selectedFile,
                    headers: { "Content-Type": selectedFile.type },
                })

                if (!uploadRes.ok) {
                    toast.error("Failed to upload image")
                    setLoading(false)
                    return
                }

                finalImageUrl = publicUrl
            }

            const formData = new FormData()
            formData.append("name", values.name)
            formData.append("brand", values.brand)
            formData.append("category", values.category)
            if (values.description) formData.append("description", values.description)
            if (finalImageUrl) formData.append("imageUrl", finalImageUrl)
            
            if (values.rating !== undefined) formData.append("rating", String(values.rating))
            if (values.review_count !== undefined) formData.append("review_count", String(values.review_count))
            
            if (values.attributes?.length) formData.append("attributes", values.attributes.join(", "))
            if (values.benefits?.length) formData.append("benefits", values.benefits.join(", "))
            if (values.active_ingredients?.length) formData.append("active_ingredients", values.active_ingredients.join(", "))
            if (values.concerns?.length) formData.append("concerns", values.concerns.join(", "))

            // Append purchase options as JSON string
            if (values.purchaseOptions?.length) {
                formData.append("purchaseOptions", JSON.stringify(values.purchaseOptions))
            }

            let result
            if (isEdit && product?.product_slug) {
                formData.append("productSlug", product.product_slug)
                result = await updateProduct({ success: false, message: "" }, formData)
            } else {
                result = await createProduct({ success: false, message: "" }, formData)
            }

            if (result.success) {
                toast.success(result.message)
                handleOpenChange(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Make changes to the product details."
                            : "Add a new product to the database."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CeraVe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Moisturizing Cream" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Moisturizer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="rating"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rating</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" min="0" max="5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="review_count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reviews</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <FormLabel>Product Image</FormLabel>
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewUrl(null)
                                                setSelectedFile(null)
                                            }}
                                            className="absolute right-0 top-0 bg-black/50 p-0.5 text-white hover:bg-black/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed bg-muted/50">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Product details..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {/* Additional Details */}
                        <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                            <h3 className="font-semibold text-sm">Additional Details</h3>
                            <FormField
                                control={form.control}
                                name="attributes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Attributes ({KNOWN_ATTRIBUTES.length})</FormLabel>
                                        <FormControl>
                                            <MultiSelectString
                                                value={field.value || []}
                                                onChange={field.onChange}
                                                options={KNOWN_ATTRIBUTES}
                                                placeholder="Select attributes..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem className="flex flex-col gap-2">
                                     <FormLabel>Active Ingredients</FormLabel>
                                     <FormControl>
                                        <MultiSelectIngredients 
                                            value={form.watch("active_ingredients") || []}
                                            onChange={(val) => form.setValue("active_ingredients", val)}
                                        />
                                     </FormControl>
                                     <FormMessage />
                                </FormItem>
                                <FormField
                                    control={form.control}
                                    name="benefits"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Benefits</FormLabel>
                                            <FormControl>
                                                <MultiSelectString
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                    options={KNOWN_BENEFITS}
                                                    placeholder="Select benefits..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="concerns"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Concerns</FormLabel>
                                        <FormControl>
                                            <MultiSelectString
                                                value={field.value || []}
                                                onChange={field.onChange}
                                                options={KNOWN_CONCERNS}
                                                placeholder="Select concerns..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Purchase Options / Affiliate Links */}
                        <div className="space-y-4 rounded-md border p-4 bg-blue-50/50 border-blue-100">
                             <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-blue-900">Purchase Options (Affiliate)</h3>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => append({ retailerId: "", url: "", price: 0, priority: 0, isActive: true, currency: "USD" })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Link
                                </Button>
                             </div>
                             
                             <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-2 rounded bg-white border">
                                        <FormField
                                            control={form.control}
                                            name={`purchaseOptions.${index}.retailerId`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-3">
                                                    <FormLabel className="text-xs">Retailer</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {retailers.map(r => (
                                                                <SelectItem key={r.id} value={r.id}>{r.name} ({r.country_code})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`purchaseOptions.${index}.url`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-5">
                                                    <FormLabel className="text-xs">URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} className="h-8" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`purchaseOptions.${index}.priority`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel className="text-xs">Priority</FormLabel>
                                                    <FormControl>
                                                         <Input type="number" {...field} className="h-8" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`purchaseOptions.${index}.isActive`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-1 flex flex-col items-center justify-center pt-6">
                                                     <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                     </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="col-span-1 flex justify-end pt-6">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => remove(index)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <div className="text-center text-xs text-muted-foreground p-2">
                                        No purchase options added.
                                    </div>
                                )}
                             </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Save Changes" : "Create Product"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
