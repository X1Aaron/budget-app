import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { getCategoryColor } from '../utils/categories'
import './CategoryPieChart.css'

function CategoryPieChart({ categoryBreakdown, categories }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Prepare data for pie chart (only show expenses for clarity)
  const chartData = Object.entries(categoryBreakdown)
    .filter(([_, amount]) => amount < 0)
    .map(([category, amount]) => ({
      name: category,
      value: Math.abs(amount),
      color: getCategoryColor(category, categories)
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return null
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="pie-chart-container">
      <h2>Expense Breakdown</h2>
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
            formatter={(value, entry) => value + ' (' + formatCurrency(entry.value) + ')'}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryPieChart
