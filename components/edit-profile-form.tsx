"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface EditProfileFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditProfileForm({ onSuccess, onCancel }: EditProfileFormProps) {
  const { user, login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validate new password if provided
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("Az új jelszavak nem egyeznek")
      setIsLoading(false)
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Az új jelszónak legalább 6 karakter hosszúnak kell lennie")
      setIsLoading(false)
      return
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      }

      const token = localStorage.getItem('auth_token')
      
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        // Update the auth context with new user data
        const token = localStorage.getItem('auth_token')
        if (token) {
          login(token, data.user)
        }
        setSuccess("Profil sikeresen frissítve!")
        onSuccess?.()
      } else {
        setError(data.message || "Nem sikerült a profil frissítése")
      }
    } catch (error) {
      console.error("Update error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil szerkesztése</CardTitle>
        <CardDescription>
          Frissítse személyes adatait
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Teljes név</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="text-sm lg:text-base"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="text-sm lg:text-base"
              required
            />
          </div>

          <div>
            <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              className="text-sm lg:text-base"
              placeholder="Adja meg a jelenlegi jelszót a jelszó megváltoztatásához"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">Új jelszó</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="text-sm lg:text-base"
              placeholder="Hagyja üresen a jelenlegi jelszó megtartásához"
            />
          </div>

          {formData.newPassword && (
            <div>
              <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="text-sm lg:text-base"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Frissítés..." : "Profil frissítése"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Mégse
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
