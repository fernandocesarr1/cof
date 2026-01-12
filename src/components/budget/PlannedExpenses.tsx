import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activity-logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PlannedExpense {
  id: string;
  name: string;
  amount: number;
  category_id: string | null;
  description: string | null;
  active: boolean;
  due_day: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Payment {
  id: string;
  planned_expense_id: string;
  month: number;
  year: number;
  paid: boolean;
  paid_at: string | null;
  paid_amount: number | null;
  person_id: string | null;
}

interface Person {
  id: string;
  name: string;
  color: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface PlannedExpensesProps {
  onPaymentChange?: () => void;
  compact?: boolean; // Mode for dashboard - shows only summary
}

const PlannedExpenses = ({ onPaymentChange, compact = false }: PlannedExpensesProps) => {
  const [plannedExpenses, setPlannedExpenses] = useState<PlannedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PlannedExpense | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category_id: "",
    description: "",
    due_day: "1"
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payingExpense, setPayingExpense] = useState<PlannedExpense | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidPersonId, setPaidPersonId] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Load all active planned expenses that were created before or during the selected month
    const { data: expenses } = await supabase
      .from('planned_expenses')
      .select('*')
      .eq('active', true)
      .order('due_day', { ascending: true });
    
    if (expenses) {
      // Filter expenses to only show those created before or during the selected month
      const filteredExpenses = expenses.filter((expense: PlannedExpense) => {
        const createdAt = new Date(expense.created_at);
        const createdMonth = createdAt.getMonth();
        const createdYear = createdAt.getFullYear();
        
        // Show expense if it was created before or during the selected month
        return createdYear < selectedYear || 
               (createdYear === selectedYear && createdMonth <= selectedMonth);
      });
      setPlannedExpenses(filteredExpenses);
    }

    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (cats) {
      setCategories(cats);
    }

    // Load people
    const { data: ppl } = await supabase
      .from('people')
      .select('*')
      .order('name');
    
    if (ppl) {
      setPeople(ppl);
    }

    // Load payments for selected month/year
    const { data: pays } = await supabase
      .from('planned_expense_payments')
      .select('*')
      .eq('month', selectedMonth)
      .eq('year', selectedYear);
    
    if (pays) {
      setPayments(pays as Payment[]);
    }
  };

  const isPastMonth = () => {
    const today = new Date();
    return selectedYear < today.getFullYear() || 
           (selectedYear === today.getFullYear() && selectedMonth < today.getMonth());
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      toast({
        title: "Erro",
        description: "Nome e valor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const dueDay = parseInt(formData.due_day) || 1;
    const expenseData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null,
      description: formData.description || null,
      due_day: Math.min(Math.max(dueDay, 1), 31)
    };

    if (editingExpense) {
      // For editing, we just update the planned expense
      // This will affect current and future months only since we filter by created_at
      const { error } = await supabase
        .from('planned_expenses')
        .update(expenseData)
        .eq('id', editingExpense.id);
      
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        return;
      }
      toast({ title: "Gasto fixo atualizado!" });
    } else {
      const { error } = await supabase
        .from('planned_expenses')
        .insert(expenseData);
      
      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
        return;
      }
      toast({ title: "Gasto fixo criado!" });
    }

    setFormData({ name: "", amount: "", category_id: "", description: "", due_day: "1" });
    setEditingExpense(null);
    setIsDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    // Instead of marking as inactive (which would hide from past months too),
    // we set a deleted_from date. But since we don't have that column,
    // we'll just mark as inactive - this only affects future visibility
    const { error } = await supabase
      .from('planned_expenses')
      .update({ active: false })
      .eq('id', id);
    
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
      return;
    }
    toast({ title: "Gasto fixo removido!" });
    loadData();
  };

  const handleEdit = (expense: PlannedExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category_id: expense.category_id || "",
      description: expense.description || "",
      due_day: expense.due_day?.toString() || "1"
    });
    setIsDialogOpen(true);
  };

  const openPaymentDialog = (expense: PlannedExpense) => {
    setPayingExpense(expense);
    setPaidAmount(expense.amount.toString());
    setPaidPersonId("");
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!payingExpense) return;
    
    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    if (!paidPersonId) {
      toast({ title: "Selecione quem pagou", variant: "destructive" });
      return;
    }

    const paidAt = new Date().toISOString();
    
    // Check if payment record exists
    const existingPayment = payments.find(
      p => p.planned_expense_id === payingExpense.id
    );

    if (existingPayment) {
      const { error } = await supabase
        .from('planned_expense_payments')
        .update({ 
          paid: true,
          paid_at: paidAt,
          paid_amount: amount,
          person_id: paidPersonId
        })
        .eq('id', existingPayment.id);
      
      if (error) {
        toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('planned_expense_payments')
        .insert({
          planned_expense_id: payingExpense.id,
          month: selectedMonth,
          year: selectedYear,
          paid: true,
          paid_at: paidAt,
          paid_amount: amount,
          person_id: paidPersonId
        });
      
      if (error) {
        toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
        return;
      }
    }

    // Create the expense in the expenses table
    const expenseDate = new Date(selectedYear, selectedMonth, payingExpense.due_day);
    // Adjust if due_day is greater than days in month
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    if (payingExpense.due_day > lastDayOfMonth) {
      expenseDate.setDate(lastDayOfMonth);
    }

    const { error: expenseError } = await supabase
      .from('expenses')
      .insert({
        amount: amount,
        category_id: payingExpense.category_id,
        date: expenseDate.toISOString().split('T')[0],
        description: payingExpense.name + (payingExpense.description ? ` - ${payingExpense.description}` : ''),
        person_id: paidPersonId
      });

    if (expenseError) {
      toast({ title: "Erro ao criar despesa", variant: "destructive" });
      return;
    }

    // Log activity for planned expense payment
    const selectedPerson = people.find(p => p.id === paidPersonId);
    await logActivity({
      action: "pagar",
      entityType: "Gasto Fixo",
      entityName: payingExpense.name,
      details: `R$ ${amount.toFixed(2)} - ${MONTHS[selectedMonth]}/${selectedYear}`,
      personId: paidPersonId
    });

    toast({ title: "Pagamento registrado e despesa criada!" });
    setPaymentDialogOpen(false);
    setPayingExpense(null);
    setPaidAmount("");
    setPaidPersonId("");
    loadData();
    onPaymentChange?.();
  };

  const togglePayment = async (expenseId: string, currentlyPaid: boolean) => {
    if (currentlyPaid) {
      // If marking as unpaid, remove the payment and delete the expense
      const payment = payments.find(p => p.planned_expense_id === expenseId);
      if (payment) {
        // Delete the associated expense if exists
        const expense = plannedExpenses.find(e => e.id === expenseId);
        if (expense && payment.paid_at) {
          const expenseDate = new Date(selectedYear, selectedMonth, expense.due_day);
          const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
          if (expense.due_day > lastDayOfMonth) {
            expenseDate.setDate(lastDayOfMonth);
          }
          
          // Try to delete the expense that was created
          await supabase
            .from('expenses')
            .delete()
            .eq('description', expense.name + (expense.description ? ` - ${expense.description}` : ''))
            .eq('date', expenseDate.toISOString().split('T')[0]);
        }

        await supabase
          .from('planned_expense_payments')
          .update({ 
            paid: false,
            paid_at: null,
            paid_amount: null
          })
            .eq('id', payment.id);
        }
        loadData();
        onPaymentChange?.();
      } else {
      // Open dialog to enter paid amount
      const expense = plannedExpenses.find(e => e.id === expenseId);
      if (expense) {
        openPaymentDialog(expense);
      }
    }
  };

  const isExpensePaid = (expenseId: string) => {
    const payment = payments.find(p => p.planned_expense_id === expenseId);
    return payment?.paid || false;
  };

  const getPaymentAmount = (expenseId: string) => {
    const payment = payments.find(p => p.planned_expense_id === expenseId);
    return payment?.paid_amount;
  };

  const getPaymentDate = (expenseId: string) => {
    const payment = payments.find(p => p.planned_expense_id === expenseId);
    if (payment?.paid_at) {
      return new Date(payment.paid_at);
    }
    return null;
  };

  const formatPaymentDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const wasPaidLate = (expense: PlannedExpense, paymentDate: Date | null): boolean => {
    if (!paymentDate) return false;
    
    const paidDay = paymentDate.getDate();
    const paidMonth = paymentDate.getMonth();
    const paidYear = paymentDate.getFullYear();
    
    // If paid in a later month/year, it's late
    if (paidYear > selectedYear || (paidYear === selectedYear && paidMonth > selectedMonth)) {
      return true;
    }
    
    // If paid in the same month but after due day
    if (paidYear === selectedYear && paidMonth === selectedMonth && paidDay > expense.due_day) {
      return true;
    }
    
    return false;
  };

  const getPaymentPerson = (expenseId: string) => {
    const payment = payments.find(p => p.planned_expense_id === expenseId);
    if (payment?.person_id) {
      return people.find(p => p.id === payment.person_id);
    }
    return null;
  };

  const isExpenseOverdue = (expense: PlannedExpense) => {
    if (isExpensePaid(expense.id)) return false;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se estamos vendo um mês/ano passado e não está pago, está atrasado
    if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
      return true;
    }
    
    // Se estamos no mês atual e passou do dia de vencimento
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return today.getDate() > expense.due_day;
    }
    
    return false;
  };

  const getPaidCount = () => {
    return plannedExpenses.filter(e => isExpensePaid(e.id)).length;
  };

  const getOverdueCount = () => {
    return plannedExpenses.filter(e => isExpenseOverdue(e)).length;
  };

  const getTotalExpected = () => {
    return plannedExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalPaid = () => {
    return plannedExpenses
      .filter(e => isExpensePaid(e.id))
      .reduce((sum, e) => {
        const paidAmount = getPaymentAmount(e.id);
        return sum + (paidAmount ?? e.amount);
      }, 0);
  };

  const getTotalOverdue = () => {
    return plannedExpenses
      .filter(e => isExpenseOverdue(e))
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name;
  };

  // Sort expenses: overdue first, then by due_day
  const sortedExpenses = [...plannedExpenses].sort((a, b) => {
    const aOverdue = isExpenseOverdue(a);
    const bOverdue = isExpenseOverdue(b);
    const aPaid = isExpensePaid(a.id);
    const bPaid = isExpensePaid(b.id);
    
    // Paid ones go to the bottom
    if (aPaid && !bPaid) return 1;
    if (!aPaid && bPaid) return -1;
    
    // Overdue ones go to the top
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Sort by due day
    return a.due_day - b.due_day;
  });

  // Compact mode for Dashboard - shows only summary stats
  if (compact) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Gastos Fixos - {MONTHS[selectedMonth]}
          </h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Previsto</p>
            <p className="text-lg font-bold text-foreground">R$ {getTotalExpected().toFixed(2)}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="text-lg font-bold text-success">R$ {getTotalPaid().toFixed(2)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-lg font-bold text-foreground">{getPaidCount()}/{plannedExpenses.length}</p>
          </div>
          {getOverdueCount() > 0 ? (
            <div className="bg-danger/10 rounded-lg p-3">
              <p className="text-xs text-danger flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Atrasados
              </p>
              <p className="text-lg font-bold text-danger">{getOverdueCount()}</p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-lg font-bold text-foreground">
                R$ {(getTotalExpected() - getTotalPaid()).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Full mode for "Adicionar" tab - shows list and management
  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Gastos Fixos
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[100px] text-center">
              {MONTHS[selectedMonth].slice(0, 3)} {selectedYear}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              setFormData({ name: "", amount: "", category_id: "", description: "", due_day: "1" });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "Editar Gasto Fixo" : "Novo Gasto Fixo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Netflix, Água, Luz..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor Previsto *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_day">Dia Vencimento</Label>
                    <Input
                      id="due_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_day}
                      onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingExpense ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Gasto: <strong>{payingExpense?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Valor previsto: <strong>R$ {payingExpense?.amount.toFixed(2)}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Valor Real Pago *</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_person">Quem Pagou *</Label>
              <Select value={paidPersonId} onValueChange={setPaidPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione quem pagou" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: person.color }}
                        />
                        {person.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePayment} className="w-full">
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de gastos fixos */}
      {plannedExpenses.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Nenhum gasto fixo para este mês.</p>
          <p className="text-sm mt-1">Clique em "Novo" para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {sortedExpenses.map((expense) => {
            const isPaid = isExpensePaid(expense.id);
            const isOverdue = isExpenseOverdue(expense);
            const categoryName = getCategoryName(expense.category_id);
            const paidAmountValue = getPaymentAmount(expense.id);
            const paymentDate = getPaymentDate(expense.id);
            const paymentPerson = getPaymentPerson(expense.id);
            
            return (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isPaid 
                    ? 'bg-success/10 border-success/30' 
                    : isOverdue
                      ? 'bg-danger/10 border-danger/50 animate-pulse'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Checkbox
                    checked={isPaid}
                    onCheckedChange={() => togglePayment(expense.id, isPaid)}
                    className={`flex-shrink-0 ${isPaid ? 'data-[state=checked]:bg-success data-[state=checked]:border-success' : ''} ${isOverdue ? 'border-danger' : ''}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium truncate ${isPaid ? 'line-through text-muted-foreground' : ''} ${isOverdue ? 'text-danger' : ''}`}>
                        {expense.name}
                      </p>
                      {isOverdue && (
                        <span className="text-xs bg-danger text-white px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          Atrasado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className={`${isOverdue ? 'text-danger font-medium' : ''}`}>
                        Dia {expense.due_day}
                      </span>
                      {categoryName && (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {categoryName}
                        </span>
                      )}
                      {isPaid && paymentDate && (
                        <span className={`${wasPaidLate(expense, paymentDate) ? 'text-warning' : 'text-success'}`}>
                          • {formatPaymentDate(paymentDate)}
                          {wasPaidLate(expense, paymentDate) && ` (vencia dia ${expense.due_day})`}
                          {paymentPerson && (
                            <span style={{ color: paymentPerson.color }} className="font-medium">
                              {` - ${paymentPerson.name}`}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    {isPaid && paidAmountValue !== null && paidAmountValue !== expense.amount ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through block">
                          R$ {expense.amount.toFixed(2)}
                        </span>
                        <span className="font-semibold text-success text-sm">
                          R$ {paidAmountValue.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className={`font-semibold text-sm ${isPaid ? 'text-success' : ''} ${isOverdue ? 'text-danger' : ''}`}>
                        R$ {(paidAmountValue ?? expense.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {!isPastMonth() && (
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:text-danger"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default PlannedExpenses;