import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-logger";
import * as XLSX from 'xlsx';

interface ExpenseRow {
  data: string | number;
  descricao: string;
  valor: string | number;
  categoria?: string;
  pessoa?: string;
}

const ExpenseImport = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExpenseRow[];

      // Carregar categorias e pessoas para fazer o match
      const { data: categories } = await supabase.from('categories').select('*');
      const { data: people } = await supabase.from('people').select('*');

      let successCount = 0;
      let failedCount = 0;

      for (const row of jsonData) {
        try {
          // Esperado: data, descricao, valor, categoria, pessoa
          const category = categories?.find(c => 
            c.name.toLowerCase() === row.categoria?.toLowerCase()
          );
          const person = people?.find(p => 
            p.name.toLowerCase() === row.pessoa?.toLowerCase()
          );

          if (!row.data || !row.descricao || !row.valor) {
            failedCount++;
            continue;
          }

          // Converter data (aceita DD/MM/YYYY ou YYYY-MM-DD)
          let date: string;
          if (typeof row.data === 'string') {
            if (row.data.includes('/')) {
              const [day, month, year] = row.data.split('/');
              date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              date = row.data;
            }
          } else {
            // Excel date number
            const excelDate = new Date((row.data - 25569) * 86400 * 1000);
            date = excelDate.toISOString().split('T')[0];
          }

          const { error } = await supabase.from('expenses').insert({
            date,
            description: row.descricao,
            amount: parseFloat(String(row.valor).replace(',', '.')),
            category_id: category?.id || null,
            person_id: person?.id || null
          });

          if (error) {
            failedCount++;
          } else {
            successCount++;
            await logActivity({
              action: 'criar',
              entityType: 'Despesa',
              entityName: row.descricao,
              personId: person?.id || undefined
            });
          }
        } catch (err) {
          failedCount++;
        }
      }

      setResult({ success: successCount, failed: failedCount });
      
      if (successCount > 0) {
        toast.success(`${successCount} despesa(s) importada(s) com sucesso!`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} despesa(s) falharam na importação`);
      }

    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao processar planilha");
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="p-4 sm:p-6 shadow-lg gradient-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-success rounded-lg sm:rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Importar Despesas</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Upload de planilha Excel ou CSV</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Formato esperado: data, descricao, valor, categoria, pessoa
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
            id="file-upload"
          />
          <Button asChild disabled={importing}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {importing ? "Importando..." : "Selecionar Arquivo"}
            </label>
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            {result.success > 0 && (
              <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{result.success} despesa(s) importada(s)</span>
              </div>
            )}
            {result.failed > 0 && (
              <div className="flex items-center gap-2 text-danger bg-danger/10 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{result.failed} despesa(s) falharam</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg text-xs sm:text-sm space-y-2">
          <p className="font-semibold">Instruções:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Colunas: data, descricao, valor, categoria, pessoa</li>
            <li>Data: DD/MM/YYYY ou YYYY-MM-DD</li>
            <li>Valor: use ponto ou vírgula como decimal</li>
            <li>Categoria e pessoa devem existir no sistema</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseImport;
