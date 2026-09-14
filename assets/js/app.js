(function () {
  "use strict";

  var db = window.RegistrationDB;
  var state = {
    records: [],
    query: "",
    sortKey: "updatedAt",
    sortDirection: "desc",
    editingId: null,
    lastFocusedElement: null
  };

  var elements = {};
  var dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  document.addEventListener("DOMContentLoaded", initialize);

  function initialize() {
    cacheElements();
    bindEvents();
    setStorageState("loading");

    if (!db || !db.supportsIndexedDB()) {
      setStorageState("error", "浏览器不支持本地数据库");
      showToast("当前浏览器不支持 IndexedDB，无法保存数据。", "error");
      render();
      return;
    }

    db.open()
      .then(function () {
        setStorageState("ready", "IndexedDB 已连接");
        return loadRecords();
      })
      .catch(function (error) {
        setStorageState("error", "本地数据库连接失败");
        showToast(error.message || "本地数据库连接失败。", "error");
        render();
      });
  }

  function cacheElements() {
    elements.addButton = document.getElementById("addButton");
    elements.emptyAddButton = document.getElementById("emptyAddButton");
    elements.exportCsvButton = document.getElementById("exportCsvButton");
    elements.searchInput = document.getElementById("searchInput");
    elements.recordsBody = document.getElementById("recordsBody");
    elements.emptyState = document.getElementById("emptyState");
    elements.emptyTitle = document.getElementById("emptyTitle");
    elements.emptyDescription = document.getElementById("emptyDescription");
    elements.totalCount = document.getElementById("totalCount");
    elements.visibleCount = document.getElementById("visibleCount");
    elements.resultHint = document.getElementById("resultHint");
    elements.storageState = document.getElementById("storageState");
    elements.recordModal = document.getElementById("recordModal");
    elements.recordForm = document.getElementById("recordForm");
    elements.modalTitle = document.getElementById("modalTitle");
    elements.modalEyebrow = document.getElementById("modalEyebrow");
    elements.recordId = document.getElementById("recordId");
    elements.nameInput = document.getElementById("nameInput");
    elements.phoneInput = document.getElementById("phoneInput");
    elements.emailInput = document.getElementById("emailInput");
    elements.departmentInput = document.getElementById("departmentInput");
    elements.statusInput = document.getElementById("statusInput");
    elements.noteInput = document.getElementById("noteInput");
    elements.nameError = document.getElementById("nameError");
    elements.phoneError = document.getElementById("phoneError");
    elements.emailError = document.getElementById("emailError");
    elements.formError = document.getElementById("formError");
    elements.closeModalButton = document.getElementById("closeModalButton");
    elements.cancelButton = document.getElementById("cancelButton");
    elements.saveButton = document.getElementById("saveButton");
    elements.toastRegion = document.getElementById("toastRegion");
  }

  function bindEvents() {
    elements.addButton.addEventListener("click", function () {
      openRecordModal();
    });

    elements.emptyAddButton.addEventListener("click", function () {
      openRecordModal();
    });

    elements.exportCsvButton.addEventListener("click", exportCsv);
    elements.closeModalButton.addEventListener("click", closeRecordModal);
    elements.cancelButton.addEventListener("click", closeRecordModal);
    elements.recordForm.addEventListener("submit", handleFormSubmit);

    elements.recordModal.addEventListener("mousedown", function (event) {
      if (event.target === elements.recordModal) {
        closeRecordModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !elements.recordModal.hidden) {
        closeRecordModal();
      }
    });

    elements.searchInput.addEventListener("input", function (event) {
      state.query = event.target.value.trim();
      render();
    });

    elements.nameInput.addEventListener("input", function () {
      clearFieldError(elements.nameInput, elements.nameError);
    });

    elements.phoneInput.addEventListener("input", function () {
      clearFieldError(elements.phoneInput, elements.phoneError);
    });

    elements.emailInput.addEventListener("input", function () {
      clearFieldError(elements.emailInput, elements.emailError);
    });

    document.querySelectorAll(".sort-button").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.dataset.sort;

        if (state.sortKey === key) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDirection = key === "updatedAt" ? "desc" : "asc";
        }

        updateSortButtons();
        render();
      });
    });

    updateSortButtons();
  }

  function loadRecords() {
    return db.getAll()
      .then(function (records) {
        state.records = Array.isArray(records) ? records : [];
        render();
      })
      .catch(function (error) {
        showToast(error.message || "读取记录失败。", "error");
        throw error;
      });
  }

  function getVisibleRecords() {
    var query = state.query.toLocaleLowerCase("zh-CN");
    var filtered = state.records.filter(function (record) {
      if (!query) {
        return true;
      }

      return [
        record.name,
        record.phone,
        record.email,
        record.department,
        record.status,
        record.note
      ].some(function (value) {
        return String(value || "").toLocaleLowerCase("zh-CN").indexOf(query) !== -1;
      });
    });

    return filtered.sort(compareRecords);
  }

  function compareRecords(a, b) {
    var direction = state.sortDirection === "asc" ? 1 : -1;
    var aValue = String(a[state.sortKey] || "");
    var bValue = String(b[state.sortKey] || "");
    var comparison = aValue.localeCompare(bValue, "zh-CN", { numeric: true, sensitivity: "base" });

    if (comparison === 0 && state.sortKey !== "updatedAt") {
      comparison = String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""));
    }

    return comparison * direction;
  }

  function render() {
    var visibleRecords = getVisibleRecords();
    elements.recordsBody.textContent = "";
    elements.totalCount.textContent = String(state.records.length);
    elements.visibleCount.textContent = String(visibleRecords.length);

    if (state.query) {
      elements.resultHint.textContent = "找到 " + visibleRecords.length + " 条与“" + state.query + "”匹配的记录";
    } else {
      elements.resultHint.textContent = "共 " + state.records.length + " 条记录";
    }

    if (visibleRecords.length === 0) {
      showEmptyState(state.records.length === 0);
    } else {
      elements.emptyState.classList.remove("is-visible");
    }

    visibleRecords.forEach(function (record) {
      elements.recordsBody.appendChild(createRecordRow(record));
    });

    elements.exportCsvButton.disabled = state.records.length === 0;
  }

  function showEmptyState(databaseIsEmpty) {
    elements.emptyState.classList.add("is-visible");

    if (databaseIsEmpty) {
      elements.emptyTitle.textContent = "还没有记录";
      elements.emptyDescription.textContent = "点击“新增记录”开始登记，数据会自动保存在这个浏览器里。";
      elements.emptyAddButton.hidden = false;
    } else {
      elements.emptyTitle.textContent = "没有匹配结果";
      elements.emptyDescription.textContent = "换一个关键词试试，或清空搜索框查看全部记录。";
      elements.emptyAddButton.hidden = true;
    }
  }

  function createRecordRow(record) {
    var row = document.createElement("tr");

    var nameCell = document.createElement("td");
    nameCell.className = "primary-cell";
    nameCell.dataset.label = "姓名";
    var name = document.createElement("strong");
    name.textContent = record.name || "未填写姓名";
    nameCell.appendChild(name);
    if (record.createdAt) {
      var created = document.createElement("span");
      created.textContent = "创建于 " + formatDate(record.createdAt);
      nameCell.appendChild(created);
    }

    var contactCell = document.createElement("td");
    contactCell.className = "contact-cell";
    contactCell.dataset.label = "联系方式";
    contactCell.appendChild(createContactLine(record.phone, "未填写电话"));
    contactCell.appendChild(createContactLine(record.email, "未填写邮箱"));

    var departmentCell = document.createElement("td");
    departmentCell.dataset.label = "部门";
    departmentCell.appendChild(createValueNode(record.department));

    var statusCell = document.createElement("td");
    statusCell.dataset.label = "状态";
    statusCell.appendChild(createStatusBadge(record.status));

    var noteCell = document.createElement("td");
    noteCell.className = "note-cell";
    noteCell.dataset.label = "备注";
    noteCell.appendChild(createValueNode(record.note));
    noteCell.title = record.note || "";

    var updatedCell = document.createElement("td");
    updatedCell.className = "updated-cell";
    updatedCell.dataset.label = "更新时间";
    updatedCell.textContent = formatDate(record.updatedAt || record.createdAt);

    var actionCell = document.createElement("td");
    actionCell.className = "actions-column";
    actionCell.dataset.label = "操作";
    actionCell.appendChild(createRowActions(record));

    row.appendChild(nameCell);
    row.appendChild(contactCell);
    row.appendChild(departmentCell);
    row.appendChild(statusCell);
    row.appendChild(noteCell);
    row.appendChild(updatedCell);
    row.appendChild(actionCell);

    return row;
  }

  function createContactLine(value, emptyText) {
    var span = document.createElement("span");
    span.textContent = value || emptyText;
    if (!value) {
      span.className = "empty-value";
    }
    return span;
  }

  function createValueNode(value) {
    var span = document.createElement("span");
    span.textContent = value || "—";
    if (!value) {
      span.className = "empty-value";
    }
    return span;
  }

  function createStatusBadge(status) {
    var badge = document.createElement("span");
    var classMap = {
      "在职": "status-active",
      "试用": "status-probation",
      "休假": "status-leave",
      "离职": "status-resigned"
    };

    badge.className = "status-badge " + (classMap[status] || "status-active");
    badge.textContent = status || "在职";
    return badge;
  }

  function createRowActions(record) {
    var wrapper = document.createElement("div");
    wrapper.className = "row-actions";

    var editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.title = "编辑 " + (record.name || "这条记录");
    editButton.setAttribute("aria-label", editButton.title);
    editButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="m4 16-.8 4.8L8 20l10.6-10.6a2.4 2.4 0 0 0-3.4-3.4L4 16Z"></path><path d="m13.5 7.5 3 3"></path></svg>';
    editButton.addEventListener("click", function () {
      openRecordModal(record);
    });

    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button danger";
    deleteButton.title = "删除 " + (record.name || "这条记录");
    deleteButton.setAttribute("aria-label", deleteButton.title);
    deleteButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"></path></svg>';
    deleteButton.addEventListener("click", function () {
      deleteRecord(record);
    });

    wrapper.appendChild(editButton);
    wrapper.appendChild(deleteButton);
    return wrapper;
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return dateFormatter.format(date).replace(/\//g, "-");
  }

  function openRecordModal(record) {
    state.lastFocusedElement = document.activeElement;
    clearForm();

    if (record) {
      state.editingId = record.id;
      elements.recordId.value = String(record.id);
      elements.nameInput.value = record.name || "";
      elements.phoneInput.value = record.phone || "";
      elements.emailInput.value = record.email || "";
      elements.departmentInput.value = record.department || "";
      elements.statusInput.value = record.status || "在职";
      elements.noteInput.value = record.note || "";
      elements.modalEyebrow.textContent = "编辑记录";
      elements.modalTitle.textContent = "修改登记信息";
      elements.saveButton.textContent = "保存修改";
    } else {
      state.editingId = null;
      elements.modalEyebrow.textContent = "新增记录";
      elements.modalTitle.textContent = "填写登记信息";
      elements.saveButton.textContent = "保存记录";
    }

    elements.recordModal.hidden = false;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(function () {
      elements.nameInput.focus();
      elements.nameInput.select();
    });
  }

  function closeRecordModal() {
    elements.recordModal.hidden = true;
    document.body.style.overflow = "";
    clearForm();

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function clearForm() {
    elements.recordForm.reset();
    elements.recordId.value = "";
    state.editingId = null;
    clearFieldError(elements.nameInput, elements.nameError);
    clearFieldError(elements.phoneInput, elements.phoneError);
    clearFieldError(elements.emailInput, elements.emailError);
    elements.formError.textContent = "";
  }

  function clearFieldError(input, errorElement) {
    input.classList.remove("is-invalid");
    input.setCustomValidity("");
    errorElement.textContent = "";
    elements.formError.textContent = "";
  }

  function validateForm() {
    var isValid = true;
    var name = elements.nameInput.value.trim();
    var phone = elements.phoneInput.value.trim();
    var email = elements.emailInput.value.trim();

    clearFieldError(elements.nameInput, elements.nameError);
    clearFieldError(elements.phoneInput, elements.phoneError);
    clearFieldError(elements.emailInput, elements.emailError);

    if (!name) {
      setFieldError(elements.nameInput, elements.nameError, "请填写姓名。");
      isValid = false;
    } else if (name.length > 60) {
      setFieldError(elements.nameInput, elements.nameError, "姓名不能超过 60 个字符。");
      isValid = false;
    }

    if (phone && !/^[0-9+\-()\s]{6,30}$/.test(phone)) {
      setFieldError(elements.phoneInput, elements.phoneError, "手机号只能包含数字、空格和 + - ( ) 。");
      isValid = false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(elements.emailInput, elements.emailError, "请输入有效的邮箱地址。");
      isValid = false;
    }

    if (!isValid) {
      elements.formError.textContent = "请修正确认标出的内容后再保存。";
      var firstInvalid = elements.recordForm.querySelector(".is-invalid");
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }

    return isValid;
  }

  function setFieldError(input, errorElement, message) {
    input.classList.add("is-invalid");
    input.setCustomValidity(message);
    errorElement.textContent = message;
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    var payload = {
      name: elements.nameInput.value,
      phone: elements.phoneInput.value,
      email: elements.emailInput.value,
      department: elements.departmentInput.value,
      status: elements.statusInput.value,
      note: elements.noteInput.value
    };

    var editingId = state.editingId;
    setSaving(true);

    var action = editingId ? db.update(editingId, payload) : db.add(payload);

    action
      .then(function () {
        return loadRecords();
      })
      .then(function () {
        closeRecordModal();
        showToast(editingId ? "记录已更新。" : "记录已新增。");
      })
      .catch(function (error) {
        elements.formError.textContent = error.message || "保存失败，请重试。";
        showToast(error.message || "保存失败。", "error");
      })
      .finally(function () {
        setSaving(false);
      });
  }

  function setSaving(isSaving) {
    elements.saveButton.disabled = isSaving;
    elements.cancelButton.disabled = isSaving;
    elements.saveButton.textContent = isSaving ? "保存中…" : (state.editingId ? "保存修改" : "保存记录");
  }

  function deleteRecord(record) {
    var label = record.name ? "“" + record.name + "”" : "这条记录";
    var confirmed = window.confirm("确定要删除 " + label + " 吗？此操作无法撤销。");

    if (!confirmed) {
      return;
    }

    db.remove(record.id)
      .then(function () {
        return loadRecords();
      })
      .then(function () {
        showToast("记录已删除。");
      })
      .catch(function (error) {
        showToast(error.message || "删除失败。", "error");
      });
  }

  function updateSortButtons() {
    document.querySelectorAll(".sort-button").forEach(function (button) {
      if (button.dataset.sort === state.sortKey) {
        button.dataset.direction = state.sortDirection;
        button.setAttribute("aria-label", button.textContent.trim() + (state.sortDirection === "asc" ? "，升序" : "，降序"));
      } else {
        delete button.dataset.direction;
        button.removeAttribute("aria-label");
      }
    });
  }

  function exportCsv() {
    var records = getVisibleRecords();

    if (records.length === 0) {
      showToast("没有可导出的记录。", "error");
      return;
    }

    var headers = ["姓名", "手机号", "邮箱", "部门", "状态", "备注", "创建时间", "更新时间"];
    var rows = records.map(function (record) {
      return [
        record.name,
        record.phone,
        record.email,
        record.department,
        record.status,
        record.note,
        record.createdAt,
        record.updatedAt
      ];
    });
    var csv = [headers].concat(rows).map(function (row) {
      return row.map(escapeCsvValue).join(",");
    }).join("\r\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = "登记表-" + date + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
    showToast("已导出 " + records.length + " 条记录。");
  }

  function escapeCsvValue(value) {
    var text = String(value || "");
    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function setStorageState(status, message) {
    elements.storageState.classList.remove("is-ready", "is-error");
    elements.storageState.classList.add("is-" + status);
    elements.storageState.lastChild.nodeValue = " " + message;
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast" + (type === "error" ? " is-error" : "");
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);

    window.setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      window.setTimeout(function () {
        toast.remove();
      }, 180);
    }, 2600);
  }
})();
