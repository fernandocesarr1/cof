import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsOverviewProps {
  refreshTrigger?: number;
  selectedMonth: number;
  selectedYear: number;
}

const StatsOverview = ({ refreshTrigger, selectedMonth, selectedYear }: StatsOverviewProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  useEffect(() => {
    loadData();
  }, [refreshTrigger, selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);
    
    const { data: budgetsData } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('month', selectedMonth + 1)
      .eq('year', selectedYear);
    
    setCategories(categoriesData || []);
    setExpenses(expensesData || []);
    setBudgets(budgetsData || []);
    setLoading(false);
  };

  const getCategoryValue = (categoryId: string) => {
    return expenses
      .filter(e => e.category_id === categoryId)
      .reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
  };

  const getCategoryBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.category_id === categoryId);
    return budget ? parseFloat(String(budget.amount)) : 0;
  };

  const handleSaveBudget = async (categoryId: string) => {
    const value = parseFloat(budgetValue);
    if (isNaN(value) || value <= 0) return;

    const existingBudget = budgets.find(b => b.category_id === categoryId);

    if (existingBudget) {
      await supabase
        .from('category_budgets')
        .update({ amount: value })
        .eq('id', existingBudget.id);
    } else {
      await supabase
        .from('category_budgets')
        .insert({
          category_id: categoryId,
          amount: value,
          month: selectedMonth + 1,
          year: selectedYear,
        });
    }

    setEditingBudget(null);
    setBudgetValue("");
    loadData();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-danger";
    if (percentage >= 80) return "bg-warning";
    return "bg-success";
  };

  if (loading) {
    return (
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  const renderCategorySection = (tipo: string, title: string, colorClass: string) => {
    const filteredCategories = categories.filter(c => c.tipo === tipo);
    
    if (filteredCategories.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          Nenhuma categoria {tipo} cadastrada
        </p>
      );
    }

    return filteredCategories.map((category) => {
      const value = getCategoryValue(category.id);
      const budget = getCategoryBudget(category.id);
      const percentage = budget > 0 ? (value / budget) * 100 : 0;
      const isEditing = editingBudget === category.id;

      return (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{category.name}</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${percentage >= 100 ? 'text-danger' : 'text-foreground'}`}>
                R$ {value.toFixed(2)}
              </span>
              {budget > 0 && (
                <span className="text-xs text-muted-foreground">
                  / R$ {budget.toFixed(2)}
                </span>
              )}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="h-7 w-24 text-xs"
                    placeholder="Orçamento"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleSaveBudget(category.id)}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingBudget(null);
                      setBudgetValue("");
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingBudget(category.id);
                    setBudgetValue(budget > 0 ? budget.toString() : "");
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor(percentage)} rounded-full transition-all`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {percentage > 100 && (
              <div 
                className="h-full bg-danger/50 rounded-full transition-all"
                style={{ width: `${Math.min(percentage - 100, 100)}%` }}
              />
            )}
          </div>
          {percentage >= 100 && (
            <p className="text-xs text-danger">
              Excedeu em R$ {(value - budget).toFixed(2)}
            </p>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="p-4 sm:p-6 shadow-lg gradient-card">
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
        Gastos por Categoria
      </h2>
      
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gastos Fixos */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-5 sm:h-6 bg-success rounded-full" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Gastos Fixos</h3>
          </div>
          {renderCategorySection("fixo", "Gastos Fixos", "bg-success")}
        </div>

        {/* Gastos Variáveis */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-5 sm:h-6 bg-warning rounded-full" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Gastos Variáveis</h3>
          </div>
          {renderCategorySection("variavel", "Gastos Variáveis", "bg-warning")}
        </div>
      </div>
    </Card>
  );
};

export default StatsOverview;
