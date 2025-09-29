"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { IconEdit, IconTrash, IconColumns, IconFilter, IconDownload, IconSearch, IconRefresh, IconLock, IconLockOpen } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"

interface Transaction {
  id: number
  title: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  time?: string
  category?: string
  subcategory?: string
  transaction_type?: string
}

interface ColumnConfig {
  key: string
  label: string
  enabled: boolean
}

interface TransactionTableProps {
  dateRange?: DateRange | undefined
  refreshKey?: number
  onRefresh?: () => void
}

// Default column configuration with all columns enabled
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Kiválasztás', enabled: true },
  { key: 'title', label: 'Név', enabled: true },
  { key: 'type', label: 'Típus', enabled: true },
  { key: 'amount', label: 'Összeg', enabled: true },
  { key: 'transaction_type', label: 'Tranzakció típus', enabled: true },
  { key: 'date', label: 'Dátum', enabled: true },
  { key: 'time', label: 'Időpont', enabled: true },
  { key: 'category', label: 'Kategória', enabled: true },
  { key: 'subcategory', label: 'Alkategória', enabled: true },
  { key: 'description', label: 'Leírás', enabled: true },
  { key: 'actions', label: 'Műveletek', enabled: true },
]

// Predefined categories
const PREDEFINED_INCOME_CATEGORIES = ['Fizetés', 'Egyéb bevétel']
const PREDEFINED_EXPENSE_CATEGORIES = ['Vásárlások', 'Számlák', 'Hiteltörlesztések', 'Szórakozás']

