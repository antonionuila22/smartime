/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpTypes } from '@medusajs/types'

import { medusa } from './sdk'

/**
 * Helpers del libro de direcciones del cliente (cuenta). Centralizan las llamadas
 * al Store API de Medusa para listar/crear/editar/borrar direcciones de envío
 * guardadas, y así acelerar el checkout.
 *
 * Métodos del SDK (verificados en @medusajs/js-sdk/dist/store/index.d.ts):
 *   medusa.store.customer.listAddress   → { addresses, count, offset, limit }
 *   medusa.store.customer.createAddress → { customer }
 *   medusa.store.customer.updateAddress → { customer }
 *   medusa.store.customer.deleteAddress → { parent (customer), deleted }
 *
 * Todas requieren cliente autenticado (auth jwt en el SDK); si no hay sesión,
 * el SDK lanza y la UI redirige a /login.
 */

/** Dirección guardada del cliente (forma que consume la UI). */
export type CustomerAddress = HttpTypes.StoreCustomerAddress

/** Payload para crear una dirección. País fijo 'hn' desde la UI. */
export type CreateAddressInput = {
  first_name: string
  last_name: string
  phone?: string
  address_1: string
  city: string
  province?: string
  country_code: string // ISO-2 minúscula, "hn"
}

/** Payload para actualizar (mismos campos que crear). */
export type UpdateAddressInput = CreateAddressInput

/** Lista las direcciones guardadas del cliente autenticado. */
export async function listAddresses(): Promise<CustomerAddress[]> {
  const { addresses } = await medusa.store.customer.listAddress()
  return (addresses ?? []) as CustomerAddress[]
}

/** Crea una nueva dirección; devuelve el cliente con la lista actualizada. */
export async function createAddress(input: CreateAddressInput) {
  const { customer } = await medusa.store.customer.createAddress(
    input as HttpTypes.StoreCreateCustomerAddress,
  )
  return customer
}

/** Actualiza una dirección existente por su id. */
export async function updateAddress(addressId: string, input: UpdateAddressInput) {
  const { customer } = await medusa.store.customer.updateAddress(
    addressId,
    input as HttpTypes.StoreUpdateCustomerAddress,
  )
  return customer
}

/** Borra una dirección por su id. */
export async function deleteAddress(addressId: string) {
  return medusa.store.customer.deleteAddress(addressId)
}
/* eslint-enable @typescript-eslint/no-explicit-any */
