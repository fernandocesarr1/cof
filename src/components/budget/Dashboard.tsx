import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  PlusCircle, 
  PieChart, 
  Settings, 
  LogOut,
  TrendingUp,
  Wallet,
  CalendarDays,
  Users,
  Bell,
  ClipboardList,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import StatsOverview from "./StatsOverview";
import ChartsSection from "./ChartsSection";
import CategorySubcategoryManager from "./CategorySubcategoryManager";
import Notifications from "./Notifications";
import SettingsComponent from "./Settings";
import MonthYearSelector from "./MonthYearSelector";
import PlannedExpenses from "./PlannedExpenses";

import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("add");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [totalAno, setTotalAno] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [peopleData, setPeopleData] = useState<any[]>([]);
  const [peopleDataYear, setPeopleDataYear] = useState<any[]>([]);
  const [plannedStats, setPlannedStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0, paidCount: 0, totalCount: 0 });

  useEffect(() => {
    loadTotals();
    loadPlannedStats();
    
    // Realtime subscription para atualizar quando houver mudanças
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        () => {
          loadTotals();
          loadPlannedStats();
        }
      )
      .subscribe();

    const plannedChannel = supabase
      .channel('planned-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planned_expense_payments'
        },
        () => {
          loadPlannedStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(plannedChannel);
    };
  }, [refreshTrigger, selectedMonth, selectedYear]);

  const loadTotals = async () => {
    // Dados do mês
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        *,
        people (id, name)
      `)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);
    
    if (expenses && expenses.length > 0) {
      const total = expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
      
      setTotalMes(total);
      
      // Calcular gastos por pessoa no mês
      const peopleMap = new Map();
      expenses.forEach(e => {
        if (e.people?.id) {
          const current = peopleMap.get(e.people.id) || { name: e.people.name, value: 0 };
          current.value += parseFloat(String(e.amount || 0));
          peopleMap.set(e.people.id, current);
        }
      });
      setPeopleData(Array.from(peopleMap.values()));
    } else {
      setTotalMes(0);
      setPeopleData([]);
    }

    // Dados do ano
    const firstDayYear = new Date(selectedYear, 0, 1);
    const lastDayYear = new Date(selectedYear, 11, 31);
    
    const { data: expensesYear } = await supabase
      .from('expenses')
      .select(`
        *,
        people (id, name)
      `)
      .gte('date', firstDayYear.toISOString().split('T')[0])
      .lte('date', lastDayYear.toISOString().split('T')[0]);
    
    if (expensesYear && expensesYear.length > 0) {
      const totalYear = expensesYear.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
      setTotalAno(totalYear);
      
      // Calcular gastos por pessoa no ano
      const peopleMapYear = new Map();
      expensesYear.forEach(e => {
        if (e.people?.id) {
          const current = peopleMapYear.get(e.people.id) || { name: e.people.name, value: 0 };
          current.value += parseFloat(String(e.amount || 0));
          peopleMapYear.set(e.people.id, current);
        }
      });
      setPeopleDataYear(Array.from(peopleMapYear.values()));
    } else {
      setTotalAno(0);
      setPeopleDataYear([]);
    }
  };

  const loadPlannedStats = async () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Load all active planned expenses for selected month
    const { data: expenses } = await supabase
      .from('planned_expenses')
      .select('*')
      .eq('active', true);

    if (!expenses) {
      setPlannedStats({ total: 0, paid: 0, pending: 0, overdue: 0, paidCount: 0, totalCount: 0 });
      return;
    }

    // Filter expenses to only show those created before or during the selected month
    const filteredExpenses = expenses.filter((expense: any) => {
      const createdAt = new Date(expense.created_at);
      const createdMonth = createdAt.getMonth();
      const createdYear = createdAt.getFullYear();
      return createdYear < selectedYear || 
             (createdYear === selectedYear && createdMonth <= selectedMonth);
    });

    // Load payments for selected month/year
    const { data: payments } = await supabase
      .from('planned_expense_payments')
      .select('*')
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    const paymentMap = new Map(payments?.map(p => [p.planned_expense_id, p]) || []);

    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;

    filteredExpenses.forEach((expense: any) => {
      totalExpected += expense.amount;
      const payment = paymentMap.get(expense.id) as any;
      const isPaid = payment?.paid || false;
      
      if (isPaid) {
        totalPaid += payment.paid_amount ?? expense.amount;
        paidCount++;
      } else {
        totalPending += expense.amount;
        
        // Check if overdue
        const isOverdue = selectedYear < currentYear || 
          (selectedYear === currentYear && selectedMonth < currentMonth) ||
          (selectedYear === currentYear && selectedMonth === currentMonth && today.getDate() > expense.due_day);
        
        if (isOverdue) {
          totalOverdue += expense.amount;
        }
      }
    });

    setPlannedStats({
      total: totalExpected,
      paid: totalPaid,
      pending: totalPending,
      overdue: totalOverdue,
      paidCount,
      totalCount: filteredExpenses.length
    });
  };

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getDiferencaMes = () => {
    if (peopleData.length === 2) {
      return Math.abs(peopleData[0].value - peopleData[1].value);
    }
    return 0;
  };

  const getDiferencaAno = () => {
    if (peopleDataYear.length === 2) {
      return Math.abs(peopleDataYear[0].value - peopleDataYear[1].value);
    }
    return 0;
  };

  const getQuemGastouMenos = (data: any[]) => {
    if (data.length === 2 && data[0].value !== data[1].value) {
      return data[0].value < data[1].value ? data[0].name : data[1].name;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-foreground">Orçamento Familiar</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Gestão Financeira</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-muted-foreground hover:text-danger"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="flex justify-center overflow-x-auto pb-2">
            <TabsList className="grid grid-cols-6 lg:inline-grid bg-card shadow-md">
              <TabsTrigger value="add" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Gráficos</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Gastos</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="add" className="animate-fade-in space-y-6">
            {showCategoryManager ? (
              <CategorySubcategoryManager onBack={() => setShowCategoryManager(false)} />
            ) : (
              <>
                <ExpenseForm 
                  onManageCategories={() => setShowCategoryManager(true)}
                  onManagePeople={() => {}}
                  onExpenseAdded={handleExpenseAdded}
                />
                <PlannedExpenses onPaymentChange={loadPlannedStats} />
              </>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex justify-end mb-4">
              <MonthYearSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </div>
            
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {/* Total do Mês + Diferença do Mês */}
              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total do Mês</p>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ {totalMes.toFixed(2)}</p>
                
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      Diferença
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-foreground">
                      R$ {getDiferencaMes().toFixed(2)}
                    </p>
                  </div>
                  {getQuemGastouMenos(peopleData) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getQuemGastouMenos(peopleData)} gastou menos
                    </p>
                  )}
                </div>
              </Card>

              {/* Total do Ano + Diferença do Ano */}
              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total do Ano</p>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ {totalAno.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Acumulado {selectedYear}</p>
                
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      Diferença
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-foreground">
                      R$ {getDiferencaAno().toFixed(2)}
                    </p>
                  </div>
                  {getQuemGastouMenos(peopleDataYear) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getQuemGastouMenos(peopleDataYear)} gastou menos
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Resumo de Gastos Previstos */}
            <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Gastos Previstos
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Previsto</p>
                  <p className="text-lg font-bold text-foreground">R$ {plannedStats.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    Pagos
                  </p>
                  <p className="text-lg font-bold text-success">
                    R$ {plannedStats.paid.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({plannedStats.paidCount}/{plannedStats.totalCount})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className="text-lg font-bold text-foreground">R$ {plannedStats.pending.toFixed(2)}</p>
                </div>
                {plannedStats.overdue > 0 && (
                  <div>
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Atrasados
                    </p>
                    <p className="text-lg font-bold text-danger">R$ {plannedStats.overdue.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </Card>

            <StatsOverview 
              refreshTrigger={refreshTrigger} 
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </TabsContent>

          <TabsContent value="expenses" className="animate-fade-in">
            <ExpenseList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="charts" className="animate-fade-in">
            <ChartsSection />
          </TabsContent>

          <TabsContent value="notifications" className="animate-fade-in">
            <Notifications />
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsComponent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;