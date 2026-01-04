import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, DollarSign, Calendar, FileText, User, Tag, Settings, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import * as LucideIcons from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExpenseFormProps {
  onManageCategories: () => void;
  onManagePeople: () => void;
  onExpenseAdded?: () => void;
}

const ExpenseForm = ({ onManageCategories, onManagePeople, onExpenseAdded }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  
  // Filtrar subcategorias baseado na categoria selecionada
  const subcategoriasFiltradas = categoryId
    ? subcategories.filter(sub => sub.category_id === categoryId)
    : [];

  useEffect(() => {
    loadCategories();
    loadPeople();
    loadSubcategories();
  }, []);

  // Verificar duplicados quando os campos principais mudam
  useEffect(() => {
    checkDuplicates();
  }, [valor, data, personId, descricao]);

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

  const loadSubcategories = async () => {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .order('name');
    
    if (!error) {
      setSubcategories(data || []);
    }
  };

  const loadPeople = async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: "Erro ao carregar pessoas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPeople(data || []);
    }
  };

  const checkDuplicates = async () => {
    if (!valor || !data || !personId || !descricao) {
      setDuplicateWarning(false);
      return;
    }

    const { data: existing } = await supabase
      .from('expenses')
      .select('id')
      .eq('amount', parseFloat(valor))
      .eq('date', data)
      .eq('person_id', personId)
      .eq('description', descricao)
      .limit(1);

    setDuplicateWarning(existing && existing.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !personId || !descricao || !data) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha valor, data, pessoa e descrição.",
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
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        person_id: personId,
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
        personId: personId,
      });

      // Limpar formulário
      setValor("");
      setCategoryId("");
      setSubcategoryId("");
      setPersonId("");
      setDescricao("");
      setDuplicateWarning(false);
      
      // Notificar componente pai
      onExpenseAdded?.();
      
      toast({
        title: "Gasto adicionado! 🎉",
        description: `R$ ${parseFloat(valor).toFixed(2)}${selectedCategory ? ` em ${selectedCategory.name}` : ''}`,
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as any;
    return Icon || LucideIcons.Tag;
  };

  return (
    <div className="space-y-6">
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

        {duplicateWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Atenção: Pode haver duplicação! Já existe um gasto com os mesmos dados.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Valor - Primeiro */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor (R$) *
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
                required
              />
            </div>

            {/* Data - Segundo */}
            <div className="space-y-2">
              <Label htmlFor="data" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {/* Pessoa - Terceiro */}
            <div className="space-y-2">
              <Label htmlFor="pessoa" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Pessoa *
              </Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger id="pessoa" className="h-11 bg-background">
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

            {/* Descrição - Quarto (em uma linha só no mobile, ocupando o espaço) */}
            <div className="space-y-2">
              <Label htmlFor="descricao" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descrição *
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do gasto..."
                className="h-11"
                required
              />
            </div>

            {/* Categoria - Opcional */}
            <div className="space-y-2">
              <Label htmlFor="categoria" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categoria (opcional)
              </Label>
              <Select 
                value={categoryId} 
                onValueChange={(value) => {
                  setCategoryId(value === "none" ? "" : value);
                  setSubcategoryId("");
                }}
              >
                <SelectTrigger id="categoria" className="h-11 bg-background">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categories.map((cat) => {
                    const IconComponent = getIconComponent(cat.icon);
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: cat.color }}
                          >
                            <IconComponent className="w-3.5 h-3.5 text-white" />
                          </div>
                          {cat.name}
                          <span className="text-xs text-muted-foreground">
                            ({cat.tipo === 'fixo' ? 'Fixo' : 'Variável'})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategoria - Opcional */}
            <div className="space-y-2">
              <Label htmlFor="subcategoria" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Subcategoria (opcional)
              </Label>
              <Select 
                value={subcategoryId || "none"} 
                onValueChange={(value) => setSubcategoryId(value === "none" ? "" : value)}
                disabled={!categoryId}
              >
                <SelectTrigger id="subcategoria" className="h-11 bg-background">
                  <SelectValue placeholder={categoryId ? "Selecione..." : "Selecione categoria primeiro"} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {subcategoriasFiltradas.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  setSubcategoryId("");
                  setPersonId("");
                  setDescricao("");
                  setDuplicateWarning(false);
                }}
                className="h-12"
              >
                Limpar
              </Button>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onManageCategories}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Gerenciar Categorias
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ExpenseForm;