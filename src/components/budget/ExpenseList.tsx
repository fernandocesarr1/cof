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
  FileText,
  FileSpreadsheet
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import ExpenseEditDialog from "./ExpenseEditDialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const getIconComponent = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as any;
    return Icon || LucideIcons.Tag;
  };

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
          icon,
          tipo
        ),
        subcategories (
          id,
          name
        ),
        people (
          id,
          name,
          color
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

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

  const exportToExcel = () => {
    const data = filteredExpenses.map(expense => ({
      'Data': new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      'Categoria': expense.categories?.name || 'Sem categoria',
      'Subcategoria': expense.subcategories?.name || '-',
      'Descrição': expense.description,
      'Valor': parseFloat(expense.amount).toFixed(2),
      'Pessoa': expense.people?.name || '-',
      'Tipo': expense.categories?.tipo === 'fixo' ? 'Fixo' : 'Variável'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
    XLSX.writeFile(wb, `gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ title: "Excel exportado com sucesso!" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Gastos', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const tableData = filteredExpenses.map(expense => [
      new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      expense.categories?.name || 'Sem categoria',
      expense.subcategories?.name || '-',
      expense.description.substring(0, 30),
      `R$ ${parseFloat(expense.amount).toFixed(2)}`,
      expense.people?.name || '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'Categoria', 'Subcategoria', 'Descrição', 'Valor', 'Pessoa']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    const total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + 10);

    doc.save(`gastos_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({ title: "PDF exportado com sucesso!" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Lista de Gastos</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Visualize e gerencie suas despesas</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border z-50">
              <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="space-y-4">
            {(() => {
              // Agrupar despesas por mês/ano
              const groupedByMonth: Record<string, typeof filteredExpenses> = {};
              filteredExpenses.forEach(expense => {
                const date = new Date(expense.date + 'T00:00:00');
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!groupedByMonth[key]) groupedByMonth[key] = [];
                groupedByMonth[key].push(expense);
              });
              
              const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
              const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              
              return sortedMonths.map(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthTotal = groupedByMonth[monthKey].reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                
                return (
                  <div key={monthKey} className="space-y-1.5">
                    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg sticky top-0">
                      <h3 className="font-semibold text-foreground text-sm">
                        {monthNames[parseInt(month) - 1]} {year}
                      </h3>
                      <span className="text-sm font-bold text-primary">
                        R$ {monthTotal.toFixed(2)}
                      </span>
                    </div>
                    {groupedByMonth[monthKey].map((expense) => (
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
                              {expense.categories && (() => {
                                const IconComponent = getIconComponent(expense.categories.icon);
                                return (
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: expense.categories.color }}
                                  >
                                    <IconComponent className="w-3.5 h-3.5 text-white" />
                                  </div>
                                );
                              })()}
                              <span className="font-semibold text-sm text-foreground truncate">
                                {expense.categories?.name || "Sem categoria"}
                              </span>
                              {expense.subcategories?.name && (
                                <span className="text-xs text-muted-foreground">
                                  › {expense.subcategories.name}
                                </span>
                              )}
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
                );
              });
            })()}
          </div>
        )}

        {filteredExpenses.length === 0 && !loading && (
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
