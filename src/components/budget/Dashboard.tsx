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
import CategoryManager from "./CategoryManager";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("add");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-card shadow-md">
            <TabsTrigger value="add" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Gastos</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Gráficos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="animate-fade-in">
            {showCategoryManager ? (
              <CategoryManager onBack={() => setShowCategoryManager(false)} />
            ) : (
              <ExpenseForm onManageCategories={() => setShowCategoryManager(true)} />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total do Mês</p>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">0% do limite</p>
              </Card>

              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Gastos Fixos</p>
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">6 categorias</p>
              </Card>

              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Gastos Variáveis</p>
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">3 categorias</p>
              </Card>

              <Card className="p-4 sm:p-6 gradient-card border-none shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo</p>
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground">R$ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Fernando vs Estefania</p>
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
