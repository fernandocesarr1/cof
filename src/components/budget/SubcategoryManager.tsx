import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, ChevronDown, ChevronRight, FolderOpen, Folder, ArrowLeft
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  icon: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  tipo: string;
  subcategories?: Subcategory[];
}

interface SubcategoryManagerProps {
  categories?: Category[];
  onUpdate?: () => void;
  onBack?: () => void;
}

const SubcategoryManager = ({ categories: externalCategories, onUpdate, onBack }: SubcategoryManagerProps) => {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [subcategories, setSubcategories] = useState<Map<string, Subcategory[]>>(new Map());
  const [newSubcategory, setNewSubcategory] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(externalCategories || []);

  useEffect(() => {
    if (!externalCategories) {
      loadCategories();
    }
  }, []);

  useEffect(() => {
    if (externalCategories) {
      setCategories(externalCategories);
    }
  }, [externalCategories]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as any;
    return Icon || LucideIcons.Tag;
  };

  useEffect(() => {
    loadSubcategories();
  }, [categories]);

  const loadSubcategories = async () => {
    try {
      // @ts-ignore - subcategories table may not exist yet
      const { data, error } = await supabase
        .from('subcategories' as any)
        .select('*')
        .order('name');

      if (error) {
        console.log('Subcategories table may not exist yet:', error.message);
        return;
      }

      const subMap = new Map<string, Subcategory[]>();
      if (data && Array.isArray(data)) {
        data.forEach((sub: any) => {
          const existing = subMap.get(sub.category_id) || [];
          subMap.set(sub.category_id, [...existing, sub as Subcategory]);
        });
      }
      setSubcategories(subMap);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
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

  const handleAddSubcategory = async (category: Category) => {
    const name = newSubcategory[category.id]?.trim();
    if (!name) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da subcategoria.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // @ts-ignore - subcategories table may not exist yet
    const { error } = await supabase
      .from('subcategories' as any)
      .insert({
        name,
        category_id: category.id,
        icon: category.icon,
        color: category.color,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao adicionar subcategoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logActivity({
        action: "criar",
        entityType: "Categoria",
        entityName: `${category.name} > ${name}`,
      });

      toast({
        title: "Subcategoria adicionada!",
        description: `${name} foi criada em ${category.name}.`,
      });
      
      setNewSubcategory({ ...newSubcategory, [category.id]: "" });
      loadSubcategories();
      onUpdate?.();
    }
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory, categoryName: string) => {
    // @ts-ignore - subcategories table may not exist yet
    const { error } = await supabase
      .from('subcategories' as any)
      .delete()
      .eq('id', subcategory.id);

    if (error) {
      toast({
        title: "Erro ao deletar subcategoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await logActivity({
        action: "deletar",
        entityType: "Categoria",
        entityName: `${categoryName} > ${subcategory.name}`,
      });

      toast({
        title: "Subcategoria deletada",
        description: `${subcategory.name} foi removida.`,
      });
      
      loadSubcategories();
      onUpdate?.();
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  };

  return (
    <Card className={`p-4 ${onBack ? 'max-w-2xl mx-auto shadow-lg gradient-card' : 'mt-4 bg-accent/30 border-dashed'}`}>
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold text-foreground flex items-center gap-2 ${onBack ? 'text-xl' : 'text-sm'}`}>
          <FolderOpen className={`text-primary ${onBack ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {onBack ? 'Gerenciar Subcategorias' : 'Subcategorias (opcional)'}
        </h4>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7">
            Expandir
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7">
            Recolher
          </Button>
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
                <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                    {catSubcategories.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({catSubcategories.length})
                      </span>
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                    {/* Lista de subcategorias */}
                    {catSubcategories.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {catSubcategories.map((sub) => (
                          <div 
                            key={sub.id} 
                            className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 ml-4 border-l-2"
                            style={{ borderLeftColor: category.color + '60' }}
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm text-foreground">{sub.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-danger/10 hover:text-danger"
                              onClick={() => handleDeleteSubcategory(sub, category.name)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar nova subcategoria */}
                    <div className="flex gap-2 ml-4">
                      <Input
                        placeholder="Nova subcategoria..."
                        value={newSubcategory[category.id] || ""}
                        onChange={(e) => setNewSubcategory({ 
                          ...newSubcategory, 
                          [category.id]: e.target.value 
                        })}
                        className="h-8 text-sm bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSubcategory(category);
                          }
                        }}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleAddSubcategory(category)}
                        disabled={loading}
                        className="h-8 px-3"
                      >
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
        <p className="text-sm text-muted-foreground text-center py-4">
          Adicione categorias primeiro para criar subcategorias.
        </p>
      )}
    </Card>
  );
};

export default SubcategoryManager;
