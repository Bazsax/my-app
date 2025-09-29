"use client"

import * as React from "react"
import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Transaction {
  id: number
  title: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  time?: string
  category?: string
  transaction_type?: string
  subcategory?: string
  frequency?: string
  start_date?: string
  end_date?: string
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditTransactionDialog({ 
  transaction, 
  isOpen, 
  onClose, 
  onSuccess 
}: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Predefined categories
  const predefinedIncomeCategories = [
    { value: 'Fizetés', label: 'Fizetés' },
    { value: 'Egyéb bevétel', label: 'Egyéb bevétel' }
  ]
  
  const predefinedExpenseCategories = {
    'Vásárlások': [],
    'Számlák': ['bérleti díj', 'telefon', 'közlekedés', 'háztartási számlák'],
    'Hiteltörlesztések': ['Lakás', 'autó', 'tanulmány'],
    'Szórakozás': ['Éttermek', 'bulik', 'jegyek', 'impulzus vásárlások']
  }
  
  // Custom categories state
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubcategories, setCustomSubcategories] = useState<{[key: string]: string[]}>({})
  const [newCategory, setNewCategory] = useState("")
  const [newSubcategory, setNewSubcategory] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubcategory, setShowAddSubcategory] = useState(false)

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
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    date: "",
    time: "",
    category: "",
    subcategory: "",
    customPurchase: "",
    transactionType: "one-time" as "one-time" | "recurring" | "timeline",
    startDate: "",
    endDate: "",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly"
  })

  // Load custom categories when component mounts
  React.useEffect(() => {
    const loadCustomCategories = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const response = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setCustomCategories(data.categories || [])
          setCustomSubcategories(data.subcategories || {})
        }
      } catch (error) {
        console.error('Error loading custom categories:', error)
      }
    }
    loadCustomCategories()
  }, [])

  // Update form data when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || transaction.description || "",
        description: transaction.description || "",
        amount: transaction.amount.toString(),
        type: transaction.type,
        date: transaction.date,
        time: transaction.time || "",
        category: transaction.category || (transaction.type === 'expense' ? 'Vásárlások' : 'Fizetés'),
        subcategory: transaction.subcategory || "",
        customPurchase: "",
        transactionType: transaction.transaction_type as "one-time" | "recurring" | "timeline" || "one-time",
        startDate: transaction.start_date || "",
        endDate: transaction.end_date || "",
        frequency: transaction.frequency as "daily" | "weekly" | "monthly" | "yearly" || "monthly"
      })
    }
  }, [transaction])

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
          type: formData.type
        })
      })

      if (response.ok) {
        const categoryName = newCategory.trim()
        setCustomCategories(prev => [...prev, categoryName])
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
          type: formData.type
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Kérjük, adjon meg érvényes összeget")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Kérjük, adjon meg címet")
      return
    }

    // Validate timeline dates if timeline is selected
    if (formData.transactionType === "timeline") {
      if (!formData.startDate || !formData.endDate) {
        toast.error("A kezdő és befejező dátum kötelező az idővonal tranzakciókhoz")
        return
      }
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          amount: amount,
          description: formData.description,
          category: formData.type === 'expense' && formData.category === 'Vásárlások' ? formData.customPurchase : formData.category,
          subcategory: formData.subcategory,
          type: formData.type,
          time: formData.time || null,
          date: formData.date,
          transactionType: formData.transactionType,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Tranzakció sikeresen frissítve!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.message || "Nem sikerült a tranzakció frissítése")
      }
    } catch (error) {
      console.error("Update transaction error:", error)
      toast.error("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tranzakció szerkesztése</DialogTitle>
          <DialogDescription>
            Módosítsa a tranzakció részleteit az alábbiakban.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Név
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Leírás
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Opcionális"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Összeg
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Típus
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Bevétel</SelectItem>
                  <SelectItem value="expense">Kiadás</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionType" className="text-right">
              Tranzakció
              </Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value) => handleSelectChange("transactionType", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">Egyszeri</SelectItem>
                  <SelectItem value="recurring">Ismétlődő</SelectItem>
                  <SelectItem value="timeline">Idővonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategória
              </Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'income' ? (
                      incomeCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))
                    ) : (
                      allExpenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Add Category Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground border border-[#DAD9D4] dark:border-[#3E3E38]"
                  onClick={() => setShowAddCategory(true)}
                >
                  + Új kategória
                </Button>
                
                {/* Add Category Dialog */}
                {showAddCategory && (
                  <div className="p-3 border rounded-md bg-muted/50">
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
            </div>
            {formData.type === 'expense' && formData.category && formData.category !== 'Vásárlások' && expenseCategories[formData.category as keyof typeof expenseCategories]?.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory" className="text-right">
                  Alkategória
                </Label>
                <div className="col-span-3 space-y-2">
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => handleSelectChange("subcategory", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válassza ki az alkategóriát" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories[formData.category as keyof typeof expenseCategories]?.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Add Subcategory Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground border border-[#DAD9D4] dark:border-[#3E3E38]"
                    onClick={() => setShowAddSubcategory(true)}
                  >
                    + Új alkategória
                  </Button>
                  
                  {/* Add Subcategory Dialog */}
                  {showAddSubcategory && (
                    <div className="p-3 border rounded-md bg-muted/50">
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
              </div>
            )}
            {formData.type === 'expense' && formData.category === 'Vásárlások' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customPurchase" className="text-right">
                  Egyedi
                </Label>
                <Input
                  id="customPurchase"
                  name="customPurchase"
                  value={formData.customPurchase}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="Adja meg az egyedi vásárlást"
                />
              </div>
            )}
            {formData.transactionType === 'recurring' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Gyakoriság
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleSelectChange("frequency", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
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
            {formData.transactionType === 'timeline' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Kezdő dátum
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Befejezés dátum
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Jegyzés dátuma
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Időpont
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="col-span-3"
                placeholder="HH:MM"
                pattern="[0-9]{2}:[0-9]{2}"
                title="Adja meg az időt HH:MM formátumban (pl. 14:30)"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Mégse
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Mentés..." : "Változások mentése"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
