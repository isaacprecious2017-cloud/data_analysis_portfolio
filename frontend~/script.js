const API_URL = "http://localhost:5000";

const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const documentsList = document.getElementById("documentsList");

const projectsList = document.getElementById("projectsList");
const contactForm = document.getElementById("contactForm");
const contactResponse = document.getElementById("contactResponse");

// UPLOAD DOCUMENT
uploadForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const file = document.getElementById("file").files[0];

  const formData = new FormData();

  formData.append("title", title);
  formData.append("category", category);
  formData.append("description", description);
  formData.append("file", file);

  try {
    uploadMessage.textContent = "Uploading document...";

    const response = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      uploadMessage.textContent = "Document uploaded successfully";
      uploadForm.reset();
      fetchDocuments();
    } else {
      uploadMessage.textContent = result.message || "Upload failed";
    }
  } catch (error) {
    uploadMessage.textContent = "Server error. Make sure backend is running.";
  }
});

// FETCH DOCUMENTS
async function fetchDocuments() {
  try {
    const response = await fetch(`${API_URL}/api/documents`);
    const documents = await response.json();

    documentsList.innerHTML = "";

    if (documents.length === 0) {
      documentsList.innerHTML = "<p>No portfolio documents uploaded yet.</p>";
      return;
    }

    documents.forEach(function (documentItem) {
      const card = document.createElement("div");
      card.className = "document-card";

      card.innerHTML = `
        <h3>${documentItem.title}</h3>
        <p><strong>Category:</strong> ${documentItem.category}</p>
        <p>${documentItem.description}</p>
        <a href="${API_URL}${documentItem.file_path}" target="_blank">View Document</a>
      `;

      documentsList.appendChild(card);
    });
  } catch (error) {
    documentsList.innerHTML = "<p>Could not load documents.</p>";
  }
}

// FETCH PROJECTS
async function fetchProjects() {
  try {
    const response = await fetch(`${API_URL}/api/projects`);
    const projects = await response.json();

    projectsList.innerHTML = "";

    if (projects.length === 0) {
      projectsList.innerHTML = "<p>No projects added yet.</p>";
      return;
    }

    projects.forEach(function (project) {
      const card = document.createElement("div");
      card.className = "project-card";

      card.innerHTML = `
        <span class="category">${project.category}</span>
        <h3>${project.title}</h3>
        <p><strong>Tools:</strong> ${project.tools}</p>
        <p>${project.description}</p>
        <p><strong>Insight:</strong> ${project.insight || "Not added yet"}</p>
        ${
          project.project_link
            ? `<a href="${project.project_link}" target="_blank">View Project</a>`
            : ""
        }
      `;

      projectsList.appendChild(card);
    });
  } catch (error) {
    projectsList.innerHTML = "<p>Could not load projects.</p>";
  }
}

// CONTACT FORM
contactForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const full_name = document.getElementById("fullName").value;
  const email = document.getElementById("contactEmail").value;
  const subject = document.getElementById("contactSubject").value;
  const message = document.getElementById("contactMessage").value;

  try {
    contactResponse.textContent = "Sending message...";

    const response = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name,
        email,
        subject,
        message
      })
    });

    const result = await response.json();

    if (response.ok) {
      contactResponse.textContent = "Message sent successfully";
      contactForm.reset();
    } else {
      contactResponse.textContent = result.message || "Message could not be sent";
    }
  } catch (error) {
    contactResponse.textContent = "Server error. Make sure backend is running.";
  }
});

// LOAD DATA WHEN PAGE OPENS
fetchDocuments();
fetchProjects();