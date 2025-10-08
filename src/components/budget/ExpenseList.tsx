import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const ExpenseList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Dados de exemplo
  const expenses = [
    {
      id: 1,
      tipo: "variavel",
      categoria: "Supermercado",
      valor: 350.50,
      data: "2024-01-15",
      descricao: "Compras mensais",
      responsavel: "Fernando"
    },
    {
      id: 2,
      tipo: "fixo",
      categoria: "Internet",
      valor: 99.90,
      data: "2024-01-10",
      descricao: "Mensalidade",
      responsavel: "Estefania"
    },
  ];

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.toLowerCase();
    return (
      expense.categoria.toLowerCase().includes(query) ||
      expense.descricao.toLowerCase().includes(query) ||
      expense.responsavel.toLowerCase().includes(query) ||
      expense.valor.toString().includes(query)
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

        <div className="space-y-2 sm:space-y-3">
          {filteredExpenses.map((expense) => (
            <Card 
              key={expense.id} 
              className="p-3 sm:p-4 hover:shadow-md transition-all duration-300 border-l-4"
              style={{
                borderLeftColor: expense.tipo === "fixo" 
                  ? "hsl(var(--success))" 
                  : "hsl(var(--warning))"
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge 
                      variant={expense.tipo === "fixo" ? "default" : "secondary"}
                      className="font-medium text-xs"
                    >
                      {expense.tipo === "fixo" ? "Fixo" : "Variável"}
                    </Badge>
                    <span className="font-semibold text-base sm:text-lg text-foreground">
                      {expense.categoria}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="font-bold text-foreground">
                        R$ {expense.valor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{new Date(expense.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{expense.responsavel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{expense.descricao}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2 self-end sm:self-start">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-danger/10 hover:text-danger">
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
