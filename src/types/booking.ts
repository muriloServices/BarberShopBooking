export type BookableResource = {
  id: string
  name: string
  BusinessId?: string
  type: string
  emailResource?: string
  active: boolean
}

export type Barber = {
  id: string
  name: string
  BusinessId?: string
  emailResource?: string
}

export type DateAvailability = {
  barbers: Barber[]
  status: 'available' | 'unresolved'
  message?: string
  warning?: string
}

export type TimeSlot = {
  hour: number
  label: string
  startAt: string
  endAt: string
  available: boolean
}

export type TimeSlotAvailability = {
  slots: TimeSlot[]
  status: 'available' | 'unresolved'
  message?: string
  warning?: string
}

export type CustomerDetails = {
  name: string
  email: string
  phone: string
}
