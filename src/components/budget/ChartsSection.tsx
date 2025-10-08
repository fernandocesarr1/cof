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
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Evolução Mensal</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Gastos ao longo do ano</p>
            </div>
          </div>
          <Select defaultValue={currentYear.toString()}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-60 sm:h-80 flex items-center justify-center bg-muted/30 rounded-xl">
          <div className="text-center px-4">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Gráfico de evolução mensal</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Os gráficos serão exibidos quando houver dados
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-warning rounded-lg sm:rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Gastos por Categoria</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Distribuição mensal</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select defaultValue="0">
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-60 sm:h-80 flex items-center justify-center bg-muted/30 rounded-xl">
          <div className="text-center px-4">
            <PieChartIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Gráfico de categorias</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Os gráficos serão exibidos quando houver dados
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChartsSection;
