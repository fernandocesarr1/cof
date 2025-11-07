import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trash2, 
  Edit, 
  Download,
  Calendar,
  DollarSign,
  User,
  Tag,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";

interface ExpenseListProps {
  refreshTrigger?: number;
}

const ExpenseList = ({ refreshTrigger }: ExpenseListProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [refreshTrigger]);

  const loadExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .order('date', { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExpenses(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar despesa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Registrar atividade
      await logActivity({
        action: "deletar",
        entityType: "Despesa",
        entityName: expense?.categories?.name || "Sem categoria",
        details: `R$ ${parseFloat(expense?.amount).toFixed(2)} - ${expense?.description}`,
      });

      toast({
        title: "Despesa deletada",
        description: "A despesa foi removida com sucesso.",
      });
      loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.toLowerCase();
    return (
      expense.categories?.name?.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      expense.amount?.toString().includes(query)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Lista de Gastos</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Visualize e gerencie suas despesas</p>
          </div>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar gastos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredExpenses.map((expense) => (
              <Card 
                key={expense.id} 
                className="p-3 sm:p-4 hover:shadow-md transition-all duration-300 border-l-4"
                style={{
                  borderLeftColor: expense.categories?.color || "hsl(var(--primary))"
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-semibold text-base sm:text-lg text-foreground">
                        {expense.categories?.name || "Sem categoria"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-bold text-foreground">
                          R$ {parseFloat(expense.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground col-span-2">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{expense.description}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 sm:gap-2 self-end sm:self-start">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-danger/10 hover:text-danger"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum gasto encontrado" : "Nenhum gasto registrado ainda"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExpenseList;
