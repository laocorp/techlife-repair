import { redirect } from 'next/navigation'

// Redirect to main inventory page
export default function ProductsPage() {
    redirect('/dashboard/inventory')
}
