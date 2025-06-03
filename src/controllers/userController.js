export async function getAllUsers(req, res) {
  // placeholder: later call your ORM or database
  res.json([{ id: 1, name: 'Alice' }]);
}

export async function getUserById(req, res) {
  const { id } = req.params;
  // placeholder: lookup user by id
  res.json({ id, name: 'Alice' });
}