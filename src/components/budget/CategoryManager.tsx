import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Trash2, 
  Edit,
  DollarSign,
  Tag,
  ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";

interface CategoryManagerProps {
  onBack: () => void;
}

const CategoryManager = ({ onBack }: CategoryManagerProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState({
    nome: "",
    color: "#8B5CF6",
    icon: "tag"
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", color: "", icon: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    setLoading(false);

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

  const handleAddCategory = async () => {
    if (!newCategory.nome) {
      toast({
        title: "Nome obrigatório",
        description: "Preencha o nome da categoria.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategory.nome,
        color: newCategory.color,
        icon: newCategory.icon
      });

    if (error) {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Registrar atividade
      await logActivity({
        action: "criar",
        entityType: "Categoria",
        entityName: newCategory.nome,
      });

      toast({
        title: "Categoria adicionada!",
        description: `${newCategory.nome} foi criada com sucesso.`,
      });
      setNewCategory({ nome: "", color: "#8B5CF6", icon: "tag" });
      loadCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Registrar atividade
      await logActivity({
        action: "deletar",
        entityType: "Categoria",
        entityName: category?.name || "Categoria",
      });

      toast({
        title: "Categoria deletada",
        description: "A categoria foi removida com sucesso.",
      });
      loadCategories();
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingId(category.id);
    setEditForm({ 
      nome: category.name, 
      color: category.color,
      icon: category.icon 
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.nome) {
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name: editForm.nome,
        color: editForm.color,
        icon: editForm.icon
      })
      .eq('id', editingId);

    if (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Registrar atividade
      await logActivity({
        action: "atualizar",
        entityType: "Categoria",
        entityName: editForm.nome,
      });

      toast({
        title: "Categoria atualizada!",
        description: "As alterações foram salvas.",
      });
      setEditingId(null);
      setEditForm({ nome: "", color: "", icon: "" });
      loadCategories();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Gerenciar Categorias</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-10 sm:ml-12">Adicione e configure suas categorias de gastos</p>
          </div>
          <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-primary hidden sm:block" />
        </div>

        {/* Formulário para adicionar nova categoria */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-accent/50 border-2 border-dashed">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nova Categoria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategory.nome}
              onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
              className="bg-background"
            />
            <Input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="bg-background h-11"
            />
            <Button onClick={handleAddCategory} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </Card>

        {/* Lista de categorias */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Categorias Cadastradas ({categories.length})
            </h3>
            
            <div className="grid gap-2">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border-l-4"
                  style={{ borderLeftColor: category.color }}
                >
                  {editingId === category.id ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                          className="h-8 max-w-[200px]"
                        />
                        <Input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="h-8 w-16"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleSaveEdit} className="h-8">
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-accent"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-danger/10 hover:text-danger"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma categoria cadastrada ainda</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CategoryManager;
