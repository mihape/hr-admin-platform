(function () {
  var seedEmployees = [
    {
      id: "emp-001",
      name: "Kovács Anna",
      role: "HR admin",
      project: "Központ",
      status: "Aktív"
    },
    {
      id: "emp-002",
      name: "Nagy Péter",
      role: "Építésvezető",
      project: "Budapest XIII. felújítás",
      status: "Aktív"
    },
    {
      id: "emp-003",
      name: "Tóth Eszter",
      role: "Irodai asszisztens",
      project: "Központ",
      status: "Aktív"
    },
    {
      id: "emp-004",
      name: "Balogh Máté",
      role: "Szakember",
      project: "Törökbálint családi ház",
      status: "Aktív"
    }
  ];

  function getEmployees() {
    return window.HRPlatform.storage.readCollection("employees", seedEmployees);
  }

  function saveEmployees(employees) {
    window.HRPlatform.storage.writeCollection("employees", employees);
  }

  function addEmployee(employee) {
    return window.HRPlatform.storage.addItem("employees", employee, seedEmployees);
  }

  function updateEmployee(employeeId, employee) {
    var employees = getEmployees().map(function (current) {
      if (current.id !== employeeId) {
        return current;
      }
      return Object.assign({}, current, employee, { id: employeeId });
    });
    saveEmployees(employees);
    return findById(employeeId);
  }

  function deleteEmployee(employeeId) {
    saveEmployees(getEmployees().filter(function (employee) {
      return employee.id !== employeeId;
    }));
  }

  function findById(employeeId) {
    return getEmployees().find(function (employee) {
      return employee.id === employeeId;
    });
  }

  function searchEmployees(searchTerm) {
    return getEmployees().filter(function (employee) {
      return window.HRPlatform.utils.matchesSearch(employee, searchTerm);
    });
  }

  window.HRPlatform.employeeAdapter = {
    source: "local-standalone",
    getEmployees: getEmployees,
    addEmployee: addEmployee,
    updateEmployee: updateEmployee,
    deleteEmployee: deleteEmployee,
    findById: findById,
    searchEmployees: searchEmployees
  };
})();
