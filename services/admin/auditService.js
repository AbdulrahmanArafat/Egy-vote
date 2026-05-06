function getRequestIp(request) {
    return (
        request.headers["x-forwarded-for"] ||
        request.socket?.remoteAddress ||
        request.ip ||
        ""
    )
        .toString()
        .split(",")[0]
        .trim();
}

async function logAdminAction(request, payload) {
    return {
        ok: true,
        admin: request.currentAdmin?.name || payload.adminName || "System"
    };
}

async function logSystemAction(payload) {
    return { ok: true, admin: payload.adminName || "System" };
}

module.exports = {
    getRequestIp,
    logAdminAction,
    logSystemAction
};
