import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface CategoryManagerProps {
  onBack: () => void;
}

const CategoryManager = ({ onBack }: CategoryManagerProps) => {
  const [categories, setCategories] = useState([
    { id: 1, nome: "Supermercado", tipo: "variavel", limite: 1000 },
    { id: 2, nome: "Internet", tipo: "fixo", limite: 150 },
    { id: 3, nome: "Energia", tipo: "fixo", limite: 200 },
    { id: 4, nome: "Água", tipo: "fixo", limite: 100 },
    { id: 5, nome: "Gás", tipo: "fixo", limite: 80 },
    { id: 6, nome: "Combustível", tipo: "variavel", limite: 500 },
    { id: 7, nome: "Lazer", tipo: "variavel", limite: 300 },
  ]);

  const [newCategory, setNewCategory] = useState({
    nome: "",
    tipo: "variavel",
    limite: ""
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", limite: "" });

  const handleAddCategory = () => {
    if (newCategory.nome && newCategory.limite) {
      setCategories([
        ...categories,
        {
          id: Date.now(),
          nome: newCategory.nome,
          tipo: newCategory.tipo,
          limite: parseFloat(newCategory.limite)
        }
      ]);
      setNewCategory({ nome: "", tipo: "variavel", limite: "" });
    }
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const handleEditCategory = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setEditForm({ nome: category.nome, limite: category.limite.toString() });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.nome && editForm.limite) {
      setCategories(categories.map(cat =>
        cat.id === editingId
          ? { ...cat, nome: editForm.nome, limite: parseFloat(editForm.limite) }
          : cat
      ));
      setEditingId(null);
      setEditForm({ nome: "", limite: "" });
    }
  };

  const categoriasPorTipo = {
    fixo: categories.filter(cat => cat.tipo === "fixo"),
    variavel: categories.filter(cat => cat.tipo === "variavel")
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-lg gradient-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Gerenciar Categorias</h2>
            </div>
            <p className="text-sm text-muted-foreground ml-12">Adicione e configure suas categorias de gastos</p>
          </div>
          <Tag className="w-8 h-8 text-primary" />
        </div>

        {/* Formulário para adicionar nova categoria */}
        <Card className="p-4 mb-6 bg-accent/50 border-2 border-dashed">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Categoria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategory.nome}
              onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
              className="bg-background"
            />
            <Select 
              value={newCategory.tipo}
              onValueChange={(value) => setNewCategory({ ...newCategory, tipo: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Limite mensal (R$)"
              value={newCategory.limite}
              onChange={(e) => setNewCategory({ ...newCategory, limite: e.target.value })}
              className="bg-background"
            />
            <Button onClick={handleAddCategory} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </Card>

        {/* Lista de categorias agrupadas */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Categorias Cadastradas</h3>
          
          {/* Categorias Fixas */}
          <div>
            <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              Fixas ({categoriasPorTipo.fixo.length})
            </h4>
            <div className="grid gap-2">
              {categoriasPorTipo.fixo.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
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
                          type="number"
                          value={editForm.limite}
                          onChange={(e) => setEditForm({ ...editForm, limite: e.target.value })}
                          className="h-8 max-w-[120px]"
                          placeholder="Limite"
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
                        <span className="font-medium text-foreground">{category.nome}</span>
                        <span className="text-sm text-muted-foreground">R$ {category.limite.toFixed(2)}</span>
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
          </div>

          {/* Categorias Variáveis */}
          <div>
            <h4 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              Variáveis ({categoriasPorTipo.variavel.length})
            </h4>
            <div className="grid gap-2">
              {categoriasPorTipo.variavel.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
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
                          type="number"
                          value={editForm.limite}
                          onChange={(e) => setEditForm({ ...editForm, limite: e.target.value })}
                          className="h-8 max-w-[120px]"
                          placeholder="Limite"
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
                        <span className="font-medium text-foreground">{category.nome}</span>
                        <span className="text-sm text-muted-foreground">R$ {category.limite.toFixed(2)}</span>
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
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma categoria cadastrada ainda</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CategoryManager;
