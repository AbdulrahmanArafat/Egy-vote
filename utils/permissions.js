const PERMISSIONS = {
    DASHBOARD_VIEW: "dashboard.view",
    ELECTIONS_MANAGE: "elections.manage",
    CANDIDATES_MANAGE: "candidates.manage",
    VOTERS_MANAGE: "voters.manage",
    SECURITY_VIEW: "security.view",
    RESULTS_VIEW: "results.view",
    ADMINS_MANAGE: "admins.manage",
    AUDIT_VIEW: "audit.view",
    NOTIFICATIONS_MANAGE: "notifications.manage",
    SUPPORT_MANAGE: "support.manage",
    REPORTS_VIEW: "reports.view",
    SETTINGS_MANAGE: "settings.manage"
};

const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
    auditor: "Auditor"
};

const ROLE_PERMISSIONS = {
    super_admin: Object.values(PERMISSIONS),
    admin: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ELECTIONS_MANAGE,
        PERMISSIONS.CANDIDATES_MANAGE,
        PERMISSIONS.VOTERS_MANAGE,
        PERMISSIONS.SECURITY_VIEW,
        PERMISSIONS.RESULTS_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.NOTIFICATIONS_MANAGE,
        PERMISSIONS.SUPPORT_MANAGE,
        PERMISSIONS.REPORTS_VIEW
    ],
    moderator: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ELECTIONS_MANAGE,
        PERMISSIONS.CANDIDATES_MANAGE,
        PERMISSIONS.VOTERS_MANAGE,
        PERMISSIONS.NOTIFICATIONS_MANAGE,
        PERMISSIONS.SUPPORT_MANAGE,
        PERMISSIONS.RESULTS_VIEW
    ],
    auditor: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SECURITY_VIEW,
        PERMISSIONS.RESULTS_VIEW,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.REPORTS_VIEW
    ]
};

function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(adminUser, permission) {
    if (!adminUser || !permission) {
        return false;
    }

    const effectivePermissions = new Set([
        ...getPermissionsForRole(adminUser.role),
        ...(Array.isArray(adminUser.permissions) ? adminUser.permissions : [])
    ]);

    return effectivePermissions.has(permission);
}

module.exports = {
    PERMISSIONS,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    getPermissionsForRole,
    hasPermission
};
