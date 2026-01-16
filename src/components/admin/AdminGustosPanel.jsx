import { useState } from "react";
import { createGusto } from "../../services/gustos.service";
import toast from "react-hot-toast";

const AdminGustosPanel = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("chocolates");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;

    try {
      setSaving(true);

      await createGusto({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        category,
      });

      toast.success("Gusto agregado 🍦");
      setName("");
    } catch (e) {
      toast.error("Error al agregar gusto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-gustos">
      <input
        placeholder="Nombre del gusto"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="chocolates">Chocolates</option>
        <option value="dulce-de-leche">Dulce de leche</option>
        <option value="cremas">Cremas</option>
        <option value="frutales">Frutales</option>
      </select>

      <button onClick={handleAdd} disabled={saving}>
        {saving ? "Agregando..." : "Agregar gusto"}
      </button>
    </div>
  );
};

export default AdminGustosPanel;
