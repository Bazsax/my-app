"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Pen, Save, X, CheckIcon } from "lucide-react"
import * as SelectPrimitive from "@radix-ui/react-select"

interface AddTransactionFormProps {
  type: 'expense' | 'income'
  onSuccess?: () => void
}

export function AddTransactionForm({ type, onSuccess }: AddTransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Predefined category data structure
  const predefinedIncomeCategories = [
    { value: 'Fizetés', label: 'Fizetés' },
    { value: 'Egyéb bevétel', label: 'Egyéb bevétel' }
  ]
  
  const predefinedExpenseCategories = {
    'Vásárlások': [],
    'Számlák': ['Bérleti díj', 'Telefon számla', 'Közlekedési számla', 'Háztartási számla'],
    'Hiteltörlesztések': ['Lakás', 'Autó', 'Tanulmány'],
    'Szórakozás': ['Étterem', 'Buli', 'Jegy', 'Impulzus vásárlás']
  }

  // State for custom categories
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubcategories, setCustomSubcategories] = useState<{[key: string]: string[]}>({})
  const [newCategory, setNewCategory] = useState("")
  const [newSubcategory, setNewSubcategory] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubcategory, setShowAddSubcategory] = useState(false)
  
  // State for editing categories
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  
  // State for editing subcategories
  const [editingSubcategory, setEditingSubcategory] = useState<{category: string, subcategory: string} | null>(null)
  const [editSubcategoryName, setEditSubcategoryName] = useState("")

  // Combined categories (predefined + custom)
  const incomeCategories = [...predefinedIncomeCategories, ...customCategories.map(cat => ({ value: cat, label: cat }))]
  
  // Merge predefined and custom subcategories properly
  const expenseCategories = Object.keys(predefinedExpenseCategories).reduce((acc, category) => {
    acc[category] = [
      ...predefinedExpenseCategories[category as keyof typeof predefinedExpenseCategories],
      ...(customSubcategories[category] || [])
    ]
    return acc
  }, {} as { [key: string]: string[] })
  
  // Add custom categories that don't exist in predefined
  Object.keys(customSubcategories).forEach(category => {
    if (!expenseCategories[category]) {
      expenseCategories[category] = customSubcategories[category]
    }
  })
  
  // Get all expense category names (predefined + custom)
  const allExpenseCategories = Object.keys(expenseCategories)
  
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
    subcategory: "",
    transactionType: "one-time" as "one-time" | "recurring" | "timeline",
    startDate: "",
    endDate: "",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    time: ""
  })

  // Update time when dialog opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
      setFormData(prev => ({
        ...prev,
        time: currentTime
      }))
    }
  }, [isOpen])

  // Load custom categories
  const loadCustomCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`/api/categories?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (type === 'income') {
          setCustomCategories(data.customCategories || [])
        } else {
          // For expense, add custom categories to customSubcategories object
          const subcatObj: {[key: string]: string[]} = {}
          
          // Add custom categories as empty subcategory objects
          data.customCategories?.forEach((categoryName: string) => {
            subcatObj[categoryName] = []
          })
          
          // Add existing subcategories
          data.customSubcategories?.forEach((item: any) => {
            if (!subcatObj[item.category_name]) {
              subcatObj[item.category_name] = []
            }
            subcatObj[item.category_name].push(item.subcategory_name)
          })
          
          setCustomSubcategories(subcatObj)
        }
      }
    } catch (error) {
      console.error('Error loading custom categories:', error)
    }
  }

  useEffect(() => {
    loadCustomCategories()
  }, [type])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          type: type
        })
      })

      if (response.ok) {
        const categoryName = newCategory.trim()
        
        if (type === 'income') {
          // For income, add to customCategories array
          setCustomCategories(prev => [...prev, categoryName])
        } else {
          // For expense, add to customSubcategories object as a new category with empty subcategories
          setCustomSubcategories(prev => ({
            ...prev,
            [categoryName]: []
          }))
        }
        
        setFormData(prev => ({ ...prev, category: categoryName }))
        setNewCategory("")
        setShowAddCategory(false)
      }
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !formData.category) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: formData.category,
          subcategoryName: newSubcategory.trim(),
          type: type
        })
      })

      if (response.ok) {
        const subcategoryName = newSubcategory.trim()
        setCustomSubcategories(prev => ({
          ...prev,
          [formData.category]: [...(prev[formData.category] || []), subcategoryName]
        }))
        setFormData(prev => ({ ...prev, subcategory: subcategoryName }))
        setNewSubcategory("")
        setShowAddSubcategory(false)
      }
    } catch (error) {
      console.error('Error adding subcategory:', error)
    }
  }

  const handleDeleteCategory = async (categoryName: string) => {
    if (!confirm(`Biztosan törölni szeretné a "${categoryName}" kategóriát? Ez a művelet nem vonható vissza.`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`/api/categories?name=${encodeURIComponent(categoryName)}&type=${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        if (type === 'income') {
          setCustomCategories(prev => prev.filter(cat => cat !== categoryName))
        } else {
          setCustomSubcategories(prev => {
            const newSubcategories = { ...prev }
            delete newSubcategories[categoryName]
            return newSubcategories
          })
        }
        
        // If the deleted category was selected, reset to default
        if (formData.category === categoryName) {
          setFormData(prev => ({ 
            ...prev, 
            category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
            subcategory: ""
          }))
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Hálózati hiba történt a kategória törlése során.')
    }
  }

  const handleDeleteSubcategory = async (categoryName: string, subcategoryName: string) => {
    if (!confirm(`Biztosan törölni szeretné a "${subcategoryName}" alkategóriát? Ez a művelet nem vonható vissza.`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`/api/subcategories?categoryName=${encodeURIComponent(categoryName)}&subcategoryName=${encodeURIComponent(subcategoryName)}&type=${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setCustomSubcategories(prev => ({
          ...prev,
          [categoryName]: prev[categoryName]?.filter(sub => sub !== subcategoryName) || []
        }))
        
        // If the deleted subcategory was selected, clear it
        if (formData.subcategory === subcategoryName) {
          setFormData(prev => ({ ...prev, subcategory: "" }))
        }
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
    }
  }

  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName)
    setEditCategoryName(categoryName)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldName: editingCategory,
          newName: editCategoryName.trim(),
          type: type
        })
      })

      if (response.ok) {
        if (type === 'income') {
          setCustomCategories(prev => prev.map(cat => cat === editingCategory ? editCategoryName.trim() : cat))
        } else {
          setCustomSubcategories(prev => {
            const newSubcategories = { ...prev }
            if (newSubcategories[editingCategory]) {
              newSubcategories[editCategoryName.trim()] = newSubcategories[editingCategory]
              delete newSubcategories[editingCategory]
            }
            return newSubcategories
          })
        }
        
        // If the edited category was selected, update it
        if (formData.category === editingCategory) {
          setFormData(prev => ({ ...prev, category: editCategoryName.trim() }))
        }
        
        setEditingCategory(null)
        setEditCategoryName("")
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditCategoryName("")
  }

  const handleEditSubcategory = (category: string, subcategory: string) => {
    setEditingSubcategory({ category, subcategory })
    setEditSubcategoryName(subcategory)
  }

  const handleSaveSubcategory = async () => {
    if (!editingSubcategory || !editSubcategoryName.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/subcategories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: editingSubcategory.category,
          oldSubcategoryName: editingSubcategory.subcategory,
          newSubcategoryName: editSubcategoryName.trim(),
          type: type
        })
      })

      if (response.ok) {
        // Update local state
        setCustomSubcategories(prev => {
          const newSubcategories = { ...prev }
          if (newSubcategories[editingSubcategory.category]) {
            const index = newSubcategories[editingSubcategory.category].indexOf(editingSubcategory.subcategory)
            if (index !== -1) {
              newSubcategories[editingSubcategory.category][index] = editSubcategoryName.trim()
            }
          }
          return newSubcategories
        })
        
        // If the edited subcategory was selected, update it
        if (formData.subcategory === editingSubcategory.subcategory) {
          setFormData(prev => ({ ...prev, subcategory: editSubcategoryName.trim() }))
        }
        
        setEditingSubcategory(null)
        setEditSubcategoryName("")
      }
    } catch (error) {
      console.error('Error updating subcategory:', error)
    }
  }

  const handleCancelEditSubcategory = () => {
    setEditingSubcategory(null)
    setEditSubcategoryName("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!formData.title || !formData.amount || !formData.transactionType) {
      setError("A cím, összeg és tranzakció típusa kötelező")
      setIsLoading(false)
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Kérjük, adjon meg érvényes összeget")
      setIsLoading(false)
      return
    }

    // Validate timeline dates if timeline is selected
    if (formData.transactionType === "timeline") {
      if (!formData.startDate || !formData.endDate) {
        setError("A kezdő és befejező dátum kötelező az idővonal tranzakciókhoz")
        setIsLoading(false)
        return
      }
      
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError("A befejező dátum a kezdő dátum után kell legyen")
        setIsLoading(false)
        return
      }
    }

    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch("/api/transactions/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: amount,
          type: type,
          date: new Date().toISOString().split('T')[0], // Today's date
          time: formData.time || null,
          transactionType: formData.transactionType,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          category: formData.category,
          subcategory: formData.subcategory
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${type === 'expense' ? 'Kiadás' : 'Bevétel'} sikeresen hozzáadva!`)
        setFormData({
          title: "",
          amount: "",
          description: "",
          category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
          subcategory: "",
          transactionType: "one-time",
          startDate: "",
          endDate: "",
          frequency: "monthly",
          time: ""
        })
        // Reload custom categories to ensure they persist
        loadCustomCategories()
        onSuccess?.()
        setTimeout(() => {
          setIsOpen(false)
          setSuccess("")
        }, 1500)
      } else {
        setError(data.message || "Nem sikerült a tranzakció hozzáadása")
      }
    } catch (error) {
      console.error("Add transaction error:", error)
        setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + {type === 'expense' ? 'Kiadás' : 'Bevétel'} hozzáadása
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{type === 'expense' ? 'Kiadás' : 'Bevétel'} hozzáadása</DialogTitle>
          <DialogDescription>
            Adja meg a {type === 'expense' ? 'kiadás' : 'bevétel'} részleteit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Cím *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder={type === 'expense' ? 'pl. Irodai eszközök' : 'pl. Fizetés'}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Összeg *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="transactionType">Tranzakció típusa *</Label>
            <Select
              value={formData.transactionType}
              onValueChange={(value: "one-time" | "recurring" | "timeline") => 
                setFormData(prev => ({ ...prev, transactionType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Válassza ki a tranzakció típusát" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">
                  {type === 'income' 
                    ? 'Egyszeri (pl. jutalom, prémium)'
                    : 'Egyszeri (pl. okostelefon vásárlás)'
                  }
                </SelectItem>
                <SelectItem value="recurring">
                  {type === 'income' 
                    ? 'Ismétlődő (pl. havi fizetés)'
                    : 'Ismétlődő (pl. előfizetések)'
                  }
                </SelectItem>
                <SelectItem value="timeline">
                  Idővonal beállítása (pl. meghatározott időszak)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.transactionType === "recurring" && (
            <div>
              <Label htmlFor="frequency">Gyakoriság</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => 
                  setFormData(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassza ki a gyakoriságot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Napi</SelectItem>
                  <SelectItem value="weekly">Heti</SelectItem>
                  <SelectItem value="monthly">Havi</SelectItem>
                  <SelectItem value="yearly">Éves</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.transactionType === "timeline" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Kezdő dátum *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Befejező dátum *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Kategória *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  category: value,
                  subcategory: "",
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Válassza ki a kategóriát" />
              </SelectTrigger>
              <SelectContent>
                {type === 'income' ? (
                  incomeCategories.map((cat) => {
                    const isCustom = customCategories.includes(cat.value)
                    const isEditing = editingCategory === cat.value
                    return (
                      <div key={cat.value} className="relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1 p-2">
                            <Input
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 h-8 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory()}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveCategory()
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Mentés"
                            >
                              <Save className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelEdit()
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Mégse"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(cat.value)
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Kategória törlése"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <SelectItem value={cat.value}>
                              {cat.label}
                            </SelectItem>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditCategory(cat.value)
                                }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded z-10 cursor-pointer"
                                title="Kategória szerkesztése"
                              >
                                <Pen className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })
                ) : (
                  allExpenseCategories.map((cat) => {
                    const isPredefined = Object.keys(predefinedExpenseCategories).includes(cat)
                    const isCustom = Object.keys(customSubcategories).includes(cat) && !isPredefined
                    const isEditing = editingCategory === cat
                    return (
                      <div key={cat} className="relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1 p-2">
                            <Input
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 h-8 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory()}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveCategory()
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Mentés"
                            >
                              <Save className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelEdit()
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Mégse"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(cat)
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Kategória törlése"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <SelectItem value={cat}>
                              {cat}
                            </SelectItem>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditCategory(cat)
                                }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded z-10 cursor-pointer"
                                title="Kategória szerkesztése"
                              >
                                <Pen className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </SelectContent>
            </Select>
            
            {/* Add Category Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 text-muted-foreground hover:text-foreground border border-[#DAD9D4] dark:border-[#3E3E38]"
              onClick={() => setShowAddCategory(true)}
            >
              + Új kategória
            </Button>
            
            {/* Add Category Dialog */}
            {showAddCategory && (
              <div className="mt-2 p-3 border rounded-md bg-muted/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Új kategória neve"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button type="button" onClick={handleAddCategory} size="sm">
                    Hozzáadás
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)} size="sm">
                    Mégse
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Subcategory for expenses (except Vásárlások) */}
          {type === 'expense' && formData.category && formData.category !== 'Vásárlások' && (
            <div>
              <Label htmlFor="subcategory">Alkategória</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassza ki az alkategóriát" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories[formData.category as keyof typeof expenseCategories]?.map((subcat) => {
                    const predefinedSubcats = predefinedExpenseCategories[formData.category as keyof typeof predefinedExpenseCategories] as string[] || []
                    const isPredefined = predefinedSubcats.includes(subcat)
                    const isCustom = !isPredefined
                    const isEditing = editingSubcategory?.category === formData.category && editingSubcategory?.subcategory === subcat
                    
                    return (
                      <div key={subcat} className="relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1 p-2">
                            <Input
                              value={editSubcategoryName}
                              onChange={(e) => setEditSubcategoryName(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <button onClick={handleSaveSubcategory} title="Mentés" className="p-1 hover:bg-muted rounded cursor-pointer"><Save className="h-3.5 w-3.5 text-muted-foreground" /></button>
                            <button onClick={handleCancelEditSubcategory} title="Mégse" className="p-1 hover:bg-muted rounded cursor-pointer"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                            <button onClick={() => handleDeleteSubcategory(formData.category, subcat)} title="Alkategória törlése" className="p-1 hover:bg-muted rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          </div>
                        ) : (
                          <>
                            <SelectItem value={subcat}>
                              {subcat}
                            </SelectItem>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditSubcategory(formData.category, subcat)
                                }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded z-10 cursor-pointer"
                                title="Alkategória szerkesztése"
                              >
                                <Pen className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Add Subcategory Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 text-muted-foreground hover:text-foreground border border-[#DAD9D4] dark:border-[#3E3E38]"
                onClick={() => setShowAddSubcategory(true)}
              >
                + Új alkategória
              </Button>
              
              {/* Add Subcategory Dialog */}
              {showAddSubcategory && (
                <div className="mt-2 p-3 border rounded-md bg-muted/50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Új alkategória neve"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                    />
                    <Button type="button" onClick={handleAddSubcategory} size="sm">
                      Hozzáadás
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddSubcategory(false)} size="sm">
                      Mégse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}


          <div>
            <Label htmlFor="time">Időpont (opcionális)</Label>
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              placeholder="HH:MM"
              pattern="[0-9]{2}:[0-9]{2}"
              title="Adja meg az időt HH:MM formátumban (pl. 14:30)"
            />
          </div>

          <div>
            <Label htmlFor="description">Leírás (opcionális)</Label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              placeholder="További részletek (opcionális)"
            />
          </div>

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
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Hozzáadás..." : `${type === 'expense' ? 'Kiadás' : 'Bevétel'} hozzáadása`}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Mégse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
