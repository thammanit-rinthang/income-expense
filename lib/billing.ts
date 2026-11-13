import dayjs from "dayjs";

export function getBudgetMonthForDate(date: Date): Date {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, number>>((parts, part) => {
      if (["year", "month", "day"].includes(part.type)) parts[part.type] = Number(part.value);
      return parts;
    }, {});

  return new Date(dateParts.year, dateParts.month - 1 + (dateParts.day >= 25 ? 1 : 0), 1);
}

export function getCurrentBudgetMonth(now: Date = new Date()): Date {
  return getBudgetMonthForDate(now);
}

/**
 * Returns the billing period for a given target month.
 * The period starts from the 25th of the previous month
 * and ends on the 24th of the current month.
 */
export function getBillingPeriod(targetMonth: Date) {
  const current = dayjs(targetMonth);
  const start = current.subtract(1, "month").date(25).startOf("day");
  const end = current.date(24).endOf("day");

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
}
