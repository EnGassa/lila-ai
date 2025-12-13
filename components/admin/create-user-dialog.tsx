"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser } from "@/app/admin/actions"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                </>
            ) : (
                "Create User"
            )}
        </Button>
    )
}

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    async function clientAction(formData: FormData) {
        // Reset error
        setErrorMessage(null)

        // Initial state for the action
        const initialState = { success: false, message: "" }

        // Call server action
        const result = await createUser(initialState, formData)

        if (result.success) {
            toast.success("User created successfully")
            setOpen(false)
            // Optional: Add logic here if we want to show the 'Upload Link' to the admin immediately
        } else {
            setErrorMessage(result.message)
            toast.error(result.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system. This will create an account and allow them to upload photos.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fullName" className="text-right">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Jane Doe"
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
                            placeholder="jane@example.com"
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
                            placeholder="+1234567890"
                            className="col-span-3"
                        />
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
