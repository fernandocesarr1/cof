import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MonthYearSelector from "./MonthYearSelector";

const ChartsSection = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [peopleData, setPeopleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    loadChartData();
  }, [selectedMonth, selectedYear]);

  const loadChartData = async () => {
    setLoading(true);
    
    // Dados mensais do ano selecionado
    const monthlyPromises = Array.from({ length: 12 }, async (_, i) => {
      const firstDay = new Date(selectedYear, i, 1);
      const lastDay = new Date(selectedYear, i + 1, 0);
      
      const { data } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
      
      const total = data?.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0) || 0;
      
      return {
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        total: total
      };
    });
    
    const monthlyResults = await Promise.all(monthlyPromises);
    setMonthlyData(monthlyResults);
    
    // Dados por categoria do mês selecionado
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        amount,
        categories (name, color),
        people (name, color)
      `)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);
    
    // Agrupar por categoria
    const categoryMap = new Map();
    expenses?.forEach(e => {
      const catName = e.categories?.name || 'Sem categoria';
      const current = categoryMap.get(catName) || 0;
      categoryMap.set(catName, current + parseFloat(String(e.amount || 0)));
    });
    
    const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
    setCategoryData(catData);
    
    // Agrupar por pessoa
    const peopleMap = new Map();
    expenses?.forEach(e => {
      const personName = e.people?.name || 'Sem pessoa';
      const current = peopleMap.get(personName) || 0;
      peopleMap.set(personName, current + parseFloat(String(e.amount || 0)));
    });
    
    const pplData = Array.from(peopleMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
    setPeopleData(pplData);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 shadow-lg gradient-card">
          <p className="text-center text-muted-foreground">Carregando gráficos...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Evolução Mensal */}
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Evolução Mensal</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Gastos ao longo do ano</p>
            </div>
          </div>
          <MonthYearSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gastos por Categoria */}
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-warning rounded-lg sm:rounded-xl flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-foreground">Gastos por Categoria</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Distribuição mensal</p>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-80 flex items-center justify-center bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">Nenhum gasto no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Gastos por Pessoa */}
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-secondary rounded-lg sm:rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-foreground">Gastos por Pessoa</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Comparação mensal</p>
          </div>
        </div>

        {peopleData.length === 0 ? (
          <div className="h-80 flex items-center justify-center bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">Nenhum gasto no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peopleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" name="Gasto Total" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default ChartsSection;
