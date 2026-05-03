export function getPaymentStatusTone(status: 'pending' | 'confirmed' | 'rejected') {
  if (status === 'confirmed') return 'success'
  if (status === 'rejected') return 'danger'
  return 'muted'
}

export function getRoleTone(role: 'admin' | 'user') {
  return role === 'admin' ? 'info' : 'muted'
}
