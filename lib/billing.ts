import dayjs from "dayjs";

export function getCurrentBudgetMonth(now: Date = new Date()): Date {
  const currentMonth = dayjs(now).startOf("month");
  return (dayjs(now).date() >= 25 ? currentMonth.add(1, "month") : currentMonth).toDate();
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
