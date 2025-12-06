import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "criar" | "atualizar" | "deletar";
export type EntityType = "Despesa" | "Categoria" | "Pessoa";

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityName: string;
  details?: string;
  personId?: string;
}

export const logActivity = async ({
  action,
  entityType,
  entityName,
  details,
  personId,
}: LogActivityParams) => {
  try {
    await supabase.from("activities").insert({
      action,
      entity_type: entityType,
      entity_name: entityName,
      details: details || null,
      person_id: personId || null,
    });
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
  }
};
