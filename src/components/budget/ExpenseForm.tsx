import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, DollarSign, Calendar, FileText, User, Tag, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";

interface ExpenseFormProps {
  onManageCategories: () => void;
  onExpenseAdded?: () => void;
}

const ExpenseForm = ({ onManageCategories, onExpenseAdded }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const nomes = ['Fernando', 'Estefania'];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !categoryId || !descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar um gasto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('expenses')
      .insert({
        description: descricao,
        amount: parseFloat(valor),
        category_id: categoryId,
        date: data
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao adicionar gasto",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      // Registrar atividade
      await logActivity({
        action: "criar",
        entityType: "Despesa",
        entityName: selectedCategory?.name || "Sem categoria",
        details: `R$ ${parseFloat(valor).toFixed(2)} - ${descricao}`,
      });

      // Limpar formulário
      setValor("");
      setCategoryId("");
      setDescricao("");
      
      // Notificar componente pai ANTES do toast para garantir atualização
      onExpenseAdded?.();
      
      toast({
        title: "Gasto adicionado! 🎉",
        description: `R$ ${parseFloat(valor).toFixed(2)} em ${selectedCategory?.name}`,
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 shadow-lg gradient-card">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
          <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Adicionar Gasto</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Registre uma nova despesa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoria" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categoria
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="categoria" className="h-11">
                <SelectValue placeholder="Selecione..." />
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
            <Label htmlFor="valor" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor (R$)
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data
            </Label>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-11"
            />
          </div>


          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descricao" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione detalhes sobre este gasto..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 h-12 gradient-primary hover:shadow-glow transition-all"
              disabled={loading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {loading ? "Salvando..." : "Adicionar Gasto"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setValor("");
                setCategoryId("");
                setDescricao("");
              }}
              className="h-12"
            >
              Limpar
            </Button>
          </div>
          <button
            type="button"
            onClick={onManageCategories}
            className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
          >
            <Settings className="w-3 h-3" />
            Gerenciar Categorias
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ExpenseForm;
