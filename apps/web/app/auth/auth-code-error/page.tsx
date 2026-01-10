import React from 'react'
import Link from 'next/link'
import { Button } from '@lila/ui'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Login Failed</CardTitle>
          <CardDescription>
            We encountered an issue verifying your login link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            <p>This can happen if:</p>
            <ul className="list-disc text-left pl-6 mt-2 space-y-1">
              <li>The link has expired</li>
              <li>The link has already been used</li>
              <li>You opened the link in a different browser</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button asChild className="w-full">
                <Link href="/login">Try Again</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
