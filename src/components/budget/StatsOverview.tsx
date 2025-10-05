import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const StatsOverview = () => {
  const categories = [
    { name: "Escola", value: 0, limit: 1500, type: "fixo" },
    { name: "Diarista", value: 0, limit: 800, type: "fixo" },
    { name: "Internet", value: 0, limit: 100, type: "fixo" },
    { name: "Supermercado", value: 0, limit: 1000, type: "variavel" },
    { name: "Farmácia", value: 0, limit: 300, type: "variavel" },
    { name: "Lazer", value: 0, limit: 500, type: "variavel" },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-danger";
    if (percentage >= 80) return "bg-warning";
    return "bg-success";
  };

  return (
    <Card className="p-6 shadow-lg gradient-card">
      <h2 className="text-xl font-bold text-foreground mb-6">Gastos por Categoria</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gastos Fixos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-success rounded-full" />
            <h3 className="font-semibold text-foreground">Gastos Fixos</h3>
          </div>
          {categories.filter(c => c.type === "fixo").map((category, index) => {
            const percentage = category.limit > 0 ? (category.value / category.limit) * 100 : 0;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      R$ {category.value.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-bold text-foreground">
                      R$ {category.limit.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% utilizado
                </p>
              </div>
            );
          })}
        </div>

        {/* Gastos Variáveis */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-warning rounded-full" />
            <h3 className="font-semibold text-foreground">Gastos Variáveis</h3>
          </div>
          {categories.filter(c => c.type === "variavel").map((category, index) => {
            const percentage = category.limit > 0 ? (category.value / category.limit) * 100 : 0;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      R$ {category.value.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-bold text-foreground">
                      R$ {category.limit.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% utilizado
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default StatsOverview;
