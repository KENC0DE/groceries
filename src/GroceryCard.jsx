import React, { useState } from "react";
import "./GroceryCard.css";
import { uploadImage } from "./imageUpload.js";

const GroceryCard = ({ item, onUpdate, onDelete, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);

  const handleSave = async () => {
    try {
      await onUpdate(editedItem, index);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update item. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditedItem({ ...item });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await onDelete(index);
      } catch (error) {
        alert("Failed to delete item. Please try again.");
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress("Uploading...");

      const imageUrl = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      setEditedItem({ ...editedItem, imageUrl });
      setUploadProgress("");
    } catch (error) {
      alert(`Failed to upload image: ${error.message}`);
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grocery-card">
      <div className="grocery-card-image">
        {isEditing ? (
          <div className="image-edit-container">
            <img
              src={
                editedItem.imageUrl ||
                "https://via.placeholder.com/150?text=No+Image"
              }
              alt={editedItem.name}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150?text=No+Image";
              }}
            />
            <div className="image-upload-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                id={`image-upload-${item.id}`}
                style={{ display: "none" }}
              />
              <label
                htmlFor={`image-upload-${item.id}`}
                className={`btn-upload ${uploading ? "uploading" : ""}`}
              >
                {uploading ? uploadProgress : "📷 Upload"}
              </label>
              <input
                type="text"
                value={editedItem.imageUrl}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, imageUrl: e.target.value })
                }
                placeholder="Or paste URL"
                className="image-url-input-small"
                disabled={uploading}
              />
            </div>
          </div>
        ) : (
          <img
            src={
              editedItem.imageUrl ||
              "https://via.placeholder.com/150?text=No+Image"
            }
            alt={editedItem.name}
            onClick={() => editedItem.imageUrl && setShowImageModal(true)}
            style={{ cursor: editedItem.imageUrl ? "pointer" : "default" }}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150?text=No+Image";
            }}
          />
        )}
      </div>

      <div className="grocery-card-content">
        <div className="grocery-card-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedItem.name}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, name: e.target.value })
                }
                placeholder="Item name"
                className="name-input"
              />
              <input
                type="number"
                value={editedItem.price}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, price: e.target.value })
                }
                placeholder="Price"
                className="price-input"
                step="0.01"
              />
            </>
          ) : (
            <>
              <h3 className="grocery-name">{item.name}</h3>
              <p className="grocery-price">{item.price} ETB</p>
            </>
          )}
        </div>
        <div className="grocery-card-actions">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn btn-save">
                Save
              </button>
              <button onClick={handleCancel} className="btn btn-cancel">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-edit"
              >
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-delete">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {showImageModal && (
        <>
          <div
            className="image-modal-overlay"
            onClick={() => setShowImageModal(false)}
          ></div>
          <div className="image-modal">
            <button
              className="image-modal-close"
              onClick={() => setShowImageModal(false)}
            >
              ✕
            </button>
            <img
              src={editedItem.imageUrl}
              alt={editedItem.name}
              className="image-modal-img"
            />
            <p className="image-modal-title">{editedItem.name}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default GroceryCard;
