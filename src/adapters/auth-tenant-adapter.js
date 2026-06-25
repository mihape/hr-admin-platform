(function () {
  function getCurrentTenant() {
    return window.HRPlatform.state.tenant;
  }

  function getCurrentUser() {
    return window.HRPlatform.state.user;
  }

  function can(permission) {
    var permissions = getCurrentUser().permissions || [];
    return permissions.includes(permission);
  }

  window.HRPlatform.authTenantAdapter = {
    getCurrentTenant: getCurrentTenant,
    getCurrentUser: getCurrentUser,
    can: can
  };
})();
