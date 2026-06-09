const CLOUD_NAME = "dkmalg5kj";
const UPLOAD_PRESET = "975463513285393";

export async function uploadToCloudinary(file, type) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.secure_url;
}