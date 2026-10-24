const STORAGE_KEY = "studentHubRecords";

let students = [];

try {
    students = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(students)) {
        students = [];
    }
} catch {
    students = [];
}

let editingId = null;

const studentForm = document.getElementById("student-form");

const studentTable = document.getElementById("student-table");

const recentStudents = document.getElementById("recent-students");

const searchInput = document.getElementById("search-input");

const departmentFilter = document.getElementById("department-filter");

const emptyMessage = document.getElementById("empty-message");

const pageTitle = document.getElementById("page-title");

const formHeading = document.getElementById("form-heading");

function saveToStorage() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(students)
    );
}

function showPage(pageName) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.add("hidden");
    });

    document.getElementById(`${pageName}-page`).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const titles = {
        dashboard: "Dashboard",
        students: "Students",
        add: editingId ? "Edit Student" : "Add Student"
    };

    pageTitle.textContent = titles[pageName];

    if (pageName === "add") {
        formHeading.textContent = editingId
            ? "Edit Student Details"
            : "Register New Student";
    }

    renderAll();
}

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        if (button.dataset.page === "add") {
            resetForm();
        }

        showPage(button.dataset.page);
    });
});

document.getElementById("add-student-btn").addEventListener("click", () => {
    resetForm();
    showPage("add");
});

document.getElementById("cancel-btn").addEventListener("click", () => {
    resetForm();
    showPage("students");
});

function resetForm() {
    studentForm.reset();
    editingId = null;
    formHeading.textContent = "Register New Student";
    pageTitle.textContent = "Add Student";
}

studentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const student = {
        usn: document.getElementById("usn").value.trim().toUpperCase(),
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        department: document.getElementById("department").value,
        semester: document.getElementById("semester").value
    };

    if (
        !student.usn ||
        !student.name ||
        !student.email ||
        !student.phone ||
        !student.department ||
        !student.semester
    ) {
        alert("Please fill in all fields.");
        return;
    }

    const duplicateUSN = students.some((existingStudent) => {
        return (
            existingStudent.usn === student.usn &&
            existingStudent.id !== editingId
        );
    });

    if (duplicateUSN) {
        alert("This USN already exists. Please enter a unique USN.");
        return;
    }

    if (editingId) {
        students = students.map((existingStudent) => {
            return existingStudent.id === editingId
                ? { ...student, id: editingId }
                : existingStudent;
        });

        alert("Student updated successfully!");
    } else {
        student.id = Date.now().toString();
        student.createdAt = new Date().toISOString();

        students.push(student);

        alert("Student added successfully!");
    }

    saveToStorage();
    resetForm();
    showPage("students");
});

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function renderStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const selectedDepartment = departmentFilter.value;

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchTerm) ||
            student.usn.toLowerCase().includes(searchTerm);

        const matchesDepartment =
            !selectedDepartment ||
            student.department === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    studentTable.innerHTML = filteredStudents.map((student) => `
        <tr>
            <td>${escapeHTML(student.usn)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.department)}</td>
            <td>${escapeHTML(student.semester)}</td>
            <td>
                <button
                    class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(student.id)}"
                >
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(student.id)}"
                >
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

    emptyMessage.classList.toggle(
        "hidden",
        filteredStudents.length !== 0
    );
}

studentTable.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editStudent(id);
    }

    if (action === "delete") {
        deleteStudent(id);
    }
});

function editStudent(id) {
    const student = students.find((item) => item.id === id);

    if (!student) {
        return;
    }

    editingId = id;

    document.getElementById("usn").value = student.usn;
    document.getElementById("name").value = student.name;
    document.getElementById("email").value = student.email;
    document.getElementById("phone").value = student.phone;
    document.getElementById("department").value = student.department;
    document.getElementById("semester").value = student.semester;

    showPage("add");
}

function deleteStudent(id) {
    const student = students.find((item) => item.id === id);

    if (!student) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) {
        return;
    }

    students = students.filter((item) => item.id !== id);

    saveToStorage();
    renderAll();

    alert("Student deleted successfully!");
}

searchInput.addEventListener("input", renderStudents);

departmentFilter.addEventListener("change", renderStudents);

function renderDashboard() {
    document.getElementById("total-students").textContent =
        students.length;

    document.getElementById("total-departments").textContent =
        new Set(students.map((student) => student.department)).size;

    document.getElementById("latest-students").textContent =
        students.filter((student) => {
            const createdAt = new Date(student.createdAt);

            const today = new Date();

            return (
                student.createdAt &&
                createdAt.toDateString() === today.toDateString()
            );
        }).length;

    const recent = [...students].reverse().slice(0, 5);

    recentStudents.innerHTML = recent.map((student) => `
        <tr>
            <td>${escapeHTML(student.usn)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.department)}</td>
            <td>${escapeHTML(student.semester)}</td>
        </tr>
    `).join("");
}

function renderAll() {
    renderDashboard();
    renderStudents();
}

renderAll();
showPage("dashboard");