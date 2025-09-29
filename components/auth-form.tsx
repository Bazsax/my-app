"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"

interface AuthFormProps {
  className?: string
}

export function AuthForm({ className }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!isLogin && password !== confirmPassword) {
      setError("A jelszavak nem egyeznek")
      setIsLoading(false)
      return
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
      const body = isLogin 
        ? { email, password }
        : { email, password, name }

      console.log("Sending request to:", endpoint, body)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      console.log("Response:", response.status, data)

      if (response.ok) {
        // Use auth context to store user data
        login(data.token, data.user)
        
        // Redirect to home page
        router.push("/")
        router.refresh() // Force a refresh to update the auth state
      } else {
        setError(data.message || "Hiba történt")
      }
    } catch (error) {
      console.error("Auth error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isLogin ? "Üdvözöljük vissza" : "Fiók létrehozása"}
          </CardTitle>
          <CardDescription className="pb-4">
            {isLogin 
              ? "Adja meg a bejelentkezési adatait" 
              : "Adja meg az adatait új fiók létrehozásához"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {!isLogin && (
                <div className="grid gap-0">
                  <Label htmlFor="name">Teljes név</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Kovács András"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="grid gap-0">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-0">
                <div className="flex items-center">
                  <Label htmlFor="password">Jelszó</Label>
                  {isLogin && (
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Elfelejtette a jelszavát?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {!isLogin && (
                <div className="grid gap-0">
                  <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Betöltés..." : (isLogin ? "Bejelentkezés" : "Fiók létrehozása")}
              </Button>
            </div>
          </form>
          
          <div className="text-center text-sm mt-4">
            {isLogin ? "Nincs fiókja? " : "Már van fiókja? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setPassword("")
                setConfirmPassword("")
                setName("")
              }}
              className="underline underline-offset-4 hover:text-primary"
            >
              {isLogin ? "Regisztráció" : "Bejelentkezés"}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-muted-foreground text-center text-xs text-balance">
        A folytatással elfogadja a{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Szolgáltatási feltételeket
        </a>{" "}
        és a{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Adatvédelmi szabályzatot
        </a>.
      </div>
    </div>
  )
}
