import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  showAllMonths?: boolean;
}

const MonthYearSelector = ({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange,
  showAllMonths = false
}: MonthYearSelectorProps) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="flex gap-2">
      <Select 
        value={selectedMonth.toString()} 
        onValueChange={(value) => onMonthChange(parseInt(value))}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border z-50">
          {showAllMonths && (
            <SelectItem value="-1">Total</SelectItem>
          )}
          {months.map((month, index) => (
            <SelectItem key={index} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        type="number"
        value={selectedYear}
        onChange={(e) => {
          const year = parseInt(e.target.value);
          if (!isNaN(year) && year >= 1900 && year <= 2100) {
            onYearChange(year);
          }
        }}
        className="w-24"
        min={1900}
        max={2100}
      />
    </div>
  );
};

export default MonthYearSelector;