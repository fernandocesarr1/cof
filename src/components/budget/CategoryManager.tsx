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

        {/* Lista de categorias */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-4">Categorias Cadastradas</h3>
          
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="p-4 hover:shadow-md transition-all duration-300 border-l-4"
              style={{
                borderLeftColor: category.tipo === "fixo" 
                  ? "hsl(var(--success))" 
                  : "hsl(var(--warning))"
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Badge 
                    variant={category.tipo === "fixo" ? "default" : "secondary"}
                    className="font-medium"
                  >
                    {category.tipo === "fixo" ? "Fixo" : "Variável"}
                  </Badge>
                  <span className="font-semibold text-lg text-foreground">
                    {category.nome}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground ml-auto mr-4">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">
                      Limite: R$ {category.limite.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-accent">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-danger/10 hover:text-danger"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

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
