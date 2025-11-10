import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";

interface ExpenseEditDialogProps {
  expense: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseUpdated: () => void;
}

const ExpenseEditDialog = ({ expense, open, onOpenChange, onExpenseUpdated }: ExpenseEditDialogProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [tipoGasto, setTipoGasto] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadPeople();
  }, []);

  useEffect(() => {
    if (expense && open) {
      setValor(expense.amount?.toString() || "");
      setData(expense.date || "");
      setDescricao(expense.description || "");
      setCategoryId(expense.category_id || "");
      setPersonId(expense.person_id || "");
      setTipoGasto(expense.categories?.tipo || "");
    }
  }, [expense, open]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
  };

  const loadPeople = async () => {
    const { data } = await supabase
      .from('people')
      .select('*')
      .order('name');
    setPeople(data || []);
  };

  const categoriasFiltradas = tipoGasto 
    ? categories.filter(cat => cat.tipo === tipoGasto)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !categoryId || !descricao || !personId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('expenses')
      .update({
        description: descricao,
        amount: parseFloat(valor),
        category_id: categoryId,
        person_id: personId,
        date: data
      })
      .eq('id', expense.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao atualizar gasto",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      await logActivity({
        action: "atualizar",
        entityType: "Despesa",
        entityName: selectedCategory?.name || "Sem categoria",
        details: `R$ ${parseFloat(valor).toFixed(2)} - ${descricao}`,
        personId: personId,
      });

      toast({
        title: "Gasto atualizado!",
        description: "As alterações foram salvas.",
      });
      
      onOpenChange(false);
      onExpenseUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Gasto</Label>
              <Select 
                value={tipoGasto} 
                onValueChange={(value) => {
                  setTipoGasto(value);
                  setCategoryId("");
                }}
              >
                <SelectTrigger id="edit-tipo">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="fixo">Gastos Fixos</SelectItem>
                  <SelectItem value="variavel">Gastos Variáveis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select 
                value={categoryId} 
                onValueChange={setCategoryId}
                disabled={!tipoGasto}
              >
                <SelectTrigger id="edit-categoria">
                  <SelectValue placeholder={tipoGasto ? "Selecione..." : "Tipo primeiro"} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {categoriasFiltradas.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pessoa">Pessoa</Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger id="edit-pessoa">
                  <SelectValue placeholder="Quem fez o gasto?" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-data">Data</Label>
              <Input
                id="edit-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseEditDialog;
