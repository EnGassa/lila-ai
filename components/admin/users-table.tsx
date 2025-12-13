"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Search, Link, Copy } from "lucide-react"
import { toast } from "sonner"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type User = {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
    is_admin: boolean | null
}

interface UsersTableProps {
    initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredUsers = initialUsers.filter((user) => {
        const searchLower = searchTerm.toLowerCase()
        return (
            (user.full_name?.toLowerCase().includes(searchLower) ?? false) ||
            (user.email?.toLowerCase().includes(searchLower) ?? false) ||
            (user.phone?.includes(searchLower) ?? false)
        )
    })

    const copyUploadLink = (userId: string) => {
        const link = `${window.location.origin}/${userId}/upload/new`
        navigator.clipboard.writeText(link)
        toast.success("Upload link copied to clipboard")
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                <CreateUserDialog />
            </div>
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
            <div className="rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-2 border-gray-500">
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-b-gray-300">
                                    <TableCell className="font-medium">
                                        {user.full_name || "N/A"}
                                    </TableCell>
                                    <TableCell>{user.email || "N/A"}</TableCell>
                                    <TableCell>{user.phone || "-"}</TableCell>
                                    <TableCell>
                                        {user.is_admin ? (
                                            <Badge variant="default">Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary">User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.created_at), "PPP")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyUploadLink(user.id)}
                                        >
                                            <Link className="mr-2 h-4 w-4" />
                                            Copy Upload Link
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
