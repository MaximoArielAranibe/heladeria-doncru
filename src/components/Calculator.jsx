import React, { useState } from "react";

export default function Calculator() {
  const [costoLitro, setCostoLitro] = useState(0);
  const [margen, setMargen] = useState(2);

  const precioFinal = (litros) =>
    ((costoLitro * litros) * margen).toFixed(2);

  return (
    <div>
      <label>Costo por litro:</label>
      <input type="number" value={costoLitro} onChange={e=>setCostoLitro(e.target.value)} />

      <label>Margen multiplicador:</label>
      <input type="number" value={margen} onChange={e=>setMargen(e.target.value)} />

      <h3>Precios sugeridos:</h3>
      <ul>
        <li>1/4 kg: ${precioFinal(0.25)}</li>
        <li>1/2 kg: ${precioFinal(0.5)}</li>
        <li>1 kg: ${precioFinal(1)}</li>
      </ul>
    </div>
  );
}
