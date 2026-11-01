const toPublicUser = ({ id, name, email, gender, createdAt }) => ({
  id,
  name,
  email,
  gender,
  createdAt,
});

module.exports = toPublicUser;
