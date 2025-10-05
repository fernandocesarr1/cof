import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

const ChartsSection = () => {
  const currentYear = new Date().getFullYear();
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-lg gradient-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Evolução Mensal</h2>
              <p className="text-sm text-muted-foreground">Gastos ao longo do ano</p>
            </div>
          </div>
          <Select defaultValue={currentYear.toString()}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-80 flex items-center justify-center bg-muted/30 rounded-xl">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Gráfico de evolução mensal</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os gráficos serão exibidos quando houver dados
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-lg gradient-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-warning rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Gastos por Categoria</h2>
              <p className="text-sm text-muted-foreground">Distribuição mensal</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="0">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue={currentYear.toString()}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-80 flex items-center justify-center bg-muted/30 rounded-xl">
          <div className="text-center">
            <PieChartIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Gráfico de categorias</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os gráficos serão exibidos quando houver dados
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChartsSection;
