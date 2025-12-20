// Central hooks export
export { TenantProvider, useTenant, useTenantQuery } from './use-tenant'
export {
    usePermission,
    usePermissions,
    useAnyPermission,
    useUserPermissions,
    hasPermission,
    withPermission,
    PermissionGate,
    RoleGate,
    getRoleDisplayName,
    getRoleBadgeColor,
} from './use-permissions'
