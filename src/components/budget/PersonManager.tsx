import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Plus, Trash2, Edit, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PersonManagerProps {
  onBack: () => void;
}

const PersonManager = ({ onBack }: PersonManagerProps) => {
  const { toast } = useToast();
  const [people, setPeople] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const colors = [
    "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", 
    "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"
  ];

  useEffect(() => {
    loadPeople();
  }, []);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (personId: string) => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${personId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a pessoa.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (editingId) {
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(editingId);
      }

      const updateData: any = { name, color };
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Erro ao atualizar pessoa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pessoa atualizada!",
          description: `${name} foi atualizado com sucesso.`,
        });
        setEditingId(null);
      }
    } else {
      const { data: newPerson, error } = await supabase
        .from('people')
        .insert({ name, color })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao adicionar pessoa",
          description: error.message,
          variant: "destructive",
        });
      } else if (newPerson) {
        let avatarUrl = null;
        if (avatarFile) {
          avatarUrl = await uploadAvatar(newPerson.id);
          if (avatarUrl) {
            await supabase
              .from('people')
              .update({ avatar_url: avatarUrl })
              .eq('id', newPerson.id);
          }
        }

        toast({
          title: "Pessoa adicionada!",
          description: `${name} foi adicionado com sucesso.`,
        });
      }
    }

    setLoading(false);
    setName("");
    setColor("#8B5CF6");
    setAvatarFile(null);
    setAvatarPreview(null);
    loadPeople();
  };

  const handleEdit = (person: any) => {
    setName(person.name);
    setColor(person.color);
    setEditingId(person.id);
    setAvatarPreview(person.avatar_url);
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar pessoa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pessoa deletada",
        description: `${name} foi removido com sucesso.`,
      });
      loadPeople();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Gerenciar Pessoas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Adicione ou edite pessoas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-10 h-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/20">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Escolher foto</span>
                  </div>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 gradient-primary"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? "Atualizar Pessoa" : "Adicionar Pessoa"}
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground mb-3">Pessoas Cadastradas</h3>
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma pessoa cadastrada ainda
            </p>
          ) : (
            people.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={person.avatar_url || undefined} />
                    <AvatarFallback style={{ backgroundColor: person.color }}>
                      <User className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{person.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(person)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(person.id, person.name)}
                    className="h-8 w-8 hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default PersonManager;
