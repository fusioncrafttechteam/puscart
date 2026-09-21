export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

export function getPaymentTone(status: string): BadgeTone {
  switch (status) {
    case 'paid':
    case 'delivered':
    case 'active':
      return 'success'
    case 'pending':
    case 'processing':
      return 'warning'
    case 'shipped':
      return 'info'
    case 'failed':
    case 'cancelled':
    case 'blocked':
      return 'danger'
    case 'refunded':
      return 'neutral'
    case 'admin':
      return 'purple'
    default:
      return 'neutral'
  }
}
