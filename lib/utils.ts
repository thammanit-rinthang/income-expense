import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(Number(amount));
}

export function calculateMonthlyPayment(principal: number, annualInterestRate: number, termMonths: number) {
  if (annualInterestRate === 0) return principal / termMonths;
  
  const monthlyRate = annualInterestRate / 12 / 100;
  const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return pmt;
}

export function getMonthsDifference(startDate: Date | string) {
  const start = new Date(startDate);
  const now = new Date();
  
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

export function generateLoanSchedule(principal: number, annualInterestRate: number, termMonths: number, paid: number, startDate: Date | string) {
  const monthlyRate = annualInterestRate / 12 / 100;
  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, termMonths);
  
  const schedule = [];
  let currentBalance = principal;
  let remainingPaidAmount = paid;

  for (let i = 1; i <= termMonths; i++) {
    const interest = currentBalance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    
    // A month is considered "paid" if there was enough money in 'paid' to cover it
    const isPaid = remainingPaidAmount >= monthlyPayment - 0.01; // Small epsilon for float comparison
    if (isPaid) {
      remainingPaidAmount -= monthlyPayment;
    }
    
    currentBalance -= principalPaid;
    
    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPaid,
      interest: interest,
      remaining: Math.max(currentBalance, 0),
      isPaid: isPaid
    });
  }
  
  return schedule;
}
