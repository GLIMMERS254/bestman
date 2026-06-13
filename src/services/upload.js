export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  return await res.json();
};