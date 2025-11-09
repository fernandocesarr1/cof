import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface StatsOverviewProps {
  refreshTrigger?: number;
}

const StatsOverview = ({ refreshTrigger }: StatsOverviewProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    
    // Buscar categorias
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    // Buscar despesas do mês atual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);
    
    setCategories(categoriesData || []);
    setExpenses(expensesData || []);
    setLoading(false);
  };

  const getCategoryValue = (categoryId: string) => {
    return expenses
      .filter(e => e.category_id === categoryId)
      .reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
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

  return (
    <Card className="p-4 sm:p-6 shadow-lg gradient-card">
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Gastos por Categoria</h2>
      
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gastos Fixos */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-5 sm:h-6 bg-success rounded-full" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Gastos Fixos</h3>
          </div>
          {categories.filter(c => c.tipo === "fixo").length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma categoria fixa cadastrada</p>
          ) : (
            categories.filter(c => c.tipo === "fixo").map((category) => {
              const value = getCategoryValue(category.id);
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="font-bold text-foreground">
                      R$ {value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success rounded-full transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Gastos Variáveis */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1 h-5 sm:h-6 bg-warning rounded-full" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Gastos Variáveis</h3>
          </div>
          {categories.filter(c => c.tipo === "variavel").length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma categoria variável cadastrada</p>
          ) : (
            categories.filter(c => c.tipo === "variavel").map((category) => {
              const value = getCategoryValue(category.id);
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="font-bold text-foreground">
                      R$ {value.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning rounded-full transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatsOverview;
