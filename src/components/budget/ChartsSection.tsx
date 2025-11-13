import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MonthYearSelector from "./MonthYearSelector";

const ChartsSection = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryMonth, setCategoryMonth] = useState(new Date().getMonth());
  const [categoryYear, setCategoryYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [peopleMonthlyData, setPeopleMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [singleCategoryData, setSingleCategoryData] = useState<any[]>([]);

  const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    loadChartData();
  }, [selectedYear]);

  useEffect(() => {
    loadCategoryData();
  }, [categoryMonth, categoryYear, selectedPerson]);

  useEffect(() => {
    if (selectedCategory) {
      loadSingleCategoryData();
    }
  }, [selectedCategory, categoryYear, selectedPerson]);

  const loadChartData = async () => {
    setLoading(true);
    
    // Carregar categorias
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(categoriesData || []);
    
    // Carregar pessoas
    const { data: peopleData } = await supabase
      .from('people')
      .select('*')
      .order('name');
    setPeople(peopleData || []);
    
    // Dados mensais do ano selecionado - Total + por pessoa
    const monthlyPromises = Array.from({ length: 12 }, async (_, i) => {
      const firstDay = new Date(selectedYear, i, 1);
      const lastDay = new Date(selectedYear, i + 1, 0);
      
      const { data } = await supabase
        .from('expenses')
        .select(`
          amount,
          people (id, name, color)
        `)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
      
      const total = data?.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0) || 0;
      
      // Agrupar por pessoa
      const peopleMap = new Map();
      data?.forEach(e => {
        if (e.people?.name) {
          const current = peopleMap.get(e.people.name) || 0;
          peopleMap.set(e.people.name, current + parseFloat(String(e.amount || 0)));
        }
      });
      
      const result: any = {
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        total: total
      };
      
      peopleMap.forEach((value, name) => {
        result[name] = value;
      });
      
      return result;
    });
    
    const monthlyResults = await Promise.all(monthlyPromises);
    setMonthlyData(monthlyResults);
    
    // Obter nomes únicos de pessoas para o gráfico com cores
    const allPeopleNames = new Map<string, string>();
    peopleData?.forEach(person => {
      allPeopleNames.set(person.name, person.color);
    });
    setPeopleMonthlyData(Array.from(allPeopleNames.entries()).map(([name, color]) => ({ name, color })));
    
    setLoading(false);
  };

  const loadCategoryData = async () => {
    // Todas as categorias do mês selecionado
    const firstDay = new Date(categoryYear, categoryMonth, 1);
    const lastDay = new Date(categoryYear, categoryMonth + 1, 0);
    
    let query = supabase
      .from('expenses')
      .select(`
        amount,
        categories (name, color),
        people (id, name)
      `)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);
    
    if (selectedPerson !== 'all') {
      query = query.eq('person_id', selectedPerson);
    }
    
    const { data: expenses } = await query;
    
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
  };

  const loadSingleCategoryData = async () => {
    if (!selectedCategory) {
      setSingleCategoryData([]);
      return;
    }

    // Uma categoria ao longo dos meses do ano
    const monthlyPromises = Array.from({ length: 12 }, async (_, i) => {
      const firstDay = new Date(categoryYear, i, 1);
      const lastDay = new Date(categoryYear, i + 1, 0);
      
      let query = supabase
        .from('expenses')
        .select('amount')
        .eq('category_id', selectedCategory)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
      
      if (selectedPerson !== 'all') {
        query = query.eq('person_id', selectedPerson);
      }
      
      const { data } = await query;
      
      const total = data?.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0) || 0;
      
      return {
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        value: total
      };
    });
    
    const results = await Promise.all(monthlyPromises);
    setSingleCategoryData(results);
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
      {/* Evolução Mensal - Total + Pessoas */}
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
          <div className="flex gap-2">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-10 px-3 bg-card border border-border rounded-md text-foreground text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: window.innerWidth < 640 ? '12px' : '14px'
              }}
              formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
            />
            <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total"
            />
            {peopleMonthlyData.map((person, index) => (
              <Line 
                key={person.name}
                type="monotone" 
                dataKey={person.name} 
                stroke={person.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="5 5"
                name={person.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Distribuição por Categoria - Mês/Ano específico */}
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-warning rounded-lg sm:rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Distribuição por Categoria</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Gastos do mês selecionado</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <MonthYearSelector
              selectedMonth={categoryMonth}
              selectedYear={categoryYear}
              onMonthChange={setCategoryMonth}
              onYearChange={setCategoryYear}
            />
            
            <select 
              value={selectedPerson} 
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="h-9 px-3 bg-card border border-border rounded-md text-foreground text-sm min-w-[150px]"
            >
              <option value="all">Todos</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-60 sm:h-80 flex items-center justify-center bg-muted/30 rounded-xl">
            <p className="text-muted-foreground text-sm">Nenhum gasto no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  window.innerWidth < 640 
                    ? `${(percent * 100).toFixed(0)}%` 
                    : `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={window.innerWidth < 640 ? 60 : 80}
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
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 640 ? '12px' : '14px'
                }}
                formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Evolução de Categoria Específica */}
      <Card className="p-4 sm:p-6 shadow-lg gradient-card">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">Evolução por Categoria</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Acompanhamento mensal</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 bg-card border border-border rounded-md text-foreground text-sm min-w-[150px]"
            >
              <option value="">Selecione uma Categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select 
              value={categoryYear} 
              onChange={(e) => setCategoryYear(parseInt(e.target.value))}
              className="h-9 px-3 bg-card border border-border rounded-md text-foreground text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select 
              value={selectedPerson} 
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="h-9 px-3 bg-card border border-border rounded-md text-foreground text-sm min-w-[150px]"
            >
              <option value="all">Todos</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedCategory ? (
          <div className="h-60 sm:h-80 flex items-center justify-center bg-muted/30 rounded-xl">
            <p className="text-muted-foreground text-sm">Selecione uma categoria para visualizar</p>
          </div>
        ) : singleCategoryData.length === 0 ? (
          <div className="h-60 sm:h-80 flex items-center justify-center bg-muted/30 rounded-xl">
            <p className="text-muted-foreground text-sm">Nenhum gasto no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <LineChart data={singleCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 640 ? '12px' : '14px'
                }}
                formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default ChartsSection;
