const STORAGE_KEY = "etudiants";

function readStudents() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
        const students = JSON.parse(saved);
        if (!Array.isArray(students)) {
            throw new Error("Les données enregistrées ne sont pas au bon format.");
        }
        return students;
    }

    const legacyName = localStorage.getItem("nomEtudiant");
    const legacyFirstName = localStorage.getItem("prenomEtudiant");
    const legacyLevel = localStorage.getItem("niveauEtudiant");
    const legacyCourse = localStorage.getItem("filiereEtudiant");
    if (legacyName || legacyFirstName || legacyLevel || legacyCourse) {
        const migrated = [{
            id: `migre-${Date.now()}`,
            nom: legacyName || "",
            prenom: legacyFirstName || "",
            niveau: legacyLevel || "",
            filiere: legacyCourse || ""
        }];
        saveStudents(migrated);
        return migrated;
    }

    return [];
}

function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function showMessage(element, message) {
    if (element) {
        element.textContent = message;
    }
}

function initializeStudentForm() {
    const form = document.getElementById("student-form");
    if (!form) return;

    const status = document.getElementById("status-message");
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("id");
    const title = document.getElementById("form-title");
    const submitButton = document.getElementById("submit-button");
    let students;

    try {
        students = readStudents();
        if (studentId) {
            const student = students.find((item) => String(item.id) === studentId);
            if (!student) {
                showMessage(status, "Ce dossier étudiant est introuvable.");
                form.hidden = true;
                return;
            }
            form.elements.nom.value = student.nom || "";
            form.elements.prenom.value = student.prenom || "";
            form.elements.niveau.value = student.niveau || "";
            form.elements.filiere.value = student.filiere || "";
            title.textContent = "Modifier un étudiant";
            submitButton.textContent = "Enregistrer les modifications";
        }
    } catch (error) {
        showMessage(status, `Impossible de charger les étudiants : ${error.message}`);
        form.hidden = true;
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const student = {
            nom: form.elements.nom.value.trim(),
            prenom: form.elements.prenom.value.trim(),
            niveau: form.elements.niveau.value.trim(),
            filiere: form.elements.filiere.value.trim()
        };

        try {
            if (studentId) {
                const index = students.findIndex((item) => String(item.id) === studentId);
                if (index === -1) {
                    showMessage(status, "Ce dossier étudiant n'existe plus. Rechargez l'annuaire.");
                    return;
                }
                students[index] = { ...students[index], ...student };
            } else {
                student.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                students.push(student);
            }
            saveStudents(students);
            window.location.href = "index2.html";
        } catch (error) {
            showMessage(status, `Impossible d'enregistrer l'étudiant : ${error.message}`);
        }
    });
}

function initializeDirectory() {
    const list = document.getElementById("student-list");
    if (!list) return;

    const count = document.getElementById("student-count");
    const search = document.getElementById("search-input");
    const emptyState = document.getElementById("empty-state");
    const status = document.getElementById("directory-message");
    let students;

    try {
        students = readStudents();
    } catch (error) {
        showMessage(status, `Impossible de charger les étudiants : ${error.message}`);
        return;
    }

    function render() {
        const query = search.value.trim().toLocaleLowerCase("fr");
        const matches = students.filter((student) => {
            const fields = [student.nom, student.prenom, student.niveau, student.filiere];
            return fields.some((value) => String(value || "").toLocaleLowerCase("fr").includes(query));
        });

        count.textContent = String(students.length);
        list.replaceChildren();
        emptyState.hidden = matches.length > 0;
        if (students.length > 0 && matches.length === 0) {
            emptyState.querySelector("h3").textContent = "Aucun résultat";
            emptyState.querySelector("p").textContent = "Essayez une autre recherche.";
            emptyState.querySelector("a").hidden = true;
        } else if (students.length === 0) {
            emptyState.querySelector("h3").textContent = "Aucun étudiant pour le moment";
            emptyState.querySelector("p").textContent = "Ajoutez un premier dossier pour commencer votre annuaire.";
            emptyState.querySelector("a").hidden = false;
        }

        matches.forEach((student) => {
            const row = document.createElement("tr");
            row.append(
                createCell(`${student.prenom || ""} ${student.nom || ""}`.trim() || "Sans nom", "student-name"),
                createCell(student.niveau || "—"),
                createCell(student.filiere || "—")
            );

            const actions = document.createElement("td");
            const actionGroup = document.createElement("div");
            actionGroup.className = "row-actions";
            const editLink = document.createElement("a");
            editLink.className = "action-link";
            editLink.href = `index.html?id=${encodeURIComponent(student.id)}`;
            editLink.textContent = "Modifier";
            const deleteButton = document.createElement("button");
            deleteButton.className = "action-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => {
                const fullName = `${student.prenom || ""} ${student.nom || ""}`.trim();
                if (!window.confirm(`Supprimer le dossier de ${fullName || "cet étudiant"} ?`)) return;
                students = students.filter((item) => String(item.id) !== String(student.id));
                try {
                    saveStudents(students);
                    showMessage(status, "");
                    render();
                } catch (error) {
                    showMessage(status, `Impossible de supprimer l'étudiant : ${error.message}`);
                }
            });
            actionGroup.append(editLink, deleteButton);
            actions.append(actionGroup);
            row.append(actions);
            list.append(row);
        });
    }

    search.addEventListener("input", render);
    render();
}

function createCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
}

initializeStudentForm();
initializeDirectory();
