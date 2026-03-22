import type { Order } from '@/types/order'
import type { OrderStatus } from '@/types/order'

const EXECUTED_STATUSES: readonly OrderStatus[] = ['成交', '部分成交']

export function isExecutedOrder(order: Order): boolean {
  return (EXECUTED_STATUSES as readonly string[]).includes(order.order_status)
}
