import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const PlannedExpenses = () => {
  const [plannedExpenses, setPlannedExpenses] = useState<PlannedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PlannedExpense | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category_id: "",
    description: ""
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    // Load planned expenses
    const { data: expenses } = await supabase
      .from('planned_expenses')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (expenses) {
      setPlannedExpenses(expenses);
    }

    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (cats) {
      setCategories(cats);
    }

    // Load payments for current month/year
    const { data: pays } = await supabase
      .from('planned_expense_payments')
      .select('*')
      .eq('month', selectedMonth)
      .eq('year', selectedYear);
    
    if (pays) {
      setPayments(pays);
    }
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

    const expenseData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || null,
      description: formData.description || null
    };

    if (editingExpense) {
      const { error } = await supabase
        .from('planned_expenses')
        .update(expenseData)
        .eq('id', editingExpense.id);
      
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        return;
      }
      toast({ title: "Gasto previsto atualizado!" });
    } else {
      const { error } = await supabase
        .from('planned_expenses')
        .insert(expenseData);
      
      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
        return;
      }
      toast({ title: "Gasto previsto criado!" });
    }

    setFormData({ name: "", amount: "", category_id: "", description: "" });
    setEditingExpense(null);
    setIsDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('planned_expenses')
      .update({ active: false })
      .eq('id', id);
    
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
      return;
    }
    toast({ title: "Gasto previsto removido!" });
    loadData();
  };

  const handleEdit = (expense: PlannedExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category_id: expense.category_id || "",
      description: expense.description || ""
    });
    setIsDialogOpen(true);
  };

  const togglePayment = async (expenseId: string, currentlyPaid: boolean) => {
    const existingPayment = payments.find(
      p => p.planned_expense_id === expenseId
    );

    if (existingPayment) {
      const { error } = await supabase
        .from('planned_expense_payments')
        .update({ 
          paid: !currentlyPaid,
          paid_at: !currentlyPaid ? new Date().toISOString() : null
        })
        .eq('id', existingPayment.id);
      
      if (error) {
        toast({ title: "Erro ao atualizar pagamento", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('planned_expense_payments')
        .insert({
          planned_expense_id: expenseId,
          month: selectedMonth,
          year: selectedYear,
          paid: true,
          paid_at: new Date().toISOString()
        });
      
      if (error) {
        toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
        return;
      }
    }

    loadData();
  };

  const isExpensePaid = (expenseId: string) => {
    const payment = payments.find(p => p.planned_expense_id === expenseId);
    return payment?.paid || false;
  };

  const getPaidCount = () => {
    return plannedExpenses.filter(e => isExpensePaid(e.id)).length;
  };

  const getTotalExpected = () => {
    return plannedExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getTotalPaid = () => {
    return plannedExpenses
      .filter(e => isExpensePaid(e.id))
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com navegação de mês */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              setFormData({ name: "", amount: "", category_id: "", description: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Gasto</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "Editar Gasto Previsto" : "Novo Gasto Previsto"}
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
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Previsto</p>
          <p className="text-2xl font-bold text-foreground">
            R$ {getTotalExpected().toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Pago</p>
          <p className="text-2xl font-bold text-success">
            R$ {getTotalPaid().toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pagos / Total</p>
          <p className="text-2xl font-bold text-foreground">
            {getPaidCount()} / {plannedExpenses.length}
          </p>
        </Card>
      </div>

      {/* Lista de gastos previstos */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Gastos do Mês</h3>
        
        {plannedExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum gasto previsto cadastrado.</p>
            <p className="text-sm mt-2">Clique em "Novo Gasto" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plannedExpenses.map((expense) => {
              const isPaid = isExpensePaid(expense.id);
              const categoryName = getCategoryName(expense.category_id);
              
              return (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isPaid 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isPaid}
                      onCheckedChange={() => togglePayment(expense.id, isPaid)}
                      className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    <div>
                      <p className={`font-medium ${isPaid ? 'line-through text-muted-foreground' : ''}`}>
                        {expense.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {categoryName && (
                          <span className="bg-muted px-2 py-0.5 rounded">
                            {categoryName}
                          </span>
                        )}
                        {expense.description && (
                          <span>{expense.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${isPaid ? 'text-success' : ''}`}>
                      R$ {expense.amount.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger hover:text-danger"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlannedExpenses;