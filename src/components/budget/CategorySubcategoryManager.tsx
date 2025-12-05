import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, Edit, ChevronDown, ChevronRight, Folder, ArrowLeft, Tag, Save, X
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  icon: string | null;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  tipo: string;
}

interface CategorySubcategoryManagerProps {
  onBack: () => void;
}

const categoryIconsWithColors: { icon: string; color: string; label: string }[] = [
  { icon: "Home", color: "#10B981", label: "Casa" },
  { icon: "Car", color: "#3B82F6", label: "Carro" },
  { icon: "ShoppingCart", color: "#F59E0B", label: "Compras" },
  { icon: "Coffee", color: "#8B4513", label: "Café" },
  { icon: "Utensils", color: "#EF4444", label: "Alimentação" },
  { icon: "Zap", color: "#FBBF24", label: "Energia" },
  { icon: "Wifi", color: "#6366F1", label: "Internet" },
  { icon: "Smartphone", color: "#8B5CF6", label: "Telefone" },
  { icon: "Tv", color: "#EC4899", label: "Entretenimento" },
  { icon: "Heart", color: "#EF4444", label: "Saúde" },
  { icon: "Book", color: "#14B8A6", label: "Educação" },
  { icon: "GraduationCap", color: "#0EA5E9", label: "Estudos" },
  { icon: "Plane", color: "#06B6D4", label: "Viagem" },
  { icon: "Bus", color: "#84CC16", label: "Transporte" },
  { icon: "Bike", color: "#22C55E", label: "Bicicleta" },
  { icon: "Fuel", color: "#F97316", label: "Combustível" },
  { icon: "Lightbulb", color: "#EAB308", label: "Luz" },
  { icon: "Droplets", color: "#0EA5E9", label: "Água" },
  { icon: "ShoppingBag", color: "#D946EF", label: "Shopping" },
  { icon: "Gift", color: "#F43F5E", label: "Presentes" },
  { icon: "Shirt", color: "#A855F7", label: "Roupas" },
  { icon: "Pill", color: "#10B981", label: "Remédios" },
  { icon: "Activity", color: "#EF4444", label: "Academia" },
  { icon: "DollarSign", color: "#22C55E", label: "Dinheiro" },
  { icon: "CreditCard", color: "#6366F1", label: "Cartão" },
  { icon: "Wallet", color: "#8B5CF6", label: "Carteira" },
  { icon: "Music", color: "#EC4899", label: "Música" },
  { icon: "Gamepad2", color: "#7C3AED", label: "Jogos" },
  { icon: "Dog", color: "#F59E0B", label: "Pet" },
  { icon: "Baby", color: "#FB7185", label: "Bebê" },
  { icon: "Scissors", color: "#14B8A6", label: "Beleza" },
  { icon: "Wrench", color: "#64748B", label: "Manutenção" },
  { icon: "Building", color: "#6B7280", label: "Aluguel" },
  { icon: "Receipt", color: "#78716C", label: "Contas" },
  { icon: "Banknote", color: "#16A34A", label: "Pagamentos" },
  { icon: "PiggyBank", color: "#F472B6", label: "Poupança" },
];

const CategorySubcategoryManager = ({ onBack }: CategorySubcategoryManagerProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Map<string, Subcategory[]>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Nova categoria
  const [newCategory, setNewCategory] = useState({
    nome: "",
    color: "#8B5CF6",
    icon: "Tag",
    tipo: "variavel"
  });
  
  // Edição de categoria
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ nome: "", color: "", icon: "", tipo: "" });
  
  // Nova subcategoria
  const [newSubcategory, setNewSubcategory] = useState<{ [key: string]: string }>({});
  
  // Edição de subcategoria
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editSubcategoryForm, setEditSubcategoryForm] = useState({ name: "" });

  const getIconComponent = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as any;
    return Icon || LucideIcons.Tag;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (catError) {
      toast({ title: "Erro ao carregar categorias", description: catError.message, variant: "destructive" });
    } else {
      setCategories(categoriesData || []);
    }

    const { data: subcategoriesData, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .order('name');

    if (!subError && subcategoriesData) {
      const subMap = new Map<string, Subcategory[]>();
      subcategoriesData.forEach((sub: Subcategory) => {
        const existing = subMap.get(sub.category_id) || [];
        subMap.set(sub.category_id, [...existing, sub]);
      });
      setSubcategories(subMap);
    }
    
    setLoading(false);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // CRUD Categorias
  const handleAddCategory = async () => {
    if (!newCategory.nome) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('categories').insert({
      name: newCategory.nome,
      color: newCategory.color,
      icon: newCategory.icon,
      tipo: newCategory.tipo
    });

    if (error) {
      toast({ title: "Erro ao adicionar categoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "criar", entityType: "Categoria", entityName: newCategory.nome });
      toast({ title: "Categoria adicionada!" });
      setNewCategory({ nome: "", color: "#8B5CF6", icon: "Tag", tipo: "variavel" });
      loadData();
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryForm({ nome: category.name, color: category.color, icon: category.icon, tipo: category.tipo });
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategoryId || !editCategoryForm.nome) return;

    const { error } = await supabase.from('categories').update({
      name: editCategoryForm.nome,
      color: editCategoryForm.color,
      icon: editCategoryForm.icon,
      tipo: editCategoryForm.tipo
    }).eq('id', editingCategoryId);

    if (error) {
      toast({ title: "Erro ao atualizar categoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "atualizar", entityType: "Categoria", entityName: editCategoryForm.nome });
      toast({ title: "Categoria atualizada!" });
      setEditingCategoryId(null);
      loadData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      toast({ title: "Erro ao deletar categoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "deletar", entityType: "Categoria", entityName: category?.name || "Categoria" });
      toast({ title: "Categoria deletada" });
      loadData();
    }
  };

  // CRUD Subcategorias
  const handleAddSubcategory = async (category: Category) => {
    const name = newSubcategory[category.id]?.trim();
    if (!name) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('subcategories').insert({
      name,
      category_id: category.id,
      icon: category.icon,
      color: category.color,
    });

    if (error) {
      toast({ title: "Erro ao adicionar subcategoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "criar", entityType: "Categoria", entityName: `${category.name} > ${name}` });
      toast({ title: "Subcategoria adicionada!" });
      setNewSubcategory({ ...newSubcategory, [category.id]: "" });
      loadData();
    }
  };

  const handleEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategoryId(sub.id);
    setEditSubcategoryForm({ name: sub.name });
  };

  const handleSaveSubcategoryEdit = async (categoryName: string) => {
    if (!editingSubcategoryId || !editSubcategoryForm.name) return;

    const { error } = await supabase.from('subcategories').update({
      name: editSubcategoryForm.name
    }).eq('id', editingSubcategoryId);

    if (error) {
      toast({ title: "Erro ao atualizar subcategoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "atualizar", entityType: "Categoria", entityName: `${categoryName} > ${editSubcategoryForm.name}` });
      toast({ title: "Subcategoria atualizada!" });
      setEditingSubcategoryId(null);
      loadData();
    }
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory, categoryName: string) => {
    const { error } = await supabase.from('subcategories').delete().eq('id', subcategory.id);

    if (error) {
      toast({ title: "Erro ao deletar subcategoria", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "deletar", entityType: "Categoria", entityName: `${categoryName} > ${subcategory.name}` });
      toast({ title: "Subcategoria deletada" });
      loadData();
    }
  };

  const expandAll = () => setExpandedCategories(new Set(categories.map(c => c.id)));
  const collapseAll = () => setExpandedCategories(new Set());

  if (loading) {
    return (
      <Card className="p-6 shadow-lg gradient-card">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Gerenciar Categorias</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Categorias e subcategorias</p>
            </div>
          </div>
          <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-primary hidden sm:block" />
        </div>

        {/* Nova Categoria */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-accent/50 border-2 border-dashed">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nova Categoria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Nome da categoria"
              value={newCategory.nome}
              onChange={(e) => setNewCategory({ ...newCategory, nome: e.target.value })}
              className="bg-background"
            />
            <Select value={newCategory.tipo} onValueChange={(value) => setNewCategory({ ...newCategory, tipo: value })}>
              <SelectTrigger className="bg-background h-11">
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newCategory.icon}
              onValueChange={(value) => {
                const iconInfo = categoryIconsWithColors.find(c => c.icon === value);
                setNewCategory({ ...newCategory, icon: value, color: iconInfo?.color || newCategory.color });
              }}
            >
              <SelectTrigger className="bg-background h-11">
                <SelectValue placeholder="Ícone..." />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50 max-h-[300px]">
                {categoryIconsWithColors.map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <SelectItem key={item.icon} value={item.icon}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                          <IconComponent className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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

        {/* Lista de Categorias */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            Categorias ({categories.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7">Expandir</Button>
            <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7">Recolher</Button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.map((category) => {
            const catSubcategories = subcategories.get(category.id) || [];
            const isExpanded = expandedCategories.has(category.id);
            const IconComponent = getIconComponent(category.icon);

            return (
              <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="flex items-center justify-between p-2 hover:bg-accent/50 transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color }}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      {editingCategoryId === category.id ? (
                        <div className="flex items-center gap-2 flex-wrap flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editCategoryForm.nome}
                            onChange={(e) => setEditCategoryForm({ ...editCategoryForm, nome: e.target.value })}
                            className="h-7 max-w-[120px] text-sm"
                          />
                          <Select value={editCategoryForm.tipo} onValueChange={(v) => setEditCategoryForm({ ...editCategoryForm, tipo: v })}>
                            <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-background border z-50">
                              <SelectItem value="fixo">Fixo</SelectItem>
                              <SelectItem value="variavel">Variável</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="color" value={editCategoryForm.color} onChange={(e) => setEditCategoryForm({ ...editCategoryForm, color: e.target.value })} className="h-7 w-12" />
                        </div>
                      ) : (
                        <span className="font-medium text-sm">{category.name}</span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{category.tipo}</span>
                      {catSubcategories.length > 0 && <span className="text-xs text-muted-foreground">({catSubcategories.length})</span>}
                    </CollapsibleTrigger>
                    
                    <div className="flex gap-1">
                      {editingCategoryId === category.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleSaveCategoryEdit(); }}>
                            <Save className="w-3.5 h-3.5 text-success" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingCategoryId(null); }}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-danger/10 hover:text-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                      {catSubcategories.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {catSubcategories.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 ml-6 border-l-2" style={{ borderLeftColor: category.color + '60' }}>
                              {editingSubcategoryId === sub.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editSubcategoryForm.name}
                                    onChange={(e) => setEditSubcategoryForm({ name: e.target.value })}
                                    className="h-7 text-sm flex-1"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSubcategoryEdit(category.name); }}
                                  />
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveSubcategoryEdit(category.name)}>
                                    <Save className="w-3 h-3 text-success" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingSubcategoryId(null)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{sub.name}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10" onClick={() => handleEditSubcategory(sub)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-danger/10 hover:text-danger" onClick={() => handleDeleteSubcategory(sub, category.name)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 ml-6">
                        <Input
                          placeholder="Nova subcategoria..."
                          value={newSubcategory[category.id] || ""}
                          onChange={(e) => setNewSubcategory({ ...newSubcategory, [category.id]: e.target.value })}
                          className="h-8 text-sm bg-background"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubcategory(category); }}
                        />
                        <Button size="sm" onClick={() => handleAddSubcategory(category)} className="h-8 px-3">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma categoria cadastrada ainda</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CategorySubcategoryManager;
