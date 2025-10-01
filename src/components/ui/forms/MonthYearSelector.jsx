import '../../../styles/components/MonthYearSelector.css'

function MonthYearSelector({ selectedYear, selectedMonth, onDateChange }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      onDateChange(selectedYear - 1, 11)
    } else {
      onDateChange(selectedYear, selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onDateChange(selectedYear + 1, 0)
    } else {
      onDateChange(selectedYear, selectedMonth + 1)
    }
  }

  const handleGoToCurrentMonth = () => {
    const now = new Date()
    onDateChange(now.getFullYear(), now.getMonth())
  }

  return (
    <div className="month-year-selector">
      <button className="month-nav-btn" onClick={handlePreviousMonth} title="Previous month">
        ←
      </button>
      <span className="month-year-display">
        {monthNames[selectedMonth]} {selectedYear}
      </span>
      <button className="month-nav-btn calendar-today-btn" onClick={handleGoToCurrentMonth} title="Go to current month">
        📅
      </button>
      <button className="month-nav-btn" onClick={handleNextMonth} title="Next month">
        →
      </button>
    </div>
  )
}

export default MonthYearSelector
