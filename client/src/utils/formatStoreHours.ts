/**
 * Utility functions for formatting and standardizing store hours across all website components
 */

/**
 * Format opening hours in a standardized way
 * @param openingHours Record of opening hours by day
 * @param includeExtendedHours Whether to include notes about extended hours on weekends 
 * @returns Formatted string for display
 */
export function formatStoreHours(
  openingHours?: Record<string, string>,
  includeExtendedHours: boolean = true
): string {
  if (!openingHours) return "Hours not available";
  
  // Group days by their hours
  const hourGroups: Record<string, string[]> = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    const hours = openingHours[day];
    if (hours) {
      if (!hourGroups[hours]) {
        hourGroups[hours] = [];
      }
      hourGroups[hours].push(day);
    }
  });
  
  // Special case for extended hours (Friday/Saturday having late hours)
  let hasExtendedHours = false;
  if (includeExtendedHours) {
    const weekendDays = ['Friday', 'Saturday'];
    const nonWeekendDays = days.filter(day => !weekendDays.includes(day));
    
    // Check if weekend days have later hours than weekdays
    const weekendHours = weekendDays
      .map(day => openingHours[day])
      .filter(Boolean)
      .map(hours => {
        const parts = hours.split(' - ');
        return parts.length === 2 ? parts[1] : null;
      })
      .filter((hour): hour is string => hour !== null);
    
    const nonWeekendHours = nonWeekendDays
      .map(day => openingHours[day])
      .filter(Boolean)
      .map(hours => {
        const parts = hours.split(' - ');
        return parts.length === 2 ? parts[1] : null;
      })
      .filter((hour): hour is string => hour !== null);
      
    // If weekend closing times are later than weekday closing times,
    // consider this as having extended hours
    if (weekendHours.length > 0 && nonWeekendHours.length > 0) {
      // Convert times to comparable format (24h)
      const convertTo24h = (time: string): number => {
        // Handle special cases like "2:00 AM" which is after midnight
        let isPM = time.includes("PM");
        let isLateNight = time.includes("AM") && 
           (time.startsWith("12:") || time.startsWith("1:") || time.startsWith("2:") || 
            time.startsWith("3:") || time.startsWith("4:") || time.startsWith("5:"));
        
        const timePart = time.replace(/\s*[AP]M\s*/, "");
        const [hours, minutes] = timePart.split(":").map(n => parseInt(n, 10));
        
        if (isLateNight) {
          // For hours like 2:00 AM, add 24 to represent it as "after midnight"
          return (hours === 12 ? 0 : hours) + 24 + minutes / 60;
        } else if (isPM) {
          return (hours === 12 ? 12 : hours + 12) + minutes / 60;
        } else {
          return (hours === 12 ? 0 : hours) + minutes / 60;
        }
      };
      
      const latestWeekendClosing = Math.max(...weekendHours.map(time => convertTo24h(time)));
      const latestWeekdayClosing = Math.max(...nonWeekendHours.map(time => convertTo24h(time)));
      
      hasExtendedHours = latestWeekendClosing > latestWeekdayClosing;
    }
  }
  
  // Format the hours
  const formattedGroups: string[] = [];
  
  Object.entries(hourGroups).forEach(([hours, daysInGroup]) => {
    let daysText = "";
    
    if (daysInGroup.length === 7) {
      daysText = "Every day";
    } else if (
      daysInGroup.length === 5 &&
      daysInGroup.includes("Monday") &&
      daysInGroup.includes("Tuesday") &&
      daysInGroup.includes("Wednesday") &&
      daysInGroup.includes("Thursday") &&
      daysInGroup.includes("Friday")
    ) {
      daysText = "Weekdays";
    } else if (
      daysInGroup.length === 2 &&
      daysInGroup.includes("Saturday") &&
      daysInGroup.includes("Sunday")
    ) {
      daysText = "Weekend";
    } else {
      // Sort days in calendar order
      const sortedDays = daysInGroup.sort(
        (a, b) => days.indexOf(a) - days.indexOf(b)
      );
      
      // If days are consecutive
      if (sortedDays.length === 
          days.indexOf(sortedDays[sortedDays.length - 1]) - days.indexOf(sortedDays[0]) + 1) {
        daysText = `${sortedDays[0].substring(0, 3)}-${sortedDays[sortedDays.length - 1].substring(0, 3)}`;
      } else {
        daysText = sortedDays.map(d => d.substring(0, 3)).join(", ");
      }
    }
    
    formattedGroups.push(`${daysText}: ${hours}`);
  });
  
  let result = formattedGroups.join(" | ");
  
  // Add note about extended hours if applicable
  if (hasExtendedHours && includeExtendedHours) {
    result += " (Extended hours on weekends)";
  }
  
  return result;
}

/**
 * Format extended hours specifically for display
 * @param openingHours Record of opening hours by day
 * @returns Formatted string specifically for extended hours display
 */
export function formatExtendedHours(openingHours?: Record<string, string>): string | null {
  if (!openingHours) return null;
  
  const weekendDays = ['Friday', 'Saturday'];
  const weekendHours = weekendDays
    .map(day => ({day, hours: openingHours[day]}))
    .filter(({hours}) => !!hours);
    
  if (weekendHours.length === 0) return null;
  
  const formattedExtendedHours = weekendHours
    .map(({day, hours}) => `${day} ${hours}`)
    .join(' & ');
    
  return formattedExtendedHours;
}

/**
 * Get hours for display using specified format
 * @param openingHours Hours record
 * @param day Day of week
 * @returns Formatted hours string or empty string if not found
 */
export function getHoursForDay(openingHours: Record<string, string> | undefined, day: string): string {
  if (!openingHours || !openingHours[day]) return "";
  return openingHours[day];
}