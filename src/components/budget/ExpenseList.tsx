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
import ExpenseEditDialog from "./ExpenseEditDialog";

interface ExpenseListProps {
  refreshTrigger?: number;
}

const ExpenseList = ({ refreshTrigger }: ExpenseListProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
          color,
          tipo
        ),
        people (
          id,
          name,
          color
        )
      `)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

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
        personId: expense?.person_id,
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
      expense.people?.name?.toLowerCase().includes(query) ||
      expense.amount?.toString().includes(query)
    );
  });

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setEditDialogOpen(true);
  };

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
          <div className="space-y-1.5">
            {filteredExpenses.map((expense) => (
              <Card 
                key={expense.id} 
                className="p-2 hover:shadow-md transition-all duration-300 border-l-4"
                style={{
                  borderLeftColor: expense.categories?.color || "hsl(var(--primary))"
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {expense.categories?.name || "Sem categoria"}
                      </span>
                      {expense.people && (
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: expense.people.color }}
                          title={expense.people.name}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">
                        R$ {parseFloat(expense.amount).toFixed(2)}
                      </span>
                      <span className="truncate">
                        {new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="truncate flex-1 min-w-0">
                        {expense.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 hover:bg-primary/10"
                      onClick={() => handleEdit(expense)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 hover:bg-danger/10 hover:text-danger"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

      <ExpenseEditDialog
        expense={editingExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onExpenseUpdated={loadExpenses}
      />
    </div>
  );
};

export default ExpenseList;
