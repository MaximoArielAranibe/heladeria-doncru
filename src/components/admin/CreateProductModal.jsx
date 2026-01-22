import { useState, useEffect } from "react";
import { createProduct } from "../../services/products.service";
import { uploadProductImage } from "../../services/uploadImage.service";
import "../../styles/CreateProductModal.scss";

const INITIAL_STATE = {
  title: "",
  description: "",
  price: "",
  category: "tamaños",
  maxGustos: "",
  featured: false,
  masVendido: false,
};

const CreateProductModal = ({
  open,
  onClose,
  defaultCategory = "tamaños",
}) => {
  const [form, setForm] = useState({
    ...INITIAL_STATE,
    category: defaultCategory,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      category: defaultCategory,
    }));
  }, [defaultCategory]);

/*   if (!open) return null;
 */
  /* =====================
     SYNC CATEGORY
  ===================== */
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      category: defaultCategory,
    }));
  }, [defaultCategory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.title.trim()) return "Nombre obligatorio";
    if (!form.price || Number(form.price) <= 0)
      return "Precio inválido";
    if (!form.maxGustos || Number(form.maxGustos) <= 0)
      return "Máx gustos inválido";
    if (!imageFile) return "Imagen obligatoria";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imageUrl = await uploadProductImage(imageFile);

      await createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        maxGustos: Number(form.maxGustos),
        thumbnail: imageUrl,
        featured: form.featured,
        masVendido: form.masVendido,
      });

      setForm({
        ...INITIAL_STATE,
        category: defaultCategory,
      });
      setImageFile(null);
      setPreview(null);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="create-product-modal__backdrop">
          <div className="create-product-modal">
            <header className="create-product-modal__header">
              <h3>Nuevo producto</h3>
              <button onClick={onClose}>✖</button>
            </header>

            <form
              className="create-product-modal__form"
              onSubmit={handleSubmit}
            >
              <input
                name="title"
                placeholder="Nombre (Helado 3/4 kg)"
                value={form.title}
                onChange={handleChange}
              />

              <textarea
                name="description"
                placeholder="Descripción"
                value={form.description}
                onChange={handleChange}
              />

              <input
                type="number"
                name="price"
                placeholder="Precio"
                value={form.price}
                onChange={handleChange}
              />

              <input
                type="number"
                name="maxGustos"
                placeholder="Máx gustos"
                value={form.maxGustos}
                onChange={handleChange}
              />

              <div>
                <p>Categorías:</p>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="tamaños">Tamaños</option>
                  <option value="postres">Postres</option>
                </select>
              </div>

              {/* 📸 IMAGEN */}
              <div
                className="create-product-modal__image-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImage(e.dataTransfer.files[0]);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  id="createProductImageInput"
                  onChange={(e) =>
                    handleImage(e.target.files[0])
                  }
                />

                {!preview ? (
                  <label htmlFor="createProductImageInput">
                    Arrastrá o hacé click para subir imagen
                  </label>
                ) : (
                  <div className="create-product-modal__image-preview">
                    <img src={preview} alt="preview" />
                    <button
                      type="button"
                      className="create-product-modal__change-image-btn"
                      onClick={() =>
                        document
                          .getElementById(
                            "createProductImageInput"
                          )
                          .click()
                      }
                    >
                      Cambiar imagen
                    </button>
                  </div>
                )}
              </div>

              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Destacado
              </label>

              <label>
                <input
                  type="checkbox"
                  name="masVendido"
                  checked={form.masVendido}
                  onChange={handleChange}
                />
                Más vendido
              </label>

              {error && (
                <p className="create-product-modal__error">
                  {error}
                </p>
              )}

              <footer className="create-product-modal__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? "Subiendo…" : "Crear producto"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );

};

export default CreateProductModal;
