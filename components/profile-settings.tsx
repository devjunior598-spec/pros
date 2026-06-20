"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, User, Phone, Mail, Shield, Camera, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProfileSettingsProps {
    userId: string
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [bio, setBio] = useState("")
    const [address, setAddress] = useState("")
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error("Error fetching profile:", error)
            } else if (data) {
                setProfile(data)
                // Use full_name if available, fallback to name
                setName(data.full_name || data.name || "")
                setPhone(data.phone || "")
                setBio(data.bio || "")
                setAddress(data.address || "")
                setProfileImage(data.profile_image_url || null)
            }
            setLoading(false)
        }

        if (userId) {
            fetchProfile()
        }
    }, [userId])

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 3 * 1024 * 1024) {
                alert("Image size must be less than 3MB")
                return
            }
            setImageFile(file)
            setProfileImage(URL.createObjectURL(file))
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            let avatarUrl = profileImage

            // 1. Upload new image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${userId}-${Math.random()}.${fileExt}`
                const filePath = `avatars/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('profile_images')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('profile_images')
                    .getPublicUrl(filePath)

                avatarUrl = publicUrl
            }
            const { error } = await supabase
                .from('profiles')
                .update({
                    name,
                    full_name: name, // Ensure both fields are synced
                    phone,
                    bio,
                    address,
                    profile_image_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (error) throw error
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
        } catch (error: any) {
            console.error("Error updating profile:", error)
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                        <User className="mr-2 h-6 w-6 text-primary" />
                        Profile Settings
                    </CardTitle>
                    <CardDescription>Update your personal information and contact details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center mb-8 space-y-4">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                                <Camera className="h-4 w-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">{name || "User"}</h3>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile?.email || ""}
                                        disabled
                                        className="pl-10 bg-muted/30 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Read-only field</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Account Role</Label>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary" className="px-3 py-1 capitalize">
                                        <Shield className="mr-2 h-3 w-3" />
                                        {profile?.role}
                                    </Badge>
                                </div>
                            </div>

                            <hr className="my-2" />

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+234 ..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us a little about yourself..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter your full address"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-destructive/10 text-destructive border border-destructive/20'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" className="w-full md:w-auto" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
                    <CardDescription>Actions that cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
                        Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
