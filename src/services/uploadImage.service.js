export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "productos");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/drcrkxli9/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Error subiendo imagen");
  }

  const data = await res.json();
  return data.secure_url;
};
