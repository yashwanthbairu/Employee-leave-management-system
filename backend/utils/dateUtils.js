/**
 * Calculates the number of working days between two dates, 
 * excluding weekends (Saturday/Sunday) and a provided list of holiday dates.
 */
const calculateWorkingDays = (startDate, endDate, holidays = []) => {
    let count = 0;
    let curDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    // Normalize holiday strings to YYYY-MM-DD for comparison
    const holidayStrings = holidays.map(h => new Date(h).toISOString().split('T')[0]);

    while (curDate <= lastDate) {
        const dayOfWeek = curDate.getDay();
        const dateString = curDate.toISOString().split('T')[0];
        
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = holidayStrings.includes(dateString);

        if (!isWeekend && !isHoliday) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

module.exports = { calculateWorkingDays };
