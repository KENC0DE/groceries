import React, { useState, useEffect } from "react";
import GroceryCard from "./GroceryCard.jsx";
import {
  fetchGroceries,
  updateGrocery,
  addGrocery,
  deleteGrocery,
} from "./googleSheetsService.js";
import { uploadImage } from "./imageUpload.js";
import "./App.css";

const CACHE_KEY = "groceries_cache";
const CACHE_TIMESTAMP_KEY = "groceries_cache_timestamp";
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

function App() {
  const [groceries, setGroceries] = useState([]);
  const [filteredGroceries, setFilteredGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [newItem, setNewItem] = useState({
    id: "",
    name: "",
    price: "",
    imageUrl: "",
  });

  // Load groceries on mount - use cache first
  useEffect(() => {
    // Validate Apps Script URL is configured
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "your_apps_script_url_here") {
      setError("Apps Script URL not configured! Please check your .env file.");
      setLoading(false);
      return;
    }
    loadGroceriesWithCache();
  }, []);

  // Filter groceries when search query or groceries change
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = filterAndSortGroceries(groceries, searchQuery);
      setFilteredGroceries(filtered);
    } else {
      setFilteredGroceries(groceries);
    }
  }, [searchQuery, groceries]);

  const loadGroceriesWithCache = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setGroceries(parsed);
        setLoading(false);

        // Fetch in background to check for updates (optional)
        // You can remove this if you want pure offline mode until changes
      } else {
        // No cache, fetch from server
        const data = await fetchGroceries();
        setGroceries(data);
        saveToCache(data);
      }
    } catch (err) {
      setError(
        "Failed to load groceries. Please check your Google Sheets configuration.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveToCache = (data) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  };

  const loadGroceries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGroceries();
      setGroceries(data);
      saveToCache(data);
    } catch (err) {
      setError(
        "Failed to load groceries. Please check your Google Sheets configuration.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortGroceries = (items, query) => {
    const lowerQuery = query.toLowerCase();

    // Filter items that match
    const matches = items.filter((item) =>
      item.name.toLowerCase().includes(lowerQuery),
    );

    // Sort: prioritize matches at the beginning
    return matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStartsWith = aName.startsWith(lowerQuery);
      const bStartsWith = bName.startsWith(lowerQuery);

      // Items starting with query come first
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Otherwise, alphabetical order
      return aName.localeCompare(bName);
    });
  };

  const handleUpdate = async (updatedItem, index) => {
    try {
      // Update locally first for instant UI update
      const updatedGroceries = [...groceries];
      updatedGroceries[index] = updatedItem;
      setGroceries(updatedGroceries);
      saveToCache(updatedGroceries);

      // Sync with server in background
      console.log("Syncing update to Google Sheets...");
      await updateGrocery(updatedItem, index);
      console.log("Update synced successfully!");
    } catch (err) {
      console.error("Failed to sync update to Google Sheets:", err);
      alert(
        "Warning: Changes saved locally but failed to sync to Google Sheets. Your changes will be lost if you clear browser cache.",
      );
      // If server update fails, reload from cache
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setGroceries(JSON.parse(cachedData));
      }
      throw new Error("Failed to update item");
    }
  };

  const handleDelete = async (index) => {
    try {
      // Delete locally first for instant UI update
      const updatedGroceries = groceries.filter((_, i) => i !== index);
      setGroceries(updatedGroceries);
      saveToCache(updatedGroceries);

      // Sync with server in background
      console.log("Syncing delete to Google Sheets...");
      await deleteGrocery(index);
      console.log("Delete synced successfully!");
    } catch (err) {
      console.error("Failed to sync delete to Google Sheets:", err);
      alert(
        "Warning: Item removed locally but failed to sync to Google Sheets. It may reappear if you reload from server.",
      );
      // If server delete fails, reload from cache
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setGroceries(JSON.parse(cachedData));
      }
      throw new Error("Failed to delete item");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!newItem.name || !newItem.price) {
      alert("Please fill in at least the name and price");
      return;
    }

    try {
      const itemToAdd = {
        ...newItem,
        id: Date.now().toString(),
      };

      // Add locally first for instant UI update
      const updatedGroceries = [...groceries, itemToAdd];
      setGroceries(updatedGroceries);
      saveToCache(updatedGroceries);
      setNewItem({ id: "", name: "", price: "", imageUrl: "" });
      setShowAddForm(false);

      // Sync with server in background
      console.log("Syncing new item to Google Sheets...", itemToAdd);
      await addGrocery(itemToAdd);
      console.log("Item synced successfully to Google Sheets!");
    } catch (err) {
      console.error("Failed to sync item to Google Sheets:", err);
      alert(
        "Warning: Item added locally but failed to sync to Google Sheets. Please check console for details.",
      );
    }
  };

  const handleCancelAdd = () => {
    setNewItem({ id: "", name: "", price: "", imageUrl: "" });
    setShowAddForm(false);
  };

  const handleNewItemImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress("Uploading...");

      const imageUrl = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      setNewItem({ ...newItem, imageUrl });
      setUploadProgress("");
    } catch (error) {
      alert(`Failed to upload image: ${error.message}`);
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading groceries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadGroceries} className="btn btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛒 Groceries List</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-add-toggle"
        >
          {showAddForm ? "Cancel" : "+ Add New Item"}
        </button>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search groceries... (min 2 letters)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length >= 2 && (
          <span className="search-results-count">
            {filteredGroceries.length} result
            {filteredGroceries.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {showAddForm && (
        <div className="add-item-form">
          <h2>Add New Item</h2>
          <form onSubmit={handleAddItem}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="e.g., Tomatoes"
                required
              />
            </div>
            <div className="form-group">
              <label>Price (ETB) *</label>
              <input
                type="number"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                placeholder="e.g., 25.50"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Image</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewItemImageUpload}
                  disabled={uploading}
                  id="new-item-image-upload"
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="new-item-image-upload"
                  className={`btn btn-upload-main ${uploading ? "uploading" : ""}`}
                >
                  {uploading ? uploadProgress : "📷 Upload Image"}
                </label>
                <input
                  type="text"
                  value={newItem.imageUrl}
                  onChange={(e) =>
                    setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  placeholder="Or paste image URL"
                  className="image-url-input-main"
                  disabled={uploading}
                />
                {newItem.imageUrl && (
                  <img
                    src={newItem.imageUrl}
                    alt="Preview"
                    className="image-preview"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-save">
                Add Item
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="btn btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="groceries-container">
        {searchQuery.length >= 2 && filteredGroceries.length === 0 ? (
          <div className="empty-state">
            <p>No items match "{searchQuery}"</p>
          </div>
        ) : filteredGroceries.length === 0 ? (
          <div className="empty-state">
            <p>No groceries yet. Click "Add New Item" to get started!</p>
          </div>
        ) : (
          filteredGroceries.map((item, index) => {
            // Find the original index in the full groceries array
            const originalIndex = groceries.findIndex((g) => g.id === item.id);
            return (
              <GroceryCard
                key={item.id}
                item={item}
                index={originalIndex}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </main>

      <footer className="app-footer">
        <button onClick={loadGroceries} className="btn btn-refresh">
          🔄 Refresh
        </button>
      </footer>
    </div>
  );
}

export default App;