export function TransactionTable({ dateRange, refreshKey, onRefresh }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  
  // Filter states
  const [filterType, setFilterType] = useState<string>("all")
  const [filterTransactionType, setFilterTransactionType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Category data
  const [customIncomeCategories, setCustomIncomeCategories] = useState<string[]>([])
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([])
  
  // Bulk operations state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set())
  
  // Inline editing state
  const [editingCategory, setEditingCategory] = useState<{transactionId: number, category: string} | null>(null)
  const [editCategoryValue, setEditCategoryValue] = useState("")
  const [editingSubcategory, setEditingSubcategory] = useState<{transactionId: number, subcategory: string} | null>(null)
  const [editSubcategoryValue, setEditSubcategoryValue] = useState("")
  
  const [selectAllChecked, setSelectAllChecked] = useState(false)
  
  // Combined categories
  const incomeCategories = [...PREDEFINED_INCOME_CATEGORIES, ...customIncomeCategories]
  const expenseCategories = [...PREDEFINED_EXPENSE_CATEGORIES, ...customExpenseCategories]
  const allCategories = [...incomeCategories, ...expenseCategories].sort()

  const fetchCustomCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Fetch income categories
      const incomeResponse = await fetch('/api/categories?type=income', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (incomeResponse.ok) {
        const incomeData = await incomeResponse.json()
        setCustomIncomeCategories(incomeData.customCategories || [])
      }

      // Fetch expense categories
      const expenseResponse = await fetch('/api/categories?type=expense', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (expenseResponse.ok) {
        const expenseData = await expenseResponse.json()
        setCustomExpenseCategories(expenseData.customCategories || [])
      }
    } catch (error) {
      console.error('Error fetching custom categories:', error)
    }
  }

  const fetchTransactions = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const token = localStorage.getItem('auth_token')
      
      let url = '/api/transactions'
      
      // Add date range parameters if provided
      if (dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd')
        const endDate = format(dateRange.to, 'yyyy-MM-dd')
        url += `?startDate=${startDate}&endDate=${endDate}`
      } else if (dateRange?.from) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd')
        url += `?startDate=${startDate}`
      } else if (dateRange?.to) {
        const endDate = format(dateRange.to, 'yyyy-MM-dd')
        url += `?endDate=${endDate}`
      }

      console.log("Fetching transactions from:", url)
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Transactions data:", data)
      
      if (data.transactions) {
        setTransactions(data.transactions)
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Nem sikerült a tranzakciók betöltése')
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomCategories()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [dateRange, refreshKey])

  // Clear selections when filters change
  useEffect(() => {
    setSelectedTransactions(new Set())
    setSelectAllChecked(false)
  }, [filterType, filterTransactionType, filterCategory, searchTerm, transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const toggleColumn = (columnKey: string) => {
    setColumnConfig(prevConfig =>
      prevConfig.map(column =>
        column.key === columnKey ? { ...column, enabled: !column.enabled } : column
      )
    )
  }

  // Bulk operations functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredIds = new Set(filteredTransactions.map(txn => txn.id))
      setSelectedTransactions(filteredIds)
    } else {
      setSelectedTransactions(new Set())
    }
    setSelectAllChecked(checked)
  }

  const handleSelectTransaction = (transactionId: number, checked: boolean) => {
    const newSelected = new Set(selectedTransactions)
    if (checked) {
      newSelected.add(transactionId)
    } else {
      newSelected.delete(transactionId)
    }
    setSelectedTransactions(newSelected)
    
    // Update select all checkbox state
    const filteredIds = filteredTransactions.map(txn => txn.id)
    const allSelected = filteredIds.every(id => newSelected.has(id))
    setSelectAllChecked(allSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Confirm bulk delete
      const confirmMessage = `Biztosan törölni szeretnéd a kiválasztott ${selectedTransactions.size} tranzakciót?`
      if (!window.confirm(confirmMessage)) return

      setIsLoading(true)
      
      // Delete transactions one by one
      const deletePromises = Array.from(selectedTransactions).map(async (id) => {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
        return response.ok
      })

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(Boolean).length

      if (successCount > 0) {
        toast.success(`${successCount} tranzakció sikeresen törölve`)
        await fetchTransactions() // Refresh the list
        onRefresh?.() // Trigger site-wide refresh
        setSelectedTransactions(new Set())
        setSelectAllChecked(false)
      } else {
        toast.error('Nem sikerült egyetlen tranzakció sem törölése')
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error('Hiba történt a tömeges törlés során')
    } finally {
      setIsLoading(false)
    }
  }

  // CSV Export functionality
  const exportToCSV = () => {
    // Determine which transactions to export
    let transactionsToExport = filteredTransactions
    
    // If there are selected transactions, export only those
    if (selectedTransactions.size > 0) {
      transactionsToExport = filteredTransactions.filter(txn => selectedTransactions.has(txn.id))
    }

    if (transactionsToExport.length === 0) {
      toast.error('Nincs exportálható tranzakció')
      return
    }

    try {
      // Create CSV headers
      const headers = [
        'ID',
        'Név',
        'Típus', 
        'Összeg',
        'Tranzakció típus',
        'Dátum',
        'Időpont',
        'Kategória',
        'Alkategória',
        'Leírás'
      ]

      // Create CSV rows
      const rows = transactionsToExport.map(transaction => [
        transaction.id.toString(),
        transaction.title || transaction.description || '',
        transaction.type === 'income' ? 'Bevétel' : 'Kiadás',
        transaction.amount.toString(),
        transaction.transaction_type === 'recurring' ? 'Ismétlődő' :
        transaction.transaction_type === 'timeline' ? 'Idővonal' : 'Egyszeri',
        format(new Date(transaction.date), "yyyy-MM-dd", { locale: hu }),
        transaction.time || '',
        transaction.category || '',
        transaction.subcategory || '',
        transaction.description || ''
      ])

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download file
      const filename = `tranzakciok_${format(new Date(), 'yyyy-MM-dd', { locale: hu })}.csv`
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      toast.success(`${transactionsToExport.length} tranzakció exportálva CSV fájlként`)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      toast.error('Hiba történt az exportálás során')
    }
  }

  // Filter transactions based on applied filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (filterType !== "all" && transaction.type !== filterType) {
      return false
    }

    // Filter by transaction type
    if (filterTransactionType !== "all" && transaction.transaction_type !== filterTransactionType) {
      return false
    }

    // Filter by category
    if (filterCategory !== "all" && transaction.category !== filterCategory) {
      return false
    }

    // Search filter
    if (searchTerm.length > 0) {
      const searchLower = searchTerm.toLowerCase()
      const titleMatch = transaction.title?.toLowerCase().includes(searchLower) || false
      const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower) || false
      
      if (!titleMatch && !descriptionMatch) {
        return false
      }
    }

    return true
  })

  const renderCell = (columnKey: string, transaction: Transaction) => {
    switch (columnKey) {
      case 'select':
        return (
          <TableCell key={columnKey}>
            <Checkbox
              checked={selectedTransactions.has(transaction.id)}
              onCheckedChange={(checked) => handleSelectTransaction(transaction.id, !!checked)}
            />
          </TableCell>
        )
      case 'title':
        return (
          <TableCell className="font-medium" key={columnKey}>
            {transaction.title || transaction.description}
          </TableCell>
        )
      case 'type':
        return (
          <TableCell key={columnKey}>
            <Badge 
              variant={transaction.type === 'income' ? 'default' : 'destructive'}
            >
              {transaction.type === 'income' ? 'Bevétel' : 'Kiadás'}
            </Badge>
          </TableCell>
        )
      case 'amount':
        return (
          <TableCell className="font-medium" key={columnKey}>
            <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </TableCell>
        )
      case 'transaction_type':
        return (
          <TableCell key={columnKey}>
            <Badge variant="outline">
              {transaction.transaction_type === 'recurring' ? 'Ismétlődő' : 
               transaction.transaction_type === 'timeline' ? 'Idővonal' : 'Egyszeri'}
            </Badge>
          </TableCell>
        )
      case 'date':
        return (
          <TableCell key={columnKey}>
            {format(new Date(transaction.date), "yyyy-MM-dd", { locale: hu })}
          </TableCell>
        )
      case 'time':
        return (
          <TableCell key={columnKey}>
            {transaction.time || '-'}
          </TableCell>
        )
      case 'category':
        const isEditing = editingCategory?.transactionId === transaction.id
        return (
          <TableCell key={columnKey}>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editCategoryValue}
                  onChange={(e) => setEditCategoryValue(e.target.value)}
                  onKeyDown={handleCategoryKeyPress}
                  className="w-full px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCategorySave}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mentés
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCategoryCancel}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mégse
                  </Button>
                </div>
              </div>
            ) : (
              (() => {
                const isCustomCategory = transaction.category && 
                  !PREDEFINED_INCOME_CATEGORIES.includes(transaction.category) && 
                  !PREDEFINED_EXPENSE_CATEGORIES.includes(transaction.category)
                
                return (
                  <span
                    onDoubleClick={() => handleCategoryDoubleClick(transaction.id, transaction.category || '')}
                    className={`px-2 py-1 rounded flex items-center gap-1 ${
                      isCustomCategory 
                        ? 'cursor-pointer hover:bg-muted' 
                        : 'cursor-default'
                    }`}
                    title={isCustomCategory ? "Dupla kattintás a szerkesztéshez" : "Előre definiált kategória - nem szerkeszthető"}
                  >
                    {isCustomCategory ? (
                      <IconLockOpen className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <IconLock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {transaction.category || '-'}
                  </span>
                )
              })()
            )}
          </TableCell>
        )
      case 'subcategory':
        const isEditingSubcategory = editingSubcategory?.transactionId === transaction.id
        return (
          <TableCell key={columnKey}>
            {isEditingSubcategory ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editSubcategoryValue}
                  onChange={(e) => setEditSubcategoryValue(e.target.value)}
                  onKeyDown={handleSubcategoryKeyPress}
                  className="w-full px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSubcategorySave}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mentés
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSubcategoryCancel}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mégse
                  </Button>
                </div>
              </div>
            ) : (
              (() => {
                const isCustomSubcategory = transaction.subcategory && 
                  !PREDEFINED_INCOME_CATEGORIES.includes(transaction.subcategory) && 
                  !PREDEFINED_EXPENSE_CATEGORIES.includes(transaction.subcategory)
                
                return (
                  <span
                    onDoubleClick={() => handleSubcategoryDoubleClick(transaction.id, transaction.subcategory || '')}
                    className={`px-2 py-1 rounded flex items-center gap-1 ${
                      isCustomSubcategory 
                        ? 'cursor-pointer hover:bg-muted' 
                        : 'cursor-default'
                    }`}
                    title={isCustomSubcategory ? "Dupla kattintás a szerkesztéshez" : "Előre definiált alkategória - nem szerkeszthető"}
                  >
                    {isCustomSubcategory ? (
                      <IconLockOpen className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <IconLock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {transaction.subcategory || '-'}
                  </span>
                )
              })()
            )}
          </TableCell>
        )
      case 'description':
        return (
          <TableCell key={columnKey}>
            {transaction.description || '-'}
          </TableCell>
        )
      case 'actions':
        return (
          <TableCell key={columnKey}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(transaction)}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(transaction.id)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )
      default:
        return null
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Tranzakció sikeresen törölve')
        fetchTransactions() // Refresh the list
        onRefresh?.() // Trigger site-wide refresh
      } else {
        toast.error('Nem sikerült a tranzakció törlése')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Nem sikerült a tranzakció törlése')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchTransactions() // Refresh the list
    onRefresh?.() // Trigger site-wide refresh
    setEditingTransaction(null)
    setIsEditDialogOpen(false)
  }

  const handleEditClose = () => {
    setEditingTransaction(null)
    setIsEditDialogOpen(false)
  }

  // Inline category editing handlers
  const handleCategoryDoubleClick = (transactionId: number, currentCategory: string) => {
    // Check if the category is custom (not predefined)
    const isCustomCategory = !PREDEFINED_INCOME_CATEGORIES.includes(currentCategory) && 
                            !PREDEFINED_EXPENSE_CATEGORIES.includes(currentCategory)
    
    if (!isCustomCategory) {
      toast.info('Csak egyedi kategóriák szerkeszthetők')
      return
    }
    
    setEditingCategory({ transactionId, category: currentCategory })
    setEditCategoryValue(currentCategory)
  }

  const handleCategorySave = async () => {
    console.log('handleCategorySave called', { editingCategory, editCategoryValue })
    if (!editingCategory || !editCategoryValue.trim()) {
      console.log('Early return: no editingCategory or empty value')
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No token found')
        return
      }

      // Get the current transaction data
      const currentTransaction = transactions.find(t => t.id === editingCategory.transactionId)
      if (!currentTransaction) {
        console.log('Current transaction not found')
        return
      }

      // First, update the category name in the database
      console.log('Making API call to update category name in database')
      const categoryResponse = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldName: editingCategory.category,
          newName: editCategoryValue.trim(),
          type: currentTransaction.type
        })
      })

      if (!categoryResponse.ok) {
        const errorText = await categoryResponse.text()
        console.log('Category API error response:', errorText)
        toast.error('Nem sikerült a kategória nevének frissítése')
        return
      }

      // Then update the transaction
      console.log('Making API call to update transaction')
      const transactionResponse = await fetch(`/api/transactions/${editingCategory.transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: currentTransaction.title,
          amount: currentTransaction.amount,
          description: currentTransaction.description,
          category: editCategoryValue.trim(),
          subcategory: currentTransaction.subcategory,
          type: currentTransaction.type,
          transactionType: currentTransaction.transaction_type,
          date: currentTransaction.date,
          time: currentTransaction.time
        })
      })

      console.log('Transaction API response:', transactionResponse.status, transactionResponse.ok)
      if (transactionResponse.ok) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t.id === editingCategory.transactionId 
            ? { ...t, category: editCategoryValue.trim() }
            : t
        ))
        
        setEditingCategory(null)
        setEditCategoryValue("")
        toast.success('Kategória frissítve')
      } else {
        const errorText = await transactionResponse.text()
        console.log('Transaction API error response:', errorText)
        toast.error('Nem sikerült a tranzakció frissítése')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Hiba történt a kategória frissítése során')
    }
  }

  const handleCategoryCancel = () => {
    setEditingCategory(null)
    setEditCategoryValue("")
  }

  const handleCategoryKeyPress = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key)
    if (e.key === 'Enter') {
      console.log('Enter key pressed, calling handleCategorySave')
      e.preventDefault()
      handleCategorySave()
    } else if (e.key === 'Escape') {
      console.log('Escape key pressed, calling handleCategoryCancel')
      handleCategoryCancel()
    }
  }

  // Inline subcategory editing handlers
  const handleSubcategoryDoubleClick = (transactionId: number, currentSubcategory: string) => {
    // Check if the subcategory is custom (not predefined)
    const isCustomSubcategory = !PREDEFINED_INCOME_CATEGORIES.includes(currentSubcategory) && 
                               !PREDEFINED_EXPENSE_CATEGORIES.includes(currentSubcategory)
    
    if (!isCustomSubcategory) {
      toast.info('Csak egyedi alkategóriák szerkeszthetők')
      return
    }
    
    setEditingSubcategory({ transactionId, subcategory: currentSubcategory })
    setEditSubcategoryValue(currentSubcategory)
  }

  const handleSubcategorySave = async () => {
    console.log('handleSubcategorySave called', { editingSubcategory, editSubcategoryValue })
    if (!editingSubcategory || !editSubcategoryValue.trim()) {
      console.log('Early return: no editingSubcategory or empty value')
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No token found')
        return
      }

      // Get the current transaction data
      const currentTransaction = transactions.find(t => t.id === editingSubcategory.transactionId)
      if (!currentTransaction) {
        console.log('Current transaction not found')
        return
      }

      // First, update the subcategory name in the database
      console.log('Making API call to update subcategory name in database')
      const subcategoryResponse = await fetch('/api/subcategories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: currentTransaction.category,
          oldSubcategoryName: editingSubcategory.subcategory,
          newSubcategoryName: editSubcategoryValue.trim(),
          type: currentTransaction.type
        })
      })

      if (!subcategoryResponse.ok) {
        const errorText = await subcategoryResponse.text()
        console.log('Subcategory API error response:', errorText)
        toast.error('Nem sikerült az alkategória nevének frissítése')
        return
      }

      // Then update the transaction
      console.log('Making API call to update transaction')
      const transactionResponse = await fetch(`/api/transactions/${editingSubcategory.transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: currentTransaction.title,
          amount: currentTransaction.amount,
          description: currentTransaction.description,
          category: currentTransaction.category,
          subcategory: editSubcategoryValue.trim(),
          type: currentTransaction.type,
          transactionType: currentTransaction.transaction_type,
          date: currentTransaction.date,
          time: currentTransaction.time
        })
      })

      console.log('Transaction API response:', transactionResponse.status, transactionResponse.ok)
      if (transactionResponse.ok) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t.id === editingSubcategory.transactionId 
            ? { ...t, subcategory: editSubcategoryValue.trim() }
            : t
        ))
        
        setEditingSubcategory(null)
        setEditSubcategoryValue("")
        toast.success('Alkategória frissítve')
      } else {
        const errorText = await transactionResponse.text()
        console.log('Transaction API error response:', errorText)
        toast.error('Nem sikerült a tranzakció frissítése')
      }
    } catch (error) {
      console.error('Error updating subcategory:', error)
      toast.error('Hiba történt az alkategória frissítése során')
    }
  }

  const handleSubcategoryCancel = () => {
    setEditingSubcategory(null)
    setEditSubcategoryValue("")
  }

  const handleSubcategoryKeyPress = (e: React.KeyboardEvent) => {
    console.log('Subcategory key pressed:', e.key)
    if (e.key === 'Enter') {
      console.log('Enter key pressed, calling handleSubcategorySave')
      e.preventDefault()
      handleSubcategorySave()
    } else if (e.key === 'Escape') {
      console.log('Escape key pressed, calling handleSubcategoryCancel')
      handleSubcategoryCancel()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tranzakciók</CardTitle>
          <CardDescription>Tranzakciók betöltése...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tranzakciók</CardTitle>
          <CardDescription>Hiba a tranzakciók betöltésekor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-3 py-2 lg:px-6 lg:py-3">
        <div className="space-y-3">
          <div>
            <CardTitle>Tranzakciók</CardTitle>
            <CardDescription>
              {filteredTransactions.length} / {transactions.length} tranzakció
              {(dateRange?.from && dateRange?.to) && (
                <span className="ml-2">
                  ({format(dateRange.from, "MMM dd", { locale: hu })} - {format(dateRange.to, "MMM dd, yyyy", { locale: hu })})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconColumns className="h-4 w-4 mr-0.3" />
                  Oszlopok
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {columnConfig.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={column.enabled}
                    onCheckedChange={() => toggleColumn(column.key)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh?.()}
              title="Tranzakciók frissítése"
            >
              <IconRefresh className="h-4 w-4 mr-0.3" />
              Frissítés
            </Button>
            
            {filteredTransactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <IconDownload className="h-4 w-4 mr-0.3" />
                CSV Export
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4" />
            <span className="text-sm font-medium">Szűrők:</span>
          </div>

          <div className="relative flex items-center">
            <IconSearch className="h-4 w-4 absolute left-2 text-muted-foreground" />
            <Input
              placeholder="Keresés cím/leírás alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-9 w-[250px] text-sm md:text-sm"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Típus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes típus</SelectItem>
              <SelectItem value="income">Bevétel</SelectItem>
              <SelectItem value="expense">Kiadás</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTransactionType} onValueChange={setFilterTransactionType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tranzakció típus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes</SelectItem>
              <SelectItem value="one-time">Egyszeri</SelectItem>
              <SelectItem value="recurring">Ismétlődő</SelectItem>
              <SelectItem value="timeline">Idővonal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategória" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes kategória</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterType !== "all" || filterTransactionType !== "all" || filterCategory !== "all" || searchTerm.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType("all")
                setFilterTransactionType("all")
                setFilterCategory("all")
                setSearchTerm("")
              }}
            >
              Szűrők törlése
            </Button>
          )}

          {selectedTransactions.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="h-9 px-3"
            >
              <IconTrash className="h-4 w-4 mr-0.3" />
              {isLoading ? 'Törlés...' : `${selectedTransactions.size} törlése`}
            </Button>
          )}

        </div>
      </CardHeader>
      <CardContent className="px-3 py-2 lg:px-6 lg:py-3">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Nincs tranzakció ebben az időszakban</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Nincs tranzakció a kiválasztott szűrőkkel</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnConfig
                    .filter(column => column.enabled)
                    .map((column) => (
                      <TableHead key={column.key} className={column.key === 'actions' ? "w-[100px]" : column.key === 'select' ? "w-[50px]" : ""}>
                        {column.key === 'select' ? (
                          <Checkbox
                            checked={selectAllChecked}
                            onCheckedChange={handleSelectAll}
                          />
                        ) : (
                          column.label
                        )}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    {columnConfig
                      .filter(column => column.enabled)
                      .map((column) => renderCell(column.key, transaction))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <EditTransactionDialog
        transaction={editingTransaction}
        isOpen={isEditDialogOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />
    </Card>
  )
}
