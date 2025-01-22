"use client"

import { useState } from "react"
import { ArrowLeft, Lock, Shield, Smartphone, Key, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-toastify"

export default function SecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement password change logic here
    toast.success("Password changed successfully!")
  }

  const handleEnableTwoFactor = () => {
    // Implement two-factor authentication logic here
    toast.success("Two-factor authentication enabled!")
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="container max-w-4xl py-6 md:py-12 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account security and authentication options.</p>
        </div>

        <div className="space-y-8">
          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password to keep it secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">Use an authenticator app to generate one-time codes.</p>
                </div>
                <Switch onCheckedChange={handleEnableTwoFactor} />
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  Generate backup codes to use when you don't have access to your authenticator app.
                </p>
                <Button variant="outline">Generate Backup Codes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Login History Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Login History
              </CardTitle>
              <CardDescription>Review your recent account login activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { device: "Windows PC", location: "New York, USA", time: "2 hours ago" },
                  { device: "iPhone 12", location: "Los Angeles, USA", time: "1 day ago" },
                  { device: "MacBook Pro", location: "London, UK", time: "3 days ago" },
                ].map((login, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{login.device}</p>
                      <p className="text-xs text-muted-foreground">{login.location}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{login.time}</p>
                  </div>
                ))}
              </div>
              <Button variant="link" className="mt-4 p-0">
                View Full Login History
              </Button>
            </CardContent>
          </Card>

          {/* Connected Devices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Connected Devices
              </CardTitle>
              <CardDescription>Manage devices connected to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "iPhone 12", lastActive: "Active now" },
                  { name: "MacBook Pro", lastActive: "2 hours ago" },
                  { name: "iPad Air", lastActive: "3 days ago" },
                ].map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.lastActive}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

