const getSafeUser = (user) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    photoUrl: user.photoUrl,
    age: user.age,
    gender: user.gender,
    about: user.about,
    interest: user.interest,
    city: user.city,
    country: user.country,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
};

module.exports = {
  getSafeUser,
};
