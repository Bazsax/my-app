"use client"

import { useState, useEffect } from "react"
import { IconEdit } from "@tabler/icons-react"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Transaction {
  id: string
  title: string
  amount: number
  description: string
  category: string
  subcategory?: string
  type: 'expense' | 'income'
  transaction_type: 'one-time' | 'recurring' | 'timeline'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date?: string
  end_date?: string
  date: string
  time?: string
}

interface EditTransactionFormProps {
  type: 'expense' | 'income'
  onSuccess?: () => void
}

export function EditTransactionForm({ type, onSuccess }: EditTransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  
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
    amount: "",
    description: "",
    category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
    subcategory: "",
    customPurchase: "",
    transactionType: "one-time" as "one-time" | "recurring" | "timeline",
    startDate: "",
    endDate: "",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    time: ""
  })

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

  // Load custom categories when component mounts
  useEffect(() => {
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
          setCustomCategories(data.categories || [])
          setCustomSubcategories(data.subcategories || {})
        }
      } catch (error) {
        console.error('Error loading custom categories:', error)
      }
    }
    loadCustomCategories()
  }, [type])

  // Fetch transactions when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTransactions()
    }
  }, [isOpen, type])

  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/transactions?type=${type}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      } else {
        setError("Nem sikerült a tranzakciók betöltése")
      }
    } catch (error) {
      console.error("Fetch transactions error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleTransactionSelect = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setSelectedTransaction(transaction)
      // For "Vásárlások" category, the actual purchase description is stored in the category field
      // and we need to set the category back to "Vásárlások" and customPurchase to the actual value
      const isCustomPurchase = !Object.keys(expenseCategories).includes(transaction.category) && 
                               !incomeCategories.some(cat => cat.value === transaction.category)
      
      setFormData({
        title: transaction.title,
        amount: transaction.amount.toString(),
        description: transaction.description || "",
        category: isCustomPurchase ? 'Vásárlások' : transaction.category,
        subcategory: transaction.subcategory || "",
        customPurchase: isCustomPurchase ? transaction.category : "",
        transactionType: transaction.transaction_type,
        startDate: transaction.start_date || "",
        endDate: transaction.end_date || "",
        frequency: transaction.frequency || "monthly",
        time: transaction.time || ""
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTransaction) return

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
      
      const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: amount,
          type: type,
          time: formData.time || null,
          transactionType: formData.transactionType,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          // For expenses, if category is Vásárlások, use customPurchase as the category
          category: type === 'expense' && formData.category === 'Vásárlások' ? formData.customPurchase : formData.category,
          subcategory: formData.subcategory
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${type === 'expense' ? 'Expense' : 'Income'} updated successfully!`)
        setSelectedTransaction(null)
        setFormData({
          title: "",
          amount: "",
          description: "",
          category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
          subcategory: "",
          customPurchase: "",
          transactionType: "one-time",
          startDate: "",
          endDate: "",
          frequency: "monthly",
          time: ""
        })
        onSuccess?.()
        setTimeout(() => {
          setIsOpen(false)
          setSuccess("")
        }, 1500)
      } else {
        setError(data.message || "Nem sikerült a tranzakció frissítése")
      }
    } catch (error) {
      console.error("Update transaction error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTransaction) return

    if (!confirm(`Are you sure you want to delete "${selectedTransaction.title}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${type === 'expense' ? 'Expense' : 'Income'} deleted successfully!`)
        setSelectedTransaction(null)
        setFormData({
          title: "",
          amount: "",
          description: "",
          category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
          subcategory: "",
          customPurchase: "",
          transactionType: "one-time",
          startDate: "",
          endDate: "",
          frequency: "monthly",
          time: ""
        })
        onSuccess?.()
        setTimeout(() => {
          setIsOpen(false)
          setSuccess("")
        }, 1500)
      } else {
        setError(data.message || "Nem sikerült a tranzakció törlése")
      }
    } catch (error) {
      console.error("Delete transaction error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconEdit className="h-4 w-4 mr-0.3" />
          Előző módosítása
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type === 'expense' ? 'Kiadás' : 'Bevétel'} szerkesztése</DialogTitle>
          <DialogDescription>
            Válasszon ki és módosítson egy meglévő {type === 'expense' ? 'kiadás' : 'bevétel'} tranzakciót.
          </DialogDescription>
        </DialogHeader>

        {!selectedTransaction ? (
          // Transaction selection step
          <div className="space-y-4">
            {loadingTransactions ? (
              <div className="text-center py-4">Tranzakciók betöltése...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nincs {type === 'expense' ? 'kiadás' : 'bevétel'} tranzakció.
              </div>
            ) : (
              <>
                <div>
                {/* <Label htmlFor="transactionSelect">Válassza ki a szerkesztendő tranzakciót</Label> */}
                  <Select onValueChange={handleTransactionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon egy tranzakciót" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactions.map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          {transaction.title} - {transaction.amount} Ft ({transaction.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        ) : (
          // Edit form step
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
                    Egyszeri (pl. okostelefon vásárlás)
                  </SelectItem>
                  <SelectItem value="recurring">
                    Ismétlődő (pl. jövedelem, előfizetések)
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
              <Label htmlFor="category">Kategória</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    category: value,
                    subcategory: "",
                    customPurchase: ""
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassza ki a kategóriát" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'income' ? (
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
            {type === 'expense' && formData.category && formData.category !== 'Vásárlások' && expenseCategories[formData.category as keyof typeof expenseCategories]?.length > 0 && (
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

            {/* Custom purchase input for Vásárlások category */}
            {type === 'expense' && formData.category === 'Vásárlások' && (
              <div>
                <Label htmlFor="customPurchase">Mit vásárolt?</Label>
                <Input
                  id="customPurchase"
                  name="customPurchase"
                  type="text"
                  value={formData.customPurchase}
                  onChange={handleChange}
                  placeholder="pl. Laptop, Élelmiszer, stb."
                />
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
              <Label htmlFor="description">Leírás</Label>
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

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Frissítés..." : `${type === 'expense' ? 'Kiadás' : 'Bevétel'} frissítése`}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3"
                >
                  {isDeleting ? "Törlés..." : "🗑️ Törlés"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setSelectedTransaction(null)
                  setFormData({
                    title: "",
                    amount: "",
                    description: "",
                    category: type === 'expense' ? 'Vásárlások' : 'Fizetés',
                    subcategory: "",
                    customPurchase: "",
                    transactionType: "one-time",
                    startDate: "",
                    endDate: "",
                    frequency: "monthly",
                    time: ""
                  })
                }} className="flex-1">
                  Vissza
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Mégse
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
