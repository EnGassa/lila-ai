"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@lila/ui"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@lila/ui"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { updateUser } from "@/app/admin/actions"

type User = {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
    is_admin: boolean | null
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                "Save Changes"
            )}
        </Button>
    )
}

export function EditUserDialog({ user }: { user: User }) {
    const [open, setOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(user.is_admin === true)
    const router = useRouter()

    async function clientAction(formData: FormData) {
        setErrorMessage(null)
        const initialState = { success: false, message: "" }
        // Append userId since it's not an input field in the form but needed for the action
        formData.append("userId", user.id)

        const result = await updateUser(initialState, formData)

        if (result.success) {
            toast.success("User updated successfully")
            setOpen(false)
            router.refresh()
        } else {
            setErrorMessage(result.message)
            toast.error(result.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon-sm">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit user</span>
                            </Button>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent>
                        <p>Edit user</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Make changes to the user's profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <input type="hidden" name="isAdmin" value={isAdmin.toString()} />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            defaultValue={user.full_name || ""}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={user.email || ""}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={user.phone || ""}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isAdmin" className="text-right">
                            Role
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <Checkbox 
                                id="isAdmin" 
                                checked={isAdmin}
                                onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                            />
                            <label
                                htmlFor="isAdmin"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Grant Admin Access
                            </label>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="text-sm text-red-500 font-medium text-center">
                            {errorMessage}
                        </div>
                    )}

                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
