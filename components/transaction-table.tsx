"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { IconEdit, IconTrash, IconColumns, IconFilter, IconDownload, IconSearch } from "@tabler/icons-react"
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
        return (
          <TableCell key={columnKey}>
            {transaction.category || '-'}
          </TableCell>
        )
      case 'subcategory':
        return (
          <TableCell key={columnKey}>
            {transaction.subcategory || '-'}
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
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
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
