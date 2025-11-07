import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "criar" | "atualizar" | "deletar";
export type EntityType = "Despesa" | "Categoria";

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityName: string;
  details?: string;
}

export const logActivity = async ({
  action,
  entityType,
  entityName,
  details,
}: LogActivityParams) => {
  try {
    await supabase.from("activities").insert({
      action,
      entity_type: entityType,
      entity_name: entityName,
      details: details || null,
    });
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
  }
};
