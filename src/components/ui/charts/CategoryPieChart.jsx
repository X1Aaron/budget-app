import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { getCategoryColor } from '../../../utils/categories'
import { useTheme } from '../../../contexts/ThemeContext'
import '../../../styles/components/CategoryPieChart.css'

function CategoryPieChart({ transactions, categories }) {
  const { theme } = useTheme()
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Calculate expense breakdown from only expense transactions
  const expenseBreakdown = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      const category = t.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += Math.abs(t.amount)
      return acc
    }, {})

  // Prepare data for pie chart
  const chartData = Object.entries(expenseBreakdown)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      color: getCategoryColor(category, categories)
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return null
  }

  // Theme-aware chart colors
  const chartColors = {
    text: theme === 'dark' ? '#e5e7eb' : '#374151',
    tooltipBg: theme === 'dark' ? '#1f2937' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#374151' : '#e5e7eb'
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: chartColors.tooltipBg,
          border: `2px solid ${chartColors.tooltipBorder}`
        }}>
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="pie-chart-container">
      <h2>Spending Breakdown</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={'cell-' + index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            formatter={(value, entry) => {
              const amount = entry.payload ? entry.payload.value : entry.value
              return value + ' (' + formatCurrency(amount) + ')'
            }}
            wrapperStyle={{ color: chartColors.text }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryPieChart
