// Google Apps Script Service
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Fetch all grocery items from Google Sheets via Apps Script
export const fetchGroceries = async () => {
  try {
    const response = await fetch(APPS_SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row and convert to objects
    const groceries = rows.slice(1).map((row, index) => ({
      id: row[0] || `temp-${index}`,
      name: row[1] || "",
      price: row[2] || "0",
      imageUrl: row[3] || "",
    }));

    return groceries;
  } catch (error) {
    console.error("Error fetching groceries:", error);
    throw error;
  }
};

// Update a single grocery item
export const updateGrocery = async (item, rowIndex) => {
  try {
    const url = `${APPS_SCRIPT_URL}?action=update&row=${rowIndex + 2}&id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&price=${encodeURIComponent(item.price)}&imageUrl=${encodeURIComponent(item.imageUrl)}`;

    const response = await fetch(url, {
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Error updating data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating grocery:", error);
    throw error;
  }
};

// Add a new grocery item
export const addGrocery = async (item) => {
  try {
    const url = `${APPS_SCRIPT_URL}?action=add&id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&price=${encodeURIComponent(item.price)}&imageUrl=${encodeURIComponent(item.imageUrl)}`;

    const response = await fetch(url, {
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Error adding data: ${response.statusText}`);
    }

    const result = await response.json();

    // Check if server returned an error (e.g., duplicate item)
    if (result.status === "error") {
      throw new Error(result.message || "Failed to add item");
    }

    return result;
  } catch (error) {
    console.error("Error adding grocery:", error);
    throw error;
  }
};

// Delete a grocery item
export const deleteGrocery = async (rowIndex) => {
  try {
    const url = `${APPS_SCRIPT_URL}?action=delete&row=${rowIndex + 2}`;

    const response = await fetch(url, {
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Error deleting data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting grocery:", error);
    throw error;
  }
};
