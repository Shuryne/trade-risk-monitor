import type { Order } from '@/types/order'

/** 已成交的订单状态 */
const EXECUTED_STATUSES: readonly string[] = ['成交', '部分成交']

/** 判断订单是否已成交（成交 或 部分成交） */
export function isExecutedOrder(order: Order): boolean {
  return EXECUTED_STATUSES.includes(order.order_status)
}
