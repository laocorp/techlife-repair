'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============ CATEGORIES ============
const CategorySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
})

export type CategoryFormState = {
    errors?: {
        name?: string[]
        description?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function createCategoryAction(
    prevState: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden crear categorías'] } }
    }

    const validatedFields = CategorySchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase.from('product_categories').insert({
        tenant_id: userData.tenant_id,
        name: validatedFields.data.name,
        description: validatedFields.data.description || null,
    })

    if (error) {
        if (error.code === '23505') {
            return { errors: { name: ['Ya existe una categoría con este nombre'] } }
        }
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true, message: 'Categoría creada' }
}

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true }
}

// ============ PRODUCTS ============
const ProductSchema = z.object({
    category_id: z.string().uuid().optional().nullable(),
    sku: z.string().optional(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    unit_price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    cost_price: z.coerce.number().min(0).optional(),
    stock_quantity: z.coerce.number().int().min(0).default(0),
    min_stock_level: z.coerce.number().int().min(0).default(5),
    is_service: z.boolean().default(false),
})

export type ProductFormState = {
    errors?: {
        category_id?: string[]
        sku?: string[]
        name?: string[]
        description?: string[]
        unit_price?: string[]
        cost_price?: string[]
        stock_quantity?: string[]
        min_stock_level?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
    productId?: string
}

export async function createProductAction(
    prevState: ProductFormState,
    formData: FormData
): Promise<ProductFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden crear productos'] } }
    }

    const validatedFields = ProductSchema.safeParse({
        category_id: formData.get('category_id') || null,
        sku: formData.get('sku') || undefined,
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        unit_price: formData.get('unit_price'),
        cost_price: formData.get('cost_price') || undefined,
        stock_quantity: formData.get('stock_quantity') || 0,
        min_stock_level: formData.get('min_stock_level') || 5,
        is_service: formData.get('is_service') === 'true',
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
            tenant_id: userData.tenant_id,
            category_id: validatedFields.data.category_id || null,
            sku: validatedFields.data.sku || null,
            name: validatedFields.data.name,
            description: validatedFields.data.description || null,
            unit_price: validatedFields.data.unit_price,
            cost_price: validatedFields.data.cost_price || 0,
            stock_quantity: validatedFields.data.stock_quantity,
            min_stock_level: validatedFields.data.min_stock_level,
            is_service: validatedFields.data.is_service,
        })
        .select('id')
        .single()

    if (error) {
        if (error.code === '23505') {
            return { errors: { sku: ['Ya existe un producto con este SKU'] } }
        }
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true, message: 'Producto creado', productId: newProduct?.id }
}

export async function updateProductAction(
    id: string,
    prevState: ProductFormState,
    formData: FormData
): Promise<ProductFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const validatedFields = ProductSchema.safeParse({
        category_id: formData.get('category_id') || null,
        sku: formData.get('sku') || undefined,
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        unit_price: formData.get('unit_price'),
        cost_price: formData.get('cost_price') || undefined,
        stock_quantity: formData.get('stock_quantity') || 0,
        min_stock_level: formData.get('min_stock_level') || 5,
        is_service: formData.get('is_service') === 'true',
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('products')
        .update({
            category_id: validatedFields.data.category_id || null,
            sku: validatedFields.data.sku || null,
            name: validatedFields.data.name,
            description: validatedFields.data.description || null,
            unit_price: validatedFields.data.unit_price,
            cost_price: validatedFields.data.cost_price || 0,
            stock_quantity: validatedFields.data.stock_quantity,
            min_stock_level: validatedFields.data.min_stock_level,
            is_service: validatedFields.data.is_service,
        })
        .eq('id', id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/inventory')
    revalidatePath(`/dashboard/inventory/${id}`)
    return { success: true, message: 'Producto actualizado' }
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/inventory')
    return { success: true }
}

export async function adjustStockAction(
    productId: string,
    quantity: number,
    type: 'add' | 'subtract',
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { data: userData } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) return { success: false, error: 'Usuario no encontrado' }

    // Get current stock
    const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single()

    if (!product) return { success: false, error: 'Producto no encontrado' }

    const newQuantity = type === 'add'
        ? product.stock_quantity + quantity
        : product.stock_quantity - quantity

    if (newQuantity < 0) {
        return { success: false, error: 'Stock insuficiente' }
    }

    // Update stock
    const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId)

    if (updateError) return { success: false, error: updateError.message }

    // Record movement
    const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
            tenant_id: userData.tenant_id,
            product_id: productId,
            user_id: userData.id,
            movement_type: type === 'add' ? 'purchase' : 'adjustment',
            quantity: type === 'add' ? quantity : -quantity,
            notes: notes || null,
        })

    if (movementError) {
        console.error('Error recording movement:', movementError)
    }

    revalidatePath('/dashboard/inventory')
    revalidatePath(`/dashboard/inventory/${productId}`)
    return { success: true }
}
