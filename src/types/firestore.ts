export type BusinessShop = {
  id: string
  name: string
  slug?: string
  imageUrl?: string
}

export type BusinessHours = {
  id: string
  closedDays: number[]
  openingTime: string
  closingTime: string
  businessShopId: string
}

export type BookableResource = {
  id: string
  name: string
  BusinessId?: string
  type: string
  active: boolean
  emailResource?: string
}

export type Booking = {
  id: string
  resourceId: string
  durationMinutes: string | number
  BusinessId?: string
  customerName: string
  startAt?: string
  endAt?: string
  customerEmail?: string
  customerPhone?: string
  resourceEmail?: string
}

export type AvailabilityException = {
  id: string
  startAt: string
  endAt: string
  reason: string
  resourceId: string
  BusinessId?: string
}
