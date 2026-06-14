import { formatCop } from './format';

/** Mensaje al contactar desde el menú principal. */
export function whatsappHomeMessage(itemCount: number, subtotal: number): string {
  if (itemCount > 0) {
    const label = itemCount === 1 ? 'producto' : 'productos';
    return `¡Hola! Estoy viendo el menú y tengo ${itemCount} ${label} seleccionados (${formatCop(subtotal)}). ¿Me pueden ayudar con mi pedido?`;
  }
  return '¡Hola! Me gustaría pedir pasabocas. ¿Me pueden dar información del menú y disponibilidad?';
}

/** Mensaje durante el paso de datos de entrega. */
export function whatsappDeliveryMessage(customerName?: string): string {
  const name = customerName?.trim();
  if (name) {
    return `¡Hola! Soy ${name}. Estoy completando mi pedido y tengo una consulta sobre la entrega.`;
  }
  return '¡Hola! Estoy realizando un pedido y tengo una consulta sobre la entrega.';
}

/** Mensaje para enviar comprobante de pago. */
export function whatsappPaymentReceiptMessage(
  customerName: string,
  total: number,
): string {
  const name = customerName.trim() || 'un cliente';
  return `¡Hola! Soy ${name}. Adjunto el comprobante de pago de mi pedido por ${formatCop(total)}.`;
}

/** Mensaje de consulta general durante el paso de pago (FAB). */
export function whatsappPaymentSupportMessage(
  customerName?: string,
  total?: number,
): string {
  const name = customerName?.trim();
  if (name && total != null) {
    return `¡Hola! Soy ${name}. Tengo una consulta sobre el pago de mi pedido (${formatCop(total)}).`;
  }
  if (name) {
    return `¡Hola! Soy ${name}. Tengo una consulta sobre el pago de mi pedido.`;
  }
  return '¡Hola! Estoy en el proceso de pago y tengo una consulta. ¿Me pueden ayudar?';
}

/** Mensaje para enviar comprobante tras confirmar el pedido. */
export function whatsappConfirmationReceiptMessage(orderNumber: string): string {
  return `¡Hola! Adjunto el comprobante de pago de mi pedido #${orderNumber}.`;
}

/** Mensaje desde la pantalla de seguimiento. */
export function whatsappTrackingMessage(orderNumber?: string): string {
  const number = orderNumber?.trim().toUpperCase();
  if (number) {
    return `¡Hola! Quiero consultar el estado de mi pedido #${number}.`;
  }
  return '¡Hola! Quiero consultar sobre un pedido. ¿Me pueden ayudar?';
}
