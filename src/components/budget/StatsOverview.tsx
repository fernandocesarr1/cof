import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsOverviewProps {
  refreshTrigger?: number;
  selectedMonth: number;
  selectedYear: number;
}

const StatsOverview = ({ refreshTrigger, selectedMonth, selectedYear }: StatsOverviewProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [refreshTrigger, selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    const { data: subcategoriesData } = await supabase
      .from('subcategories')
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
    setSubcategories(subcategoriesData || []);
    setExpenses(expensesData || []);
    setBudgets(budgetsData || []);
    setLoading(false);
  };

  const getCategoryValue = (categoryId: string) => {
    return expenses
      .filter(e => e.category_id === categoryId)
      .reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
  };

  const getSubcategoryValue = (subcategoryId: string) => {
    return expenses
      .filter(e => e.subcategory_id === subcategoryId)
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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategorySubcategories = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
  };

  if (loading) {
    return (
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  // Filter categories that have expenses
  const categoriesWithExpenses = categories.filter(cat => getCategoryValue(cat.id) > 0);

  return (
    <Card className="p-4 sm:p-6 shadow-lg gradient-card">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Gastos por Categoria
        </h2>
        <span className="text-sm sm:text-base font-bold text-foreground">
          Total: R$ {getTotalExpenses().toFixed(2)}
        </span>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {categoriesWithExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nenhum gasto registrado neste mês
          </p>
        ) : (
          categoriesWithExpenses.map((category) => {
            const value = getCategoryValue(category.id);
            const budget = getCategoryBudget(category.id);
            const percentage = budget > 0 ? (value / budget) * 100 : 0;
            const isEditing = editingBudget === category.id;
            const categorySubcategories = getCategorySubcategories(category.id);
            const hasSubcategories = categorySubcategories.length > 0;
            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {hasSubcategories && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
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
                {budget > 0 && (
                  <>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="flex h-full">
                        {percentage <= 100 ? (
                          <div 
                            className={`h-full ${getProgressColor(percentage)} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        ) : (
                          <>
                            <div 
                              className="h-full bg-success transition-all"
                              style={{ width: `${(100 / percentage) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-danger transition-all"
                              style={{ width: `${((percentage - 100) / percentage) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    {percentage >= 100 && (
                      <p className="text-xs text-danger">
                        Excedeu em R$ {(value - budget).toFixed(2)}
                      </p>
                    )}
                  </>
                )}
                
                {/* Subcategorias expandíveis */}
                {hasSubcategories && isExpanded && (
                  <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-3">
                    {categorySubcategories.map((sub) => {
                      const subValue = getSubcategoryValue(sub.id);
                      if (subValue === 0) return null;
                      return (
                        <div key={sub.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{sub.name}</span>
                          <span className="font-medium text-foreground">R$ {subValue.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {categorySubcategories.every(sub => getSubcategoryValue(sub.id) === 0) && (
                      <p className="text-xs text-muted-foreground italic">Sem gastos nas subcategorias</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default StatsOverview;