import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const GUEST_COOKIE = 'posterraxx_guest_id';

export function getOrSetGuestId(): string {
  const store = cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  });
  return id;
}

export async function getOrCreateCart(userId: string | null) {
  if (userId) {
    const guestId = cookies().get(GUEST_COOKIE)?.value;
    let cart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId }, include: { items: true } });
    }

    if (guestId) {
      const guestCart = await prisma.cart.findUnique({ where: { guestId }, include: { items: true } });
      if (guestCart && guestCart.id !== cart.id) {
        for (const item of guestCart.items) {
          await prisma.cartItem.upsert({
            where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
            create: { cartId: cart.id, variantId: item.variantId, quantity: item.quantity },
            update: { quantity: { increment: item.quantity } },
          });
        }
        await prisma.cart.delete({ where: { id: guestCart.id } });
      }
    }

    return cart;
  }

  const guestId = getOrSetGuestId();
  let cart = await prisma.cart.findUnique({ where: { guestId }, include: { items: true } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { guestId }, include: { items: true } });
  }
  return cart;
}

export async function addToCart(userId: string | null, variantId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true },
  });
  if (!variant || !variant.isActive) throw new Error('This item is no longer available.');

  const available = (variant.inventory?.stock ?? 0) - (variant.inventory?.reserved ?? 0);
  if (available < quantity) throw new Error('Not enough stock available.');

  return prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

export async function updateCartItemQuantity(userId: string | null, variantId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } }).catch(() => null);
  }
  return prisma.cartItem.update({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    data: { quantity },
  });
}

export async function removeCartItem(userId: string | null, variantId: string) {
  const cart = await getOrCreateCart(userId);
  return prisma.cartItem.delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } }).catch(() => null);
}

export async function getCartLines(userId: string | null) {
  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { variant: { include: { product: { include: { images: true } } } } },
  });
  return { cart, items };
}
