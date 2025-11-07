import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  details: string | null;
  created_at: string;
}

const Notifications = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "criar":
        return "text-success";
      case "atualizar":
        return "text-warning";
      case "deletar":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "criar":
        return "+";
      case "atualizar":
        return "✎";
      case "deletar":
        return "×";
      default:
        return "•";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Carregando atividades...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Notificações</h2>
            <p className="text-sm text-muted-foreground">Histórico de atividades</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhuma atividade registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getActionColor(activity.action)} bg-background border`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${getActionColor(activity.action)}`}>
                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground font-medium">{activity.entity_type}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      <span className="font-semibold">{activity.entity_name}</span>
                      {activity.details && (
                        <span className="text-muted-foreground"> - {activity.details}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
