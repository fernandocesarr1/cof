import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Key, Save, Users, Trash2, Plus, Upload, FileSpreadsheet, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activity-logger";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpenseRow {
  data: string | number;
  descricao: string;
  valor: string | number;
  categoria?: string;
  pessoa?: string;
}

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Gerenciar Pessoas
  const [people, setPeople] = useState<any[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonColor, setNewPersonColor] = useState("#8B5CF6");
  const [loadingPeople, setLoadingPeople] = useState(false);

  // Importar
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  // Exportar
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    loadPeople();
    loadExpenses();
  }, []);

  const loadPeople = async () => {
    const { data } = await supabase.from('people').select('*').order('name');
    setPeople(data || []);
  };

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select(`*, categories (name, tipo), subcategories (name), people (name)`)
      .order('date', { ascending: false });
    setExpenses(data || []);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Senha alterada com sucesso",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    setLoadingPeople(true);

    const { error } = await supabase.from('people').insert({
      name: newPersonName.trim(),
      color: newPersonColor,
    });

    if (error) {
      toast({ title: "Erro ao adicionar pessoa", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "criar", entityType: "Pessoa", entityName: newPersonName });
      toast({ title: "Pessoa adicionada!" });
      setNewPersonName("");
      loadPeople();
    }
    setLoadingPeople(false);
  };

  const handleDeletePerson = async (id: string, name: string) => {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao deletar pessoa", description: error.message, variant: "destructive" });
    } else {
      await logActivity({ action: "deletar", entityType: "Pessoa", entityName: name });
      toast({ title: "Pessoa removida!" });
      loadPeople();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExpenseRow[];

      const { data: categories } = await supabase.from('categories').select('*');
      const { data: peopleData } = await supabase.from('people').select('*');

      let successCount = 0;
      let failedCount = 0;

      for (const row of jsonData) {
        try {
          const category = categories?.find(c => c.name.toLowerCase() === row.categoria?.toLowerCase());
          const person = peopleData?.find(p => p.name.toLowerCase() === row.pessoa?.toLowerCase());

          if (!row.data || !row.descricao || !row.valor) {
            failedCount++;
            continue;
          }

          let date: string;
          if (typeof row.data === 'string') {
            if (row.data.includes('/')) {
              const [day, month, year] = row.data.split('/');
              date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              date = row.data;
            }
          } else {
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
            await logActivity({ action: 'criar', entityType: 'Despesa', entityName: row.descricao, personId: person?.id });
          }
        } catch {
          failedCount++;
        }
      }

      setImportResult({ success: successCount, failed: failedCount });
      if (successCount > 0) toast({ title: `${successCount} despesa(s) importada(s)!` });
      if (failedCount > 0) toast({ title: `${failedCount} falharam`, variant: "destructive" });
      loadExpenses();
    } catch {
      toast({ title: "Erro ao processar planilha", variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const exportToExcel = () => {
    const data = expenses.map(expense => ({
      'Data': new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      'Categoria': expense.categories?.name || 'Sem categoria',
      'Subcategoria': expense.subcategories?.name || '-',
      'Descrição': expense.description,
      'Valor': parseFloat(expense.amount).toFixed(2),
      'Pessoa': expense.people?.name || '-',
      'Tipo': expense.categories?.tipo === 'fixo' ? 'Fixo' : 'Variável'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
    XLSX.writeFile(wb, `gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Excel exportado!" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Gastos', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const tableData = expenses.map(expense => [
      new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      expense.categories?.name || 'Sem categoria',
      expense.subcategories?.name || '-',
      expense.description.substring(0, 30),
      `R$ ${parseFloat(expense.amount).toFixed(2)}`,
      expense.people?.name || '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'Categoria', 'Subcategoria', 'Descrição', 'Valor', 'Pessoa']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + 10);

    doc.save(`gastos_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "PDF exportado!" });
  };

  return (
    <div className="space-y-4">
      {/* Gerenciar Pessoas */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Gerenciar Pessoas</h2>
            <p className="text-sm text-muted-foreground">Adicione ou remova participantes</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Nome da pessoa"
            className="flex-1"
          />
          <Input
            type="color"
            value={newPersonColor}
            onChange={(e) => setNewPersonColor(e.target.value)}
            className="w-14 p-1 h-10"
          />
          <Button onClick={handleAddPerson} disabled={loadingPeople}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {people.map((person) => (
            <div key={person.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: person.color }} />
                <span className="text-sm font-medium">{person.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => handleDeletePerson(person.id, person.name)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Importar/Exportar */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 gradient-success rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Importar / Exportar</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus dados</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Importar */}
          <div className="border border-dashed border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Importar Despesas</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Formato: data, descricao, valor, categoria, pessoa</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={importing} className="hidden" id="file-upload-settings" />
            <Button asChild disabled={importing} variant="outline" className="w-full">
              <label htmlFor="file-upload-settings" className="cursor-pointer">
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </label>
            </Button>
            {importResult && (
              <div className="mt-2 space-y-1">
                {importResult.success > 0 && (
                  <div className="flex items-center gap-2 text-success text-xs">
                    <CheckCircle className="w-4 h-4" />
                    {importResult.success} importada(s)
                  </div>
                )}
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-danger text-xs">
                    <AlertCircle className="w-4 h-4" />
                    {importResult.failed} falharam
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exportar */}
          <div className="border border-dashed border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Exportar Despesas</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Baixe todos os seus gastos</p>
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" className="flex-1 gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" className="flex-1 gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Alterar Senha */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 gradient-warning rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Alterar Senha</h2>
            <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Digite a nova senha" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a nova senha" required disabled={loading} />
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Settings;
