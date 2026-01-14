import { PlanForm } from '../plan-form'

export const metadata = {
    title: 'Nuevo Plan - Super Admin',
}

export default function NewPlanPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Crear Nuevo Plan</h2>
                <p className="text-foreground-secondary">Define precios y características para un nuevo plan SaaS</p>
            </div>

            <PlanForm />
        </div>
    )
}
