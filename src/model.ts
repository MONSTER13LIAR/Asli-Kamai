export type Platform = 'Swiggy' | 'Zomato' | 'Rapido' | 'Porter' | 'Uber' | 'Other'
export type Slot = 'Morning' | 'Afternoon' | 'Evening' | 'Night'

export const PLATFORMS: Platform[] = ['Swiggy', 'Zomato', 'Rapido', 'Porter', 'Uber', 'Other']
export const SLOTS: Slot[] = ['Morning', 'Afternoon', 'Evening', 'Night']

export interface Shift {
  id: string
  date: string // YYYY-MM-DD
  platform: Platform
  slot: Slot
  hours: number
  gross: number
  fuel: number
}

export interface MonthlyCosts {
  emi: number
  recharge: number
  maintenance: number
  workingDays: number
}

export interface Ledger {
  shifts: Shift[]
  monthly: MonthlyCosts
}

export const perDayFixed = (m: MonthlyCosts) =>
  (m.emi + m.recharge + m.maintenance) / Math.max(1, m.workingDays)

export const inr = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN')

export const uid = () => Math.random().toString(36).slice(2, 9)

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

// First run: no shifts, typical monthly costs to edit.
export const emptyLedger = (): Ledger => ({
  monthly: { emi: 0, recharge: 0, maintenance: 0, workingDays: 25 },
  shifts: [],
})

// One rider's week. Evenings visibly out-earn mornings: that pattern
// is the first lesson the app will teach.
export const seedLedger = (): Ledger => ({
  monthly: { emi: 3000, recharge: 299, maintenance: 500, workingDays: 25 },
  shifts: [
    { id: uid(), date: day(6), platform: 'Swiggy', slot: 'Morning', hours: 4, gross: 640, fuel: 120 },
    { id: uid(), date: day(6), platform: 'Swiggy', slot: 'Evening', hours: 3.5, gross: 980, fuel: 90 },
    { id: uid(), date: day(5), platform: 'Zomato', slot: 'Evening', hours: 4, gross: 1120, fuel: 110 },
    { id: uid(), date: day(4), platform: 'Rapido', slot: 'Morning', hours: 3, gross: 410, fuel: 95 },
    { id: uid(), date: day(4), platform: 'Swiggy', slot: 'Night', hours: 3, gross: 860, fuel: 80 },
    { id: uid(), date: day(3), platform: 'Zomato', slot: 'Afternoon', hours: 5, gross: 720, fuel: 140 },
    { id: uid(), date: day(2), platform: 'Swiggy', slot: 'Evening', hours: 4, gross: 1240, fuel: 100 },
    { id: uid(), date: day(1), platform: 'Rapido', slot: 'Morning', hours: 2.5, gross: 380, fuel: 70 },
    { id: uid(), date: day(1), platform: 'Zomato', slot: 'Evening', hours: 4, gross: 1090, fuel: 105 },
    { id: uid(), date: day(0), platform: 'Swiggy', slot: 'Evening', hours: 3, gross: 910, fuel: 85 },
  ],
})
