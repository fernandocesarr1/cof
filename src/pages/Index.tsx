import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Wallet } from "lucide-react";
import Dashboard from "@/components/budget/Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // Senha padrão para demonstração
    if (password === "familia2024" || password === "demo") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 gradient-primary rounded-full blur-3xl opacity-20 animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-20 animate-pulse-glow" style={{ animationDelay: "1s" }} />
        
        <Card className="relative z-10 w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
          <div className="gradient-primary p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
            <p className="text-white/90 text-sm">Controle Orçamentário Familiar</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Senha de Acesso</label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-base gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Entrar
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              💡 Dica: Use "demo" para acesso rápido
            </p>
          </div>
        </Card>
        
        <p className="absolute bottom-8 text-center text-xs text-muted-foreground">
          🔒 Seus dados são sincronizados com segurança
        </p>
      </div>
    );
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
};

export default Index;
