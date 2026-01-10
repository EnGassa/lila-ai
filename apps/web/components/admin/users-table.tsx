"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Search, Link as LinkIcon, Copy, LayoutDashboard } from "lucide-react"
import Link from "next/link"
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
import { Input } from "@lila/ui"
import { Button } from "@lila/ui"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { DeleteUserAlert } from "@/components/admin/delete-user-alert"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserAvatar } from "@/components/user-avatar"

type User = {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
    is_admin: boolean | null
    avatar_url: string | null
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
        const link = `${window.location.origin}/${userId}/upload`
        navigator.clipboard.writeText(link)
        toast.success("Upload link copied to clipboard")
    }

    return (
        <div className="space-y-4">
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
                        <TableRow className="border-b border-border hover:bg-transparent">
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
                                <TableRow key={user.id} className="border-b border-border/40">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar 
                                                userId={user.id} 
                                                displayName={user.full_name || "U"} 
                                                avatarUrl={user.avatar_url}
                                                className="h-9 w-9"
                                            />
                                            {user.full_name || "N/A"}
                                        </div>
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
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon-sm"
                                                            onClick={() => copyUploadLink(user.id)}
                                                        >
                                                            <LinkIcon className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Copy upload link</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon-sm"
                                                            asChild
                                                        >
                                                            <Link href={`/admin/users/${user.id}/dashboard`} target="_blank">
                                                                <LayoutDashboard className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>View dashboard</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <EditUserDialog user={user} />
                                            <DeleteUserAlert userId={user.id} />
                                        </div>
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
