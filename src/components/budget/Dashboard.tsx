import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Download
} from "lucide-react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import StatsOverview from "./StatsOverview";
import ChartsSection from "./ChartsSection";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("add");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Orçamento Familiar</h1>
                <p className="text-xs text-muted-foreground">Gestão Financeira</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-muted-foreground hover:text-danger"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-card shadow-md">
            <TabsTrigger value="add" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Gastos</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Gráficos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="animate-fade-in">
            <ExpenseForm />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Total do Mês</p>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">0% do limite</p>
              </Card>

              <Card className="p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Gastos Fixos</p>
                  <CalendarDays className="w-5 h-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">6 categorias</p>
              </Card>

              <Card className="p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Gastos Variáveis</p>
                  <PieChart className="w-5 h-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">3 categorias</p>
              </Card>

              <Card className="p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">Fernando vs Estefania</p>
              </Card>
            </div>

            <StatsOverview />
          </TabsContent>

          <TabsContent value="expenses" className="animate-fade-in">
            <ExpenseList />
          </TabsContent>

          <TabsContent value="charts" className="animate-fade-in">
            <ChartsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
