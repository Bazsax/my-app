"use client"

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { EditProfileForm } from "@/components/edit-profile-form";

export default function User() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Felhasználói profil</h1>
            <p className="text-muted-foreground">
              Kezelje a felhasználói fiókját és beállításait
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={logout}>
              Kijelentkezés
            </Button>
          </div>
        </div>
        
        {isEditing ? (
          <EditProfileForm 
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {user && (
              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Fiók információk</h2>
                <div className="space-y-2 mb-4">
                  <p><span className="font-medium">Név:</span> {user.name}</p>
                  <p><span className="font-medium">E-mail:</span> {user.email}</p>
                  <p><span className="font-medium">Tagja:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-muted-foreground mb-4">
                  Frissítse személyes adatait és fiókbeállításait.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Profil szerkesztése
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}