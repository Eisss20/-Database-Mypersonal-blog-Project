export const validatePostData = (req, res, next) => {
  const { title, image, category_id, description, contend, status_id } =
    req.body;

  if (!title) {
    res.status(400).json({ message: "Title is required" });
  }

  if (typeof title !== "string") {
    res.status(400).json({ message: "Title must be a string" });
  }

  if (!image) {
    res.status(400).json({ message: "Image is required" });
  }

  if (typeof image !== "string") {
    res.status(400).json({ message: "Image must be a URL string" });
  }

  if (!category_id) {
    res.status(400).json({ message: " Category ID number is required " });
  }

  if (typeof category_id !== "number") {
    res.status(400).json({ message: "Category ID must be number" });
  }

  if (!description) {
    res.status(400).json({ message: " Category ID number is required " });
  }

  if (typeof description !== "string") {
    res.status(400).json({ message: "Description is a required " });
  }

  if (!contend) {
    res.status(400).json({ message: "Contend is a required" });
  }

  if (typeof contend !== "string") {
    res.status(400).json({ message: " Contend must be string " });
  }

  if (!status_id) {
    res.status(400).json({ message: "Status ID number is a required" });
  }

  if (typeof status_id !== "number") {
    res.status(400).json({ message: "Status ID must be number " });
  }

  next();
};

export default validatePostData