
import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/leads";

function App() {
  const emptyLead = {
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "Website",
  };

  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const leadsPerPage = 5;

  // Fetch leads from backend
  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to fetch leads");
        }

        const data = await response.json();
        setLeads(data);
      } catch (err) {
        setError(
          "Could not connect to backend. Please check whether your server is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  // Dashboard statistics
  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  const convertedLeads = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;

  // Search and filter
  const filteredLeads = leads.filter((lead) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (lead.name || "").toLowerCase().includes(searchText) ||
      (lead.email || "").toLowerCase().includes(searchText) ||
      (lead.company || "").toLowerCase().includes(searchText) ||
      (lead.phone || "").toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "All" || lead.status === filter;

    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredLeads.length / leadsPerPage
  );

  const startIndex = (currentPage - 1) * leadsPerPage;

  const currentLeads = filteredLeads.slice(
    startIndex,
    startIndex + leadsPerPage
  );

  // Format date
  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN");
  }

  // Add new lead
  async function addLead(e) {
    e.preventDefault();

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLead),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add lead");
      }

      setLeads((previousLeads) => [
        ...previousLeads,
        data.lead,
      ]);

      setNewLead({ ...emptyLead });
      setShowForm(false);
      setCurrentPage(
        Math.ceil((filteredLeads.length + 1) / leadsPerPage)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Update lead status
  async function updateStatus(id, status) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update status");
      }

      setLeads((previousLeads) =>
        previousLeads.map((lead) =>
          lead.id === id ? data.lead : lead
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Edit lead
  async function saveEdit(e) {
    e.preventDefault();

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${editingLead.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingLead),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update lead");
      }

      setLeads((previousLeads) =>
        previousLeads.map((lead) =>
          lead.id === editingLead.id ? data.lead : lead
        )
      );

      setEditingLead(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete lead
  async function deleteLead(id) {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete lead");
      }

      setLeads((previousLeads) =>
        previousLeads.filter((lead) => lead.id !== id)
      );

      if (
        currentPage > 1 &&
        currentLeads.length === 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Export leads to CSV
  function exportLeads() {
    if (leads.length === 0) {
      alert("No leads available to export!");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Source",
      "Date Added",
      "Status",
    ];

    const rows = leads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.company || "",
      lead.source || "Website",
      formatDate(lead.createdAt),
      lead.status || "New",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "MiniCRM_Leads.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">
          Mini<span>CRM</span>
        </h2>

        <p className="menu-heading">MENU</p>

        <div className="menu-item active">
          <span>▦</span> Dashboard
        </div>

        <div className="menu-item">
          <span>♙</span> Leads
        </div>

        <div className="menu-item">
          <span>⚙</span> Settings
        </div>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* Header */}
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Manage your client leads in one place.</p>
          </div>

          <button
            className="add-button"
            onClick={() => {
              setShowForm(!showForm);
              setEditingLead(null);
            }}
          >
            + Add Lead
          </button>
        </header>

        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}

        {/* Dashboard Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">♙</div>
            <p>Total Leads</p>
            <h2>{totalLeads}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>New Leads</p>
            <h2>{newLeads}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">↗</div>
            <p>Contacted</p>
            <h2>{contactedLeads}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Converted</p>
            <h2>{convertedLeads}</h2>
          </div>

        </section>

        {/* Add Lead Form */}
        {showForm && (
          <section className="form-card">
            <h2>Add New Lead</h2>

            <form onSubmit={addLead}>

              <input
                type="text"
                placeholder="Client name"
                value={newLead.name}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email address"
                value={newLead.email}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={newLead.phone}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    phone: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Company name"
                value={newLead.company}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    company: e.target.value,
                  })
                }
              />

              <select
                value={newLead.source}
                onChange={(e) =>
                  setNewLead({
                    ...newLead,
                    source: e.target.value,
                  })
                }
              >
                <option>Website</option>
                <option>Referral</option>
                <option>Social Media</option>
              </select>

              <button type="submit" className="add-button">
                Save Lead
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

            </form>
          </section>
        )}

        {/* Edit Lead Form */}
        {editingLead && (
          <section className="form-card">
            <h2>Edit Lead</h2>

            <form onSubmit={saveEdit}>

              <input
                type="text"
                placeholder="Client name"
                value={editingLead.name}
                onChange={(e) =>
                  setEditingLead({
                    ...editingLead,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email address"
                value={editingLead.email}
                onChange={(e) =>
                  setEditingLead({
                    ...editingLead,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={editingLead.phone || ""}
                onChange={(e) =>
                  setEditingLead({
                    ...editingLead,
                    phone: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Company name"
                value={editingLead.company || ""}
                onChange={(e) =>
                  setEditingLead({
                    ...editingLead,
                    company: e.target.value,
                  })
                }
              />

              <select
                value={editingLead.source || "Website"}
                onChange={(e) =>
                  setEditingLead({
                    ...editingLead,
                    source: e.target.value,
                  })
                }
              >
                <option>Website</option>
                <option>Referral</option>
                <option>Social Media</option>
              </select>

              <button type="submit" className="add-button">
                Update Lead
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingLead(null)}
              >
                Cancel
              </button>

            </form>
          </section>
        )}

        {/* Leads Section */}
        <section className="leads-section">

          <div className="section-header">
            <div>
              <h2>Recent Leads</h2>
              <p>View and manage your client information.</p>
            </div>

            <button
              className="add-button"
              onClick={exportLeads}
            >
              ↓ Export CSV
            </button>
          </div>

          {/* Search and Filter */}
          <div className="toolbar">

            <input
              type="text"
              placeholder="Search by name, email, phone or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />

            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>

          </div>

          {/* Leads Table */}
          <div className="table-container">
            <table>

              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>COMPANY</th>
                  <th>SOURCE</th>
                  <th>DATE ADDED</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      Loading leads...
                    </td>
                  </tr>
                ) : currentLeads.length > 0 ? (

                  currentLeads.map((lead) => (
                    <tr key={lead.id}>

                      <td>
                        <strong>{lead.name}</strong>
                      </td>

                      <td>{lead.email}</td>

                      <td>{lead.phone || "-"}</td>

                      <td>{lead.company || "-"}</td>

                      <td>{lead.source || "Website"}</td>

                      <td>{formatDate(lead.createdAt)}</td>

                      <td>
                        <select
                          className={`status-select ${(lead.status || "New").toLowerCase()}`}
                          value={lead.status || "New"}
                          onChange={(e) =>
                            updateStatus(lead.id, e.target.value)
                          }
                        >
                          <option>New</option>
                          <option>Contacted</option>
                          <option>Qualified</option>
                          <option>Converted</option>
                          <option>Lost</option>
                        </select>
                      </td>

                      <td>
                        <button
                          className="add-button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingLead({ ...lead });
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => deleteLead(lead.id)}
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))

                ) : (

                  <tr>
                    <td colSpan="8" className="empty-message">
                      No leads found.
                    </td>
                  </tr>

                )}

              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredLeads.length > 0 && (
            <div className="pagination">

              <p>
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + leadsPerPage,
                  filteredLeads.length
                )}{" "}
                of {filteredLeads.length} leads
              </p>

              <div className="pagination-buttons">

                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage(currentPage - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage(currentPage + 1)
                  }
                >
                  Next
                </button>

              </div>
            </div>
          )}

        </section>

        {/* Footer */}
        <footer>
          © 2026 MiniCRM. Client Lead Management System.
        </footer>

      </main>
    </div>
  );
}

export default App;
