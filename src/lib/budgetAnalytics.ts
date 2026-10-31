import {
  ExpenseItem,
  ExpenseCategory,
  RecurringExpenseSuggestion,
  ExpenseSpike,
} from '../types';

export interface BudgetStatus {
  totalBudget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  warningLevel: 'normal' | 'caution' | 'exceeded';
}

/**
 * Calculate the budget status for the given month (defaults to current month YYYY-MM).
 */
export function calculateBudgetStatus(
  expenses: ExpenseItem[],
  monthlyBudget: number,
  targetMonth?: string // YYYY-MM
): BudgetStatus {
  const currentMonthKey = targetMonth || new Date().toISOString().slice(0, 7);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthKey));
  const spent = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = Math.max(0, monthlyBudget - spent);
  const percentageUsed = monthlyBudget > 0 ? Math.round((spent / monthlyBudget) * 100) : 0;

  let warningLevel: 'normal' | 'caution' | 'exceeded' = 'normal';
  if (percentageUsed >= 100) {
    warningLevel = 'exceeded';
  } else if (percentageUsed >= 80) {
    warningLevel = 'caution';
  }

  return {
    totalBudget: monthlyBudget,
    spent,
    remaining,
    percentageUsed,
    warningLevel,
  };
}

/**
 * Detect recurring expenses based on historical patterns (e.g., daily milk, monthly EB, monthly rent/gas).
 */
export function detectRecurringExpenses(expenses: ExpenseItem[]): RecurringExpenseSuggestion[] {
  if (expenses.length < 2) return [];

  // Group by category and approximate note
  const groups: Record<string, ExpenseItem[]> = {};

  for (const exp of expenses) {
    const key = `${exp.category}_${exp.note.toLowerCase().slice(0, 8)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(exp);
  }

  const recurring: RecurringExpenseSuggestion[] = [];

  for (const items of Object.values(groups)) {
    if (items.length >= 2) {
      // Sort chronologically
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Average amount
      const avgAmount = Math.round(
        items.reduce((sum, item) => sum + item.amount, 0) / items.length
      );

      // Analyze intervals between dates
      const dates = items.map((i) => new Date(i.date).getTime());
      const diffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diffDays = Math.round((dates[i] - dates[i - 1]) / 86400000);
        if (diffDays > 0) diffs.push(diffDays);
      }

      const avgInterval =
        diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 30;

      let frequency: 'daily' | 'weekly' | 'monthly' = 'monthly';
      if (avgInterval <= 2) {
        frequency = 'daily';
      } else if (avgInterval <= 9) {
        frequency = 'weekly';
      }

      recurring.push({
        category: items[0].category,
        note: items[items.length - 1].note,
        estimatedAmount: avgAmount,
        frequency,
        confidence: Math.min(95, 60 + items.length * 10),
        lastSeenDate: items[items.length - 1].date,
      });
    }
  }

  return recurring;
}

/**
 * Detect unusual spending spikes comparing the current month to the previous month.
 */
export function detectExpenseSpikes(
  expenses: ExpenseItem[],
  currentMonthKey?: string // YYYY-MM
): ExpenseSpike[] {
  const currentKey = currentMonthKey || new Date().toISOString().slice(0, 7);
  const [currYear, currMonth] = currentKey.split('-').map(Number);

  // Compute previous month key
  const prevDate = new Date(currYear, currMonth - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const currentCategoryTotals: Partial<Record<ExpenseCategory, number>> = {};
  const previousCategoryTotals: Partial<Record<ExpenseCategory, number>> = {};

  for (const exp of expenses) {
    if (exp.date.startsWith(currentKey)) {
      currentCategoryTotals[exp.category] =
        (currentCategoryTotals[exp.category] || 0) + exp.amount;
    } else if (exp.date.startsWith(prevKey)) {
      previousCategoryTotals[exp.category] =
        (previousCategoryTotals[exp.category] || 0) + exp.amount;
    }
  }

  const spikes: ExpenseSpike[] = [];

  for (const [cat, currTotal] of Object.entries(currentCategoryTotals) as [ExpenseCategory, number][]) {
    const prevTotal = previousCategoryTotals[cat] || 0;
    if (prevTotal > 0 && currTotal > prevTotal) {
      const increase = currTotal - prevTotal;
      const percentageIncrease = Math.round((increase / prevTotal) * 100);

      // Flag if increase is > 20% and at least ₹400 difference
      if (percentageIncrease >= 20 && increase >= 400) {
        spikes.push({
          category: cat,
          percentageIncrease,
          previousAmount: prevTotal,
          currentAmount: currTotal,
          message: `இந்த மாதம் ${cat} செலவு ${percentageIncrease}% அதிகரித்துள்ளது`,
        });
      }
    }
  }

  return spikes;
}

/**
 * Export expenses to CSV with UTF-8 BOM so Tamil characters render correctly in Excel.
 */
export function exportExpensesToCSV(expenses: ExpenseItem[]): void {
  const headers = ['ID', 'Date', 'Time', 'Category', 'Note', 'Amount (INR)', 'Voice Entry'];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.time || '',
    e.category,
    `"${(e.note || '').replace(/"/g, '""')}"`,
    e.amount,
    e.isVoice ? 'Yes' : 'No',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Chocobi_Amma_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

